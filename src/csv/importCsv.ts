import type { Activity, AppState, ByLang, Category, LibraryItem } from "../model/types";
import { parseCsv } from "./parseCsv";
import { META_TITLE_ROW_ID, NODE_ROLE, parseNodeRole } from "./columns";

function findColumn(head: string[], names: string[]): number {
  for (const n of names) {
    const i = head.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

function slugify(raw: string): string {
  const slug = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "kat_" + Date.now().toString(36);
}

interface ParsedItem {
  rowIndex: number;
  head: ByLang<string>;
  meta: string;
  comment: ByLang<string>;
  desc: ByLang<string>;
  activities: Activity[];
  selectedActivityIndices: number[] | null;
  inCv: boolean;
}

interface ParsedCategory {
  title: ByLang<string>;
  blurb: ByLang<string> | null;
  items: ParsedItem[];
}

export interface ImportPlan {
  order: string[];
  rowCount: number;
  sectionCount: number;
  metaTitle: ByLang<string> | null;
  categories: Record<string, ParsedCategory>;
}

export type ImportParseResult = { ok: true; plan: ImportPlan } | { ok: false; error: string };

/** Finds the id of an existing category (built-in or custom, hidden or
 *  not) whose title matches `raw` in either language, so re-importing a
 *  category identifies it by what it's called rather than a hidden id —
 *  the natural thing for a human-edited outline file. Falls back to a
 *  freshly slugified id for a category the file introduces. */
function resolveCategoryKey(raw: string, existing: Record<string, Category>): string {
  const norm = raw.trim().toLowerCase();
  const match = Object.values(existing).find(
    (cat) => cat.title.da.trim().toLowerCase() === norm || cat.title.en.trim().toLowerCase() === norm,
  );
  return match ? match.id : slugify(raw);
}

/** Row-by-row outline parser: walks the Titel → Tekst → Element →
 *  Aktivitet hierarchy (see src/csv/columns.ts) top to bottom, tracking
 *  which category/item is currently "open" rather than relying on the
 *  dash-count depth, so a hand-edited file with an imperfect indent still
 *  parses correctly. A legacy "Kategori" row (see NODE_ROLE.category) is
 *  still tolerated: its text becomes the Kommentar of the elements that
 *  follow, until the next Kategori row or Titel. */
export function parseImportPlan(text: string, existingCategories: Record<string, Category>): ImportParseResult {
  const rows = parseCsv(text);

  let cNode = -1, cDa = -1, cEn = -1, cMeta = -1, cCDa = -1, cCEn = -1, cDDa = -1, cDEn = -1, cUse = -1;

  if (rows.length) {
    const head = rows[0].map((v) => String(v).trim().toLowerCase());
    cNode = findColumn(head, ["knude", "node"]);
    cDa = findColumn(head, ["dansk", "danish"]);
    cEn = findColumn(head, ["engelsk", "english"]);
    cMeta = findColumn(head, ["årstal/kilde", "year/source", "årstal", "meta"]);
    cCDa = findColumn(head, ["kommentar (da)", "comment (da)"]);
    cCEn = findColumn(head, ["kommentar (en)", "comment (en)"]);
    cDDa = findColumn(head, ["beskrivelse (da)", "description (da)"]);
    cDEn = findColumn(head, ["beskrivelse (en)", "description (en)"]);
    cUse = findColumn(head, ["med i cv", "in cv"]);
    if (cNode < 0 || cDa < 0) {
      return { ok: false, error: "The CSV is missing a Knude or Dansk column." };
    }
  }

  const order: string[] = [];
  const categories: Record<string, ParsedCategory> = {};
  let metaTitle: ByLang<string> | null = null;

  let currentKey: string | null = null;
  /** Set only by a legacy "Kategori" row (see NODE_ROLE.category); folded
   *  into the Kommentar of whichever elements follow it. */
  let pendingLegacyComment: ByLang<string> | null = null;
  let currentItem: ParsedItem | null = null;
  let rowIndex = 0;

  rows.slice(1).forEach((r) => {
    const rawNode = String(r[cNode] || "").trim();
    if (!rawNode) return;
    if (rawNode === META_TITLE_ROW_ID) {
      metaTitle = { da: String(r[cDa] || ""), en: String(cEn >= 0 ? r[cEn] : "") };
      return;
    }
    const role = parseNodeRole(rawNode);
    if (!role) return;

    const da = String(r[cDa] || "").trim();
    const en = String(cEn >= 0 ? r[cEn] : "").trim() || da;

    if (role === NODE_ROLE.title) {
      if (!da && !en) return;
      const key = resolveCategoryKey(da || en, existingCategories);
      if (!categories[key]) {
        categories[key] = { title: { da, en }, blurb: null, items: [] };
        order.push(key);
      }
      currentKey = key;
      pendingLegacyComment = null;
      currentItem = null;
      return;
    }

    if (!currentKey) return; // stray row before any Titel — ignore

    if (role === NODE_ROLE.text) {
      if (currentItem) {
        currentItem.desc = { da, en };
      } else {
        categories[currentKey].blurb = { da, en };
      }
      return;
    }

    if (role === NODE_ROLE.category) {
      pendingLegacyComment = da || en ? { da, en } : null;
      currentItem = null;
      return;
    }

    if (role === NODE_ROLE.element) {
      if (!da && !en) return;
      const commentDa = (cCDa >= 0 ? String(r[cCDa] || "").trim() : "") || pendingLegacyComment?.da || "";
      const commentEn = (cCEn >= 0 ? String(r[cCEn] || "").trim() : "") || pendingLegacyComment?.en || "";
      const item: ParsedItem = {
        rowIndex: rowIndex++,
        head: { da, en },
        meta: String(cMeta >= 0 ? r[cMeta] : "").trim(),
        comment: { da: commentDa, en: commentEn },
        desc: {
          da: String(cDDa >= 0 ? r[cDDa] : "").trim(),
          en: String(cDEn >= 0 ? r[cDEn] : "").trim(),
        },
        activities: [],
        selectedActivityIndices: null,
        inCv: (() => {
          const use = String(cUse >= 0 ? r[cUse] : "").trim().toLowerCase();
          return cUse < 0 || ["ja", "yes", "x", "1", "true"].includes(use);
        })(),
      };
      categories[currentKey].items.push(item);
      currentItem = item;
      return;
    }

    if (role === NODE_ROLE.activity) {
      if (!currentItem) return;
      if (!da && !en) return;
      currentItem.activities.push({ da, en, isCollapsed: false });
      const use = String(cUse >= 0 ? r[cUse] : "").trim().toLowerCase();
      const included = cUse < 0 || ["ja", "yes", "x", "1", "true"].includes(use);
      if (included) {
        currentItem.selectedActivityIndices ??= [];
        currentItem.selectedActivityIndices.push(currentItem.activities.length - 1);
      } else if (currentItem.selectedActivityIndices === null) {
        currentItem.selectedActivityIndices = [];
      }
    }
  });

  const rowCount = Object.values(categories).reduce(
    (sum, cat) => sum + cat.items.length + (cat.blurb ? 1 : 0),
    0,
  );

  return {
    ok: true,
    plan: { order, rowCount, sectionCount: order.length, metaTitle, categories },
  };
}

/** Dedupe identical (heading, year/source) pairs within one category, so
 *  accidental copy-pasted rows in Excel don't create duplicates. */
function dedupe(items: ParsedItem[]): ParsedItem[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const sig = it.head.da.toLowerCase() + "|" + it.meta.toLowerCase();
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

/** Full-library rebuild: every category the plan doesn't mention is
 *  dropped (built-ins hidden and restorable, custom ones deleted for
 *  good); every category the plan does mention is (re)created from the
 *  file, which becomes that category's whole truth — a category that
 *  ends up with zero elements stays genuinely empty. */
export function applyImportPlan(state: AppState, plan: ImportPlan): AppState {
  const categories: Record<string, Category> = {};
  const items: Record<string, LibraryItem> = { ...state.items };
  const selectedItems: Record<string, string[]> = { ...state.selectedItems };
  const itemOrder: Record<string, string[]> = { ...state.itemOrder };
  const selectedActivities: Record<string, number[]> = { ...state.selectedActivities };
  const on: Record<string, boolean> = { ...state.on };
  const keep = new Set(plan.order);
  const removedFromOrder = new Set<string>();

  Object.values(state.categories).forEach((cat) => {
    if (keep.has(cat.id)) return;
    removedFromOrder.add(cat.id);
    // Hidden, restorable, built-in or custom alike — its own content is
    // left untouched. Deleting for good is a separate, explicit,
    // confirmed action in the editor, never a side effect of an import
    // simply not mentioning a category.
    categories[cat.id] = { ...cat, isHidden: true, isCollapsed: true };
    on[cat.id] = false;
  });

  const order = state.order.filter((id) => !removedFromOrder.has(id));
  plan.order.forEach((key) => {
    if (order.indexOf(key) === -1) order.push(key);
  });

  plan.order.forEach((key) => {
    const parsed = plan.categories[key];
    const existing = state.categories[key];

    categories[key] = existing
      ? {
          ...existing,
          isHidden: false,
          isReplacedByImport: true,
          title: { da: parsed.title.da || existing.title.da, en: parsed.title.en || existing.title.en },
          blurb: { da: parsed.blurb?.da ?? "", en: parsed.blurb?.en ?? "" },
        }
      : {
          id: key,
          title: parsed.title,
          blurb: { da: parsed.blurb?.da ?? "", en: parsed.blurb?.en ?? "" },
          isCustom: true,
          isHidden: false,
          isCollapsed: false,
          isReplacedByImport: true,
        };

    // Full rebuild for this category: drop everything it used to hold.
    Object.keys(items).forEach((id) => {
      if (items[id].categoryId === key) {
        delete items[id];
        delete selectedActivities[id];
      }
    });

    const picked: string[] = [];
    const rowOrder: string[] = [];
    dedupe(parsed.items).forEach((parsedItem) => {
      const id = `imp_${key}_${parsedItem.rowIndex}`;
      items[id] = {
        id,
        categoryId: key,
        isUserCreated: true,
        da: {
          head: parsedItem.head.da,
          meta: parsedItem.meta,
          comment: parsedItem.comment.da,
          desc: parsedItem.desc.da,
        },
        en: {
          head: parsedItem.head.en,
          meta: parsedItem.meta,
          comment: parsedItem.comment.en || parsedItem.comment.da,
          desc: parsedItem.desc.en || parsedItem.desc.da,
        },
        activities: parsedItem.activities,
        isCollapsed: false,
        logo: "",
        logoVisible: true,
      };
      if (parsedItem.selectedActivityIndices != null) {
        selectedActivities[id] = parsedItem.selectedActivityIndices;
      }
      rowOrder.push(id);
      if (parsedItem.inCv) picked.push(id);
    });
    selectedItems[key] = picked;
    itemOrder[key] = rowOrder;
    on[key] = picked.length > 0;
  });

  return {
    ...state,
    order,
    categories,
    items,
    on,
    selectedItems,
    itemOrder,
    selectedActivities,
    appliedTitle: plan.metaTitle ?? state.appliedTitle,
  };
}
