import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { Activity, AppState, Category, Lang, LibraryItem } from "../model/types";
import { blankElementText } from "../model/types";
import { createDefaultState } from "../data/defaultCategories";
import { applyImportPlan, parseImportPlan, type ImportParseResult } from "../csv/importCsv";
import { exportCsv } from "../csv/exportCsv";
import { exportJson, parseJsonBackup, type JsonParseResult } from "../json/backupJson";

let idSeq = 0;
function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${idSeq}`;
}

/** Older saved data may still carry now-removed or later-added concepts:
 *  a category with kind:null (the old "pure prose, no elements" shape
 *  Profil used to use), a category kind:"tags" whose items kept their
 *  name in a separate `tagValue` field instead of `head`, an item created
 *  before the optional `comment` field existed at all, and an item from
 *  when that same idea was a subgroup label stored separately as
 *  `item.group` rather than a per-language comment under the heading.
 *  This folds all of it into the current shape — moving a blank-kind
 *  category's blurb text into a real item, copying any item's `tagValue`
 *  into `head`, moving `group.da`/`group.en` into `da.comment`/`en.comment`,
 *  and backfilling a blank `comment` — so an existing user's real typed
 *  content survives the format changes instead of silently vanishing (or
 *  crashing the app outright). */
function migrateToUnifiedCategoryModel(state: unknown): unknown {
  if (!state || typeof state !== "object") return state;
  const s = state as Record<string, unknown>;
  const categories = s.categories as Record<string, Record<string, unknown>> | undefined;
  if (!categories || typeof categories !== "object") return state;

  const items = { ...((s.items as Record<string, Record<string, unknown>>) ?? {}) };
  const selectedItems = { ...((s.selectedItems as Record<string, string[]>) ?? {}) };
  const nextCategories: Record<string, Record<string, unknown>> = {};

  Object.entries(categories).forEach(([id, cat]) => {
    if (!cat) return;
    const { kind, blurb, ...rest } = cat;
    nextCategories[id] = { ...rest, blurb: kind === null ? { da: "", en: "" } : (blurb ?? { da: "", en: "" }) };

    if (kind === null) {
      const oldBlurb = (blurb as { da?: string; en?: string } | undefined) ?? {};
      if (oldBlurb.da || oldBlurb.en) {
        const itemId = newId(`migrated_${id}`);
        items[itemId] = {
          id: itemId,
          categoryId: id,
          isUserCreated: true,
          da: { head: "", meta: "", comment: "", desc: oldBlurb.da ?? "" },
          en: { head: "", meta: "", comment: "", desc: oldBlurb.en || oldBlurb.da || "" },
          activities: [],
        };
        selectedItems[id] = [itemId, ...(selectedItems[id] ?? [])];
      }
    }
  });

  Object.keys(items).forEach((id) => {
    if (!items[id]) return;
    const group = items[id].group as { da?: string; en?: string } | undefined;
    (["da", "en"] as const).forEach((lang) => {
      const text = (items[id][lang] as Record<string, unknown> | undefined) ?? {};
      let rest = text;
      if ("tagValue" in text) {
        const { tagValue, ...withoutTagValue } = text;
        rest = { ...withoutTagValue, head: withoutTagValue.head || (tagValue as string) || "" };
      }
      const comment = "comment" in rest ? rest.comment : (group?.[lang] ?? "");
      items[id] = { ...items[id], [lang]: { ...rest, comment } };
    });
    if ("group" in items[id]) {
      const { group: _oldGroup, ...withoutGroup } = items[id];
      items[id] = withoutGroup;
    }
  });

  return { ...s, categories: nextCategories, items, selectedItems };
}

/** Falls back to an in-memory map when localStorage isn't reachable (a
 *  sandboxed iframe with storage access blocked can throw just reading
 *  the `localStorage` property) — otherwise that throw happens during
 *  the persist middleware's initial hydration, before React ever
 *  renders, and the app shows a blank page with no visible error. */
const memoryFallback = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

export interface Store extends AppState {
  setLang(lang: Lang): void;

  setCategoryTitle(categoryId: string, lang: Lang, value: string): void;
  setCategoryBlurb(categoryId: string, lang: Lang, value: string): void;
  addCategory(name: string): void;
  /** Built-ins are hidden (restorable via restoreHiddenCategories); custom
   *  categories are removed for good. Same operation the CSV import uses
   *  when a category drops out of an imported file. */
  removeCategory(categoryId: string): void;
  restoreHiddenCategories(): void;
  toggleCategoryOn(categoryId: string): void;
  setVariant(categoryId: string, variant: string): void;
  moveCategory(categoryId: string, direction: -1 | 1): void;
  /** Drag-and-drop reorder: moves draggedId to sit just before targetId. */
  reorderCategory(draggedId: string, targetId: string): void;

  addItem(categoryId: string): string;
  /** Deletes the item from the library outright (and drops it from every
   *  category's selection). */
  deleteItem(itemId: string): void;
  moveItem(categoryId: string, itemId: string, direction: -1 | 1): void;
  toggleItemInCv(categoryId: string, itemId: string): void;
  setItemField(itemId: string, lang: Lang, field: "head" | "meta" | "comment" | "desc", value: string): void;

  addActivity(itemId: string, da: string, en: string): void;
  removeActivity(itemId: string, index: number): void;
  setActivity(itemId: string, index: number, lang: Lang, value: string): void;
  toggleActivitySelected(itemId: string, index: number): void;

  setAppliedTitle(lang: Lang, value: string): void;
  setKeywords(lang: Lang, value: string): void;
  setHeaderField(field: "name" | "phone" | "mail", value: string): void;
  setHeaderLocation(lang: Lang, value: string): void;

  setDesign(
    field: "font" | "scheme" | "headSize" | "struct" | "headKind" | "density" | "sidebarSide" | "headingSize",
    value: string,
  ): void;
  setFooterEnabled(enabled: boolean): void;
  setFooterRevision(revision: string): void;

  parseImport(text: string): ImportParseResult;
  commitImport(plan: Parameters<typeof applyImportPlan>[1]): void;
  exportCsvText(): string;

  /** Full-state backup, distinct from the CSV: also carries header contact
   *  details, design tokens, per-category variants, on/off toggles and
   *  order, applied title and keywords — restoring one puts the app back
   *  exactly as it was, not just the content library. */
  parseJsonImport(text: string): JsonParseResult;
  commitJsonImport(data: Partial<AppState>): void;
  exportJsonText(): string;

  resetAll(): void;
}

function itemsForCategory(state: AppState, categoryId: string): LibraryItem[] {
  return Object.values(state.items).filter((it) => it.categoryId === categoryId);
}

export function selectedActivityIndices(state: AppState, item: LibraryItem): number[] {
  const sel = state.selectedActivities[item.id];
  if (sel) return sel;
  return item.activities.map((_, i) => i);
}

export function isActivitySelected(state: AppState, item: LibraryItem, index: number): boolean {
  return selectedActivityIndices(state, item).includes(index);
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),

      setLang: (lang) => set({ lang }),

      setCategoryTitle: (categoryId, lang, value) =>
        set((s) => {
          const cat = s.categories[categoryId];
          if (!cat) return s;
          return {
            categories: { ...s.categories, [categoryId]: { ...cat, title: { ...cat.title, [lang]: value } } },
          };
        }),

      setCategoryBlurb: (categoryId, lang, value) =>
        set((s) => {
          const cat = s.categories[categoryId];
          if (!cat) return s;
          return {
            categories: { ...s.categories, [categoryId]: { ...cat, blurb: { ...cat.blurb, [lang]: value } } },
          };
        }),

      addCategory: (name) => {
        const value = name.trim();
        if (!value) return;
        const id = newId("custom");
        const category: Category = {
          id,
          title: { da: value, en: value },
          blurb: { da: "", en: "" },
          isCustom: true,
          isHidden: false,
          isReplacedByImport: false,
        };
        set((s) => ({
          categories: { ...s.categories, [id]: category },
          order: [...s.order, id],
          on: { ...s.on, [id]: true },
          selectedItems: { ...s.selectedItems, [id]: [] },
        }));
      },

      removeCategory: (categoryId) =>
        set((s) => {
          const cat = s.categories[categoryId];
          if (!cat) return s;
          if (cat.isCustom) {
            const categories = { ...s.categories };
            delete categories[categoryId];
            const items = { ...s.items };
            Object.keys(items).forEach((id) => {
              if (items[id].categoryId === categoryId) delete items[id];
            });
            const selectedItems = { ...s.selectedItems };
            delete selectedItems[categoryId];
            const on = { ...s.on };
            delete on[categoryId];
            return {
              categories,
              items,
              selectedItems,
              on,
              order: s.order.filter((id) => id !== categoryId),
            };
          }
          return {
            categories: { ...s.categories, [categoryId]: { ...cat, isHidden: true } },
            order: s.order.filter((id) => id !== categoryId),
            on: { ...s.on, [categoryId]: false },
          };
        }),

      restoreHiddenCategories: () =>
        set((s) => {
          const categories = { ...s.categories };
          const order = [...s.order];
          Object.values(categories).forEach((cat) => {
            if (cat.isHidden) {
              categories[cat.id] = { ...cat, isHidden: false };
              if (!order.includes(cat.id)) order.push(cat.id);
            }
          });
          return { categories, order };
        }),

      toggleCategoryOn: (categoryId) =>
        set((s) => ({ on: { ...s.on, [categoryId]: !s.on[categoryId] } })),

      setVariant: (categoryId, variant) =>
        set((s) => ({ variant: { ...s.variant, [categoryId]: variant } })),

      moveCategory: (categoryId, direction) =>
        set((s) => {
          const order = s.order.slice();
          const i = order.indexOf(categoryId);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= order.length) return s;
          [order[i], order[j]] = [order[j], order[i]];
          return { order };
        }),

      reorderCategory: (draggedId, targetId) =>
        set((s) => {
          if (draggedId === targetId) return s;
          const order = s.order.slice();
          const from = order.indexOf(draggedId);
          if (from === -1 || order.indexOf(targetId) === -1) return s;
          order.splice(from, 1);
          const insertAt = order.indexOf(targetId);
          order.splice(insertAt, 0, draggedId);
          return { order };
        }),

      addItem: (categoryId) => {
        const id = newId("item");
        const cat = get().categories[categoryId];
        const item: LibraryItem = {
          id,
          categoryId,
          isUserCreated: true,
          da: blankElementText(),
          en: blankElementText(),
          activities: [],
        };
        set((s) => ({
          items: { ...s.items, [id]: item },
          selectedItems: { ...s.selectedItems, [categoryId]: [...(s.selectedItems[categoryId] ?? []), id] },
          on: { ...s.on, [categoryId]: true },
        }));
        void cat;
        return id;
      },

      deleteItem: (itemId) =>
        set((s) => {
          const items = { ...s.items };
          delete items[itemId];
          const selectedItems: Record<string, string[]> = {};
          Object.keys(s.selectedItems).forEach((catId) => {
            selectedItems[catId] = s.selectedItems[catId].filter((id) => id !== itemId);
          });
          const selectedActivities = { ...s.selectedActivities };
          delete selectedActivities[itemId];
          return { items, selectedItems, selectedActivities };
        }),

      moveItem: (categoryId, itemId, direction) =>
        set((s) => {
          const ids = (s.selectedItems[categoryId] ?? []).slice();
          const i = ids.indexOf(itemId);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= ids.length) return s;
          [ids[i], ids[j]] = [ids[j], ids[i]];
          return { selectedItems: { ...s.selectedItems, [categoryId]: ids } };
        }),

      toggleItemInCv: (categoryId, itemId) =>
        set((s) => {
          const ids = s.selectedItems[categoryId] ?? [];
          const next = ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId];
          return { selectedItems: { ...s.selectedItems, [categoryId]: next } };
        }),

      setItemField: (itemId, lang, field, value) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          return { items: { ...s.items, [itemId]: { ...item, [lang]: { ...item[lang], [field]: value } } } };
        }),

      addActivity: (itemId, da, en) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          const activities: Activity[] = [...item.activities, { da, en: en || da }];
          return { items: { ...s.items, [itemId]: { ...item, activities } } };
        }),

      removeActivity: (itemId, index) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          const activities = item.activities.filter((_, i) => i !== index);
          const sel = s.selectedActivities[itemId];
          const selectedActivities = { ...s.selectedActivities };
          if (sel) {
            selectedActivities[itemId] = sel.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
          }
          return { items: { ...s.items, [itemId]: { ...item, activities } }, selectedActivities };
        }),

      setActivity: (itemId, index, lang, value) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          const activities = item.activities.map((a, i) => (i === index ? { ...a, [lang]: value } : a));
          return { items: { ...s.items, [itemId]: { ...item, activities } } };
        }),

      toggleActivitySelected: (itemId, index) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          const current = selectedActivityIndices(s, item);
          const next = current.includes(index) ? current.filter((i) => i !== index) : [...current, index].sort((a, b) => a - b);
          return { selectedActivities: { ...s.selectedActivities, [itemId]: next } };
        }),

      setAppliedTitle: (lang, value) => set((s) => ({ appliedTitle: { ...s.appliedTitle, [lang]: value } })),
      setKeywords: (lang, value) => set((s) => ({ keywords: { ...s.keywords, [lang]: value } })),
      setHeaderField: (field, value) => set((s) => ({ header: { ...s.header, [field]: value } })),
      setHeaderLocation: (lang, value) =>
        set((s) => ({ header: { ...s.header, location: { ...s.header.location, [lang]: value } } })),

      setDesign: (field, value) => set((s) => ({ design: { ...s.design, [field]: value } })),
      setFooterEnabled: (enabled) =>
        set((s) => ({ design: { ...s.design, footer: { ...s.design.footer, enabled } } })),
      setFooterRevision: (revision) =>
        set((s) => ({ design: { ...s.design, footer: { ...s.design.footer, revision } } })),

      parseImport: (text) => parseImportPlan(text, get().categories),
      commitImport: (plan) => set((s) => applyImportPlan(s, plan)),
      exportCsvText: () => exportCsv(get()),

      parseJsonImport: (text) => parseJsonBackup(text),
      commitJsonImport: (data) => set({ ...createDefaultState(), ...data }),
      exportJsonText: () => exportJson(get()),

      resetAll: () => set(createDefaultState()),
    }),
    {
      name: "cv-builder-state-v1",
      storage: createJSONStorage(() => safeStorage),
      version: 4,
      migrate: (persisted) => migrateToUnifiedCategoryModel(persisted) as Store,
    },
  ),
);

export function useItemsForCategory(categoryId: string): LibraryItem[] {
  return useStore(useShallow((s) => itemsForCategory(s, categoryId)));
}
