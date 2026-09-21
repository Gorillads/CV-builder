import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { Activity, AppState, Category, Lang, LibraryItem } from "../model/types";
import { blankElementText } from "../model/types";
import { createDefaultState } from "../data/defaultCategories";
import { buildPresetState } from "../data/presets";
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
 *  before the optional `comment` field existed at all, an item from when
 *  that same idea was a subgroup label stored separately as `item.group`
 *  rather than a per-language comment under the heading, and state saved
 *  before item order was tracked independently of CV selection at all.
 *  This folds all of it into the current shape — moving a blank-kind
 *  category's blurb text into a real item, copying any item's `tagValue`
 *  into `head`, moving `group.da`/`group.en` into `da.comment`/`en.comment`,
 *  backfilling a blank `comment`, and backfilling `itemOrder` from the
 *  same selected-then-rest order the editor used to show before it had an
 *  explicit order of its own — so an existing user's real typed content,
 *  and the order they already see it in, survives the format changes
 *  instead of silently vanishing or jumping around. */
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
    const activities = (items[id].activities as Array<Record<string, unknown>> | undefined) ?? [];
    items[id] = {
      ...items[id],
      isCollapsed: typeof items[id].isCollapsed === "boolean" ? items[id].isCollapsed : false,
      activities: activities.map((a) => ({ ...a, isCollapsed: typeof a.isCollapsed === "boolean" ? a.isCollapsed : false })),
    };
  });

  const itemOrder = { ...((s.itemOrder as Record<string, string[]>) ?? {}) };
  Object.keys(nextCategories).forEach((catId) => {
    if (itemOrder[catId]) return;
    const selected = selectedItems[catId] ?? [];
    const ownIds = Object.values(items)
      .filter((it) => it && it.categoryId === catId)
      .map((it) => it.id as string);
    const rest = ownIds.filter((id) => !selected.includes(id));
    itemOrder[catId] = [...selected, ...rest];
  });

  // A category hidden by an earlier version of hideCategory was dropped
  // from `order` entirely; hidden categories now keep their place there
  // (collapsed to one line instead), so any that's missing needs to be
  // added back, or it becomes unreachable.
  const order = Array.isArray(s.order) ? [...(s.order as string[])] : [];
  Object.keys(nextCategories).forEach((catId) => {
    if (!order.includes(catId)) order.push(catId);
  });

  return { ...s, categories: nextCategories, items, selectedItems, itemOrder, order };
}

/** The old hideCategory action set isHidden:true for a manually-hidden
 *  category, which also excluded it from the Tailor tab and the CV —
 *  isHidden is now reserved for a CSV import dropping a category (see
 *  applyImportPlan), and a manual hide is tracked separately as
 *  isCollapsed, which only affects the Content tab. Existing saved
 *  documents predate that split, so any category still marked isHidden
 *  from that older meaning is restored to isHidden:false (visible again
 *  in the Tailor tab, selectable for the CV via its own `on` toggle) and
 *  isCollapsed:true (so it still starts collapsed in the Content tab,
 *  matching how it looked before this change). */
function migrateHiddenCategoriesToCollapsed(state: unknown): unknown {
  if (!state || typeof state !== "object") return state;
  const s = state as Record<string, unknown>;
  const categories = s.categories as Record<string, Record<string, unknown>> | undefined;
  if (!categories || typeof categories !== "object") return state;

  const nextCategories: Record<string, Record<string, unknown>> = {};
  Object.entries(categories).forEach(([id, cat]) => {
    if (!cat) return;
    const wasHidden = cat.isHidden === true;
    nextCategories[id] = { ...cat, isHidden: false, isCollapsed: wasHidden || cat.isCollapsed === true };
  });

  return { ...s, categories: nextCategories };
}

function migrateHeaderAddress(state: unknown): unknown {
  if (!state || typeof state !== "object") return state;
  const s = state as Record<string, unknown>;
  const header = s.header as Record<string, unknown> | undefined;
  if (!header || typeof header !== "object" || typeof header.address === "string") return state;

  return { ...s, header: { ...header, address: "" } };
}

/** Density's id set changed from {standard, compact} to {small, standard,
 *  large} (see DENSITIES in src/data/designTokens) when it became the
 *  overall/master size lever rather than just a spacing toggle — old
 *  "compact" documents map onto the new "small" density. Also adds
 *  design.textSize (new in the same change), defaulting to "auto" so
 *  existing documents keep rendering at their current body text size
 *  (density "standard" resolves "auto" to the same 13px as before). */
function migrateDensityScale(state: unknown): unknown {
  if (!state || typeof state !== "object") return state;
  const s = state as Record<string, unknown>;
  const design = s.design as Record<string, unknown> | undefined;
  if (!design || typeof design !== "object") return state;

  const density = design.density === "compact" ? "small" : design.density;
  const textSize = typeof design.textSize === "string" ? design.textSize : "auto";
  return { ...s, design: { ...design, density, textSize } };
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
  /** Collapses/expands the category to a single line in the Content tab —
   *  purely a display convenience, same as toggleItemCollapsed /
   *  toggleActivityCollapsed. It stays fully selectable in the Tailor tab
   *  and counted toward the CV via `on`, whichever way this is set. */
  toggleCategoryCollapsed(categoryId: string): void;
  /** Removes the category for good, along with its items and selections.
   *  Same action regardless of whether it's a built-in or a custom
   *  category — there's no "restore" for this one. */
  deleteCategory(categoryId: string): void;
  toggleCategoryOn(categoryId: string): void;
  setVariant(categoryId: string, variant: string): void;
  /** How one item's own activity bullets are displayed — an id into
   *  ACTIVITY_STYLES (see src/data/designTokens). */
  setActivityStyle(itemId: string, style: string): void;
  /** Explicit per-category override of which column it renders in under the
   *  sidebar structure — see AppState.sidebarPlacement and isInSidebar. */
  setSidebarPlacement(categoryId: string, inSidebar: boolean): void;
  /** Drag-and-drop reorder: moves draggedId to sit just before targetId. */
  reorderCategory(draggedId: string, targetId: string): void;

  addItem(categoryId: string): string;
  /** Deletes the item from the library outright (and drops it from every
   *  category's selection and order). */
  deleteItem(itemId: string): void;
  /** Reorders within the category's itemOrder — the same order shown (and
   *  drag-reorderable) in both the Content and Tailor tabs. */
  moveItem(categoryId: string, itemId: string, direction: -1 | 1): void;
  /** Drag-and-drop reorder: moves draggedId to sit just before targetId
   *  within the category's itemOrder. */
  reorderItem(categoryId: string, draggedId: string, targetId: string): void;
  toggleItemInCv(categoryId: string, itemId: string): void;
  setItemField(itemId: string, lang: Lang, field: "head" | "meta" | "comment" | "desc", value: string): void;
  /** Collapses/expands the item's editor card to a single line — a Content
   *  tab display convenience for scanning/reordering, unrelated to
   *  toggleItemInCv (which is about what's on the current CV). */
  toggleItemCollapsed(itemId: string): void;

  addActivity(itemId: string, da: string, en: string): void;
  removeActivity(itemId: string, index: number): void;
  setActivity(itemId: string, index: number, lang: Lang, value: string): void;
  toggleActivitySelected(itemId: string, index: number): void;
  /** Collapses/expands one activity row to a single line — same display
   *  convenience as toggleItemCollapsed, unrelated to toggleActivitySelected. */
  toggleActivityCollapsed(itemId: string, index: number): void;
  /** Drag-and-drop reorder of an item's own activity pool; remaps any
   *  explicit selectedActivities indices so already-picked bullets stay
   *  picked after the move. */
  reorderActivity(itemId: string, from: number, to: number): void;

  setAppliedTitle(lang: Lang, value: string): void;
  setHeaderField(field: "name" | "address" | "phone" | "mail", value: string): void;
  setHeaderLocation(lang: Lang, value: string): void;
  /** Sets or clears (empty string) the optional profile picture — see
   *  AppState.header.photo. */
  setHeaderPhoto(photo: string): void;

  setDesign(
    field:
      | "font"
      | "scheme"
      | "headSize"
      | "struct"
      | "headKind"
      | "density"
      | "sidebarSide"
      | "headingSize"
      | "textSize"
      | "photoSize"
      | "photoPosition",
    value: string,
  ): void;
  setFooterEnabled(enabled: boolean): void;
  setFooterRevision(revision: string): void;

  parseImport(text: string): ImportParseResult;
  commitImport(plan: Parameters<typeof applyImportPlan>[1]): void;
  exportCsvText(): string;

  /** Full-state backup, distinct from the CSV: also carries header contact
   *  details, design tokens, per-category variants, on/off toggles and
   *  order, and applied title — restoring one puts the app back exactly as
   *  it was, not just the content library. */
  parseJsonImport(text: string): JsonParseResult;
  commitJsonImport(data: Partial<AppState>): void;
  exportJsonText(): string;

  /** Replaces all content and settings with one of the example CVs from
   *  src/data/presets.ts (Classic/Modern/Artistic) — the same "replace
   *  everything" shape as commitJsonImport, just from a built-in example
   *  instead of a file. A no-op if the id doesn't match a known preset. */
  applyPreset(id: string): void;

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
          isCollapsed: false,
          isReplacedByImport: false,
        };
        set((s) => ({
          categories: { ...s.categories, [id]: category },
          order: [...s.order, id],
          on: { ...s.on, [id]: true },
          selectedItems: { ...s.selectedItems, [id]: [] },
          itemOrder: { ...s.itemOrder, [id]: [] },
        }));
      },

      toggleCategoryCollapsed: (categoryId) =>
        set((s) => {
          const cat = s.categories[categoryId];
          if (!cat) return s;
          return { categories: { ...s.categories, [categoryId]: { ...cat, isCollapsed: !cat.isCollapsed } } };
        }),

      deleteCategory: (categoryId) =>
        set((s) => {
          const cat = s.categories[categoryId];
          if (!cat) return s;
          const categories = { ...s.categories };
          delete categories[categoryId];
          const items = { ...s.items };
          Object.keys(items).forEach((id) => {
            if (items[id].categoryId === categoryId) delete items[id];
          });
          const selectedItems = { ...s.selectedItems };
          delete selectedItems[categoryId];
          const itemOrder = { ...s.itemOrder };
          delete itemOrder[categoryId];
          const on = { ...s.on };
          delete on[categoryId];
          return {
            categories,
            items,
            selectedItems,
            itemOrder,
            on,
            order: s.order.filter((id) => id !== categoryId),
          };
        }),

      toggleCategoryOn: (categoryId) =>
        set((s) => ({ on: { ...s.on, [categoryId]: !s.on[categoryId] } })),

      setVariant: (categoryId, variant) =>
        set((s) => ({ variant: { ...s.variant, [categoryId]: variant } })),

      setActivityStyle: (itemId, style) =>
        set((s) => ({ activityStyle: { ...s.activityStyle, [itemId]: style } })),

      setSidebarPlacement: (categoryId, inSidebar) =>
        set((s) => ({ sidebarPlacement: { ...s.sidebarPlacement, [categoryId]: inSidebar } })),

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
          isCollapsed: false,
        };
        set((s) => ({
          items: { ...s.items, [id]: item },
          selectedItems: { ...s.selectedItems, [categoryId]: [...(s.selectedItems[categoryId] ?? []), id] },
          itemOrder: { ...s.itemOrder, [categoryId]: [...(s.itemOrder[categoryId] ?? []), id] },
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
          const itemOrder: Record<string, string[]> = {};
          Object.keys(s.itemOrder).forEach((catId) => {
            itemOrder[catId] = s.itemOrder[catId].filter((id) => id !== itemId);
          });
          const selectedActivities = { ...s.selectedActivities };
          delete selectedActivities[itemId];
          return { items, selectedItems, itemOrder, selectedActivities };
        }),

      moveItem: (categoryId, itemId, direction) =>
        set((s) => {
          const ids = (s.itemOrder[categoryId] ?? []).slice();
          const i = ids.indexOf(itemId);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= ids.length) return s;
          [ids[i], ids[j]] = [ids[j], ids[i]];
          return { itemOrder: { ...s.itemOrder, [categoryId]: ids } };
        }),

      reorderItem: (categoryId, draggedId, targetId) =>
        set((s) => {
          if (draggedId === targetId) return s;
          const ids = (s.itemOrder[categoryId] ?? []).slice();
          const from = ids.indexOf(draggedId);
          if (from === -1 || ids.indexOf(targetId) === -1) return s;
          ids.splice(from, 1);
          const insertAt = ids.indexOf(targetId);
          ids.splice(insertAt, 0, draggedId);
          return { itemOrder: { ...s.itemOrder, [categoryId]: ids } };
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

      toggleItemCollapsed: (itemId) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          return { items: { ...s.items, [itemId]: { ...item, isCollapsed: !item.isCollapsed } } };
        }),

      addActivity: (itemId, da, en) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          const activities: Activity[] = [...item.activities, { da, en: en || da, isCollapsed: false }];
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

      toggleActivityCollapsed: (itemId, index) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item) return s;
          const activities = item.activities.map((a, i) => (i === index ? { ...a, isCollapsed: !a.isCollapsed } : a));
          return { items: { ...s.items, [itemId]: { ...item, activities } } };
        }),

      reorderActivity: (itemId, from, to) =>
        set((s) => {
          const item = s.items[itemId];
          if (!item || from === to || from < 0 || to < 0 || from >= item.activities.length || to >= item.activities.length) {
            return s;
          }
          const activities = item.activities.slice();
          const [moved] = activities.splice(from, 1);
          activities.splice(to, 0, moved);

          const sel = s.selectedActivities[itemId];
          let selectedActivities = s.selectedActivities;
          if (sel) {
            const remap = (i: number) => {
              if (i === from) return to;
              if (from < to) return i > from && i <= to ? i - 1 : i;
              return i >= to && i < from ? i + 1 : i;
            };
            selectedActivities = { ...s.selectedActivities, [itemId]: sel.map(remap).sort((a, b) => a - b) };
          }
          return { items: { ...s.items, [itemId]: { ...item, activities } }, selectedActivities };
        }),

      setAppliedTitle: (lang, value) => set((s) => ({ appliedTitle: { ...s.appliedTitle, [lang]: value } })),
      setHeaderField: (field, value) => set((s) => ({ header: { ...s.header, [field]: value } })),
      setHeaderLocation: (lang, value) =>
        set((s) => ({ header: { ...s.header, location: { ...s.header.location, [lang]: value } } })),
      setHeaderPhoto: (photo) => set((s) => ({ header: { ...s.header, photo } })),

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

      applyPreset: (id) => {
        const preset = buildPresetState(id);
        if (preset) set(preset);
      },

      resetAll: () => set(createDefaultState()),
    }),
    {
      name: "cv-builder-state-v1",
      storage: createJSONStorage(() => safeStorage),
      version: 9,
      migrate: (persisted) =>
        migrateDensityScale(
          migrateHeaderAddress(
            migrateHiddenCategoriesToCollapsed(migrateToUnifiedCategoryModel(persisted)),
          ),
        ) as Store,
    },
  ),
);

export function useItemsForCategory(categoryId: string): LibraryItem[] {
  return useStore(useShallow((s) => itemsForCategory(s, categoryId)));
}
