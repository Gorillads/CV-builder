import type { Activity, AppState, ByLang, Category, LibraryItem, Placement } from "../model/types";
import { parseCsv } from "./parseCsv";
import { META_KEYWORDS_ROW_ID, META_TITLE_ROW_ID } from "./columns";

function findColumn(head: string[], names: string[]): number {
  for (const n of names) {
    const i = head.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

function splitActivities(v: string): string[] {
  return String(v || "")
    .split("·")
    .map((x) => x.trim())
    .filter(Boolean);
}

function slugify(raw: string): string {
  const slug = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "mod_" + Date.now().toString(36);
}

interface ParsedItem {
  rowIndex: number;
  head: ByLang<string>;
  meta: string;
  desc: ByLang<string>;
  activities: Activity[];
  selectedActivityIndices: number[] | null;
  inCv: boolean;
}

interface ParsedCategory {
  rawLabel: string;
  sectionName: ByLang<string> | null;
  blurb: ByLang<string> | null;
  items: ParsedItem[];
}

export interface ImportPlan {
  order: string[];
  rowCount: number;
  sectionCount: number;
  metaTitle: ByLang<string> | null;
  metaKeywords: ByLang<string> | null;
  categories: Record<string, ParsedCategory>;
}

export type ImportParseResult = { ok: true; plan: ImportPlan } | { ok: false; error: string };

/** Ported from the prototype's `_importCsv` row-grouping pass. Building the
 *  plan is separated from applying it so the caller can show a confirmation
 *  (row count + section count) before committing the destructive rebuild. */
export function parseImportPlan(text: string, existingCategoryIds: Set<string>): ImportParseResult {
  const rows = parseCsv(text);

  let cKey = -1,
    cSecDa = -1,
    cSecEn = -1,
    cDa = -1,
    cEn = -1,
    cMeta = -1,
    cDDa = -1,
    cDEn = -1,
    cADa = -1,
    cAEn = -1,
    cSel = -1,
    cUse = -1;

  if (rows.length) {
    const head = rows[0].map((v) => String(v).trim().toLowerCase());
    cKey = findColumn(head, ["module-id", "modul-id", "module id", "modul", "module"]);
    cSecDa = findColumn(head, ["sektionsnavn (da)", "section name (da)"]);
    cSecEn = findColumn(head, ["sektionsnavn (en)", "section name (en)"]);
    cDa = findColumn(head, ["titel (da)", "title (da)"]);
    cEn = findColumn(head, ["titel (en)", "title (en)"]);
    cMeta = findColumn(head, ["årstal/kilde", "year/source", "årstal", "meta"]);
    cDDa = findColumn(head, ["beskrivelse (da)", "description (da)"]);
    cDEn = findColumn(head, ["beskrivelse (en)", "description (en)"]);
    cADa = findColumn(head, ["aktiviteter (da)", "activities (da)"]);
    cAEn = findColumn(head, ["aktiviteter (en)", "activities (en)"]);
    cSel = findColumn(head, ["valgte aktiviteter", "selected activities"]);
    cUse = findColumn(head, ["med i cv", "in cv"]);
    if (cKey < 0 || cDa < 0) {
      return { ok: false, error: "The CSV is missing a Module-ID or Title (DA) column." };
    }
  }

  const order: string[] = [];
  const rawLabel: Record<string, string> = {};
  const secName: Record<string, ByLang<string>> = {};
  const groups: Record<string, string[][]> = {};
  const blurbs: Record<string, ByLang<string>> = {};
  let metaTitle: ByLang<string> | null = null;
  let metaKeywords: ByLang<string> | null = null;

  rows.slice(1).forEach((r) => {
    const raw = String(r[cKey] || "").trim();
    if (!raw) return;
    if (raw === META_TITLE_ROW_ID) {
      metaTitle = { da: String(r[cDa] || ""), en: String(cEn >= 0 ? r[cEn] : "") };
      return;
    }
    if (raw === META_KEYWORDS_ROW_ID) {
      metaKeywords = { da: String(r[cDa] || ""), en: String(cEn >= 0 ? r[cEn] : "") };
      return;
    }
    const key = existingCategoryIds.has(raw) ? raw : slugify(raw);
    if (!rawLabel[key]) rawLabel[key] = raw;
    const sd = String(cSecDa >= 0 ? r[cSecDa] : "").trim();
    const se = String(cSecEn >= 0 ? r[cSecEn] : "").trim();
    if ((sd || se) && !secName[key]) secName[key] = { da: sd, en: se };
    if (order.indexOf(key) === -1) order.push(key);

    const titleDa = String(r[cDa] || "").trim();
    const titleEn = String(cEn >= 0 ? r[cEn] : "").trim();
    if (!titleDa && !titleEn) {
      blurbs[key] = {
        da: String(cDDa >= 0 ? r[cDDa] : "").trim(),
        en: String(cDEn >= 0 ? r[cDEn] : "").trim(),
      };
      return;
    }
    (groups[key] = groups[key] || []).push(r);
  });

  const categories: Record<string, ParsedCategory> = {};
  let rowCount = 0;
  order.forEach((key) => {
    const rowsForKey = groups[key] || [];
    rowCount += rowsForKey.length;
    const items: ParsedItem[] = [];
    rowsForKey.forEach((r, i) => {
      const da = String(r[cDa] || "").trim();
      const en = String(cEn >= 0 ? r[cEn] : "").trim() || da;
      if (!da && !en) return;
      const meta = String(cMeta >= 0 ? r[cMeta] : "").trim();
      const ad = splitActivities(cADa >= 0 ? r[cADa] : "");
      const ae = splitActivities(cAEn >= 0 ? r[cAEn] : "");
      let activities: Activity[] = ad.map((v, j) => ({ da: v, en: ae[j] != null ? ae[j] : v }));
      if (!activities.length && ae.length) activities = ae.map((v) => ({ da: v, en: v }));

      let selectedActivityIndices: number[] | null = null;
      const selLine = String(cSel >= 0 ? r[cSel] : "").trim();
      if (selLine) {
        const want = splitActivities(selLine).map((x) => x.toLowerCase());
        selectedActivityIndices = activities
          .map((a, j) => (want.includes(a.da.toLowerCase()) || want.includes(a.en.toLowerCase()) ? j : -1))
          .filter((j) => j >= 0);
      }

      const use = String(cUse >= 0 ? r[cUse] : "").trim().toLowerCase();
      const inCv = cUse < 0 || ["ja", "yes", "x", "1", "true"].includes(use);

      items.push({
        rowIndex: i,
        head: { da, en },
        meta,
        desc: {
          da: String(cDDa >= 0 ? r[cDDa] : "").trim(),
          en: String(cDEn >= 0 ? r[cDEn] : "").trim() || String(cDDa >= 0 ? r[cDDa] : "").trim(),
        },
        activities,
        selectedActivityIndices,
        inCv,
      });
    });
    categories[key] = {
      rawLabel: rawLabel[key],
      sectionName: secName[key] ?? null,
      blurb: blurbs[key] ?? null,
      items,
    };
  });

  rowCount += Object.keys(blurbs).length;

  return {
    ok: true,
    plan: { order, rowCount, sectionCount: order.length, metaTitle, metaKeywords, categories },
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
export function applyImportPlan(state: AppState, plan: ImportPlan, defaultPlacement: Placement = "cv"): AppState {
  const categories: Record<string, Category> = {};
  const items: Record<string, LibraryItem> = { ...state.items };
  const selectedItems: Record<string, string[]> = { ...state.selectedItems };
  const selectedActivities: Record<string, number[]> = { ...state.selectedActivities };
  const place: Record<string, Placement> = { ...state.place };
  const on: Record<string, boolean> = { ...state.on };
  const keep = new Set(plan.order);
  const removedFromOrder = new Set<string>();

  Object.values(state.categories).forEach((cat) => {
    if (keep.has(cat.id)) return;
    removedFromOrder.add(cat.id);
    if (cat.isCustom) {
      // Dropped for good: strip its items and selection too.
      Object.keys(items).forEach((id) => {
        if (items[id].categoryId === cat.id) {
          delete items[id];
          delete selectedActivities[id];
        }
      });
      delete selectedItems[cat.id];
      delete place[cat.id];
      delete on[cat.id];
      return;
    }
    // Built-in: hidden, restorable — its own content is left untouched.
    categories[cat.id] = { ...cat, isHidden: true };
    on[cat.id] = false;
  });

  const order = state.order.filter((id) => !removedFromOrder.has(id));
  plan.order.forEach((key) => {
    if (order.indexOf(key) === -1) order.push(key);
  });

  plan.order.forEach((key) => {
    const parsed = plan.categories[key];
    const existing = state.categories[key];
    const label = parsed.sectionName?.da || parsed.rawLabel;
    const labelEn = parsed.sectionName?.en || label;

    categories[key] = existing
      ? {
          ...existing,
          isHidden: false,
          isReplacedByImport: true,
          title: {
            da: parsed.sectionName?.da || existing.title.da,
            en: parsed.sectionName?.en || existing.title.en,
          },
          blurb: {
            da: parsed.blurb?.da ?? "",
            en: parsed.blurb?.en ?? "",
          },
        }
      : {
          id: key,
          title: { da: label, en: labelEn },
          blurb: { da: parsed.blurb?.da ?? "", en: parsed.blurb?.en ?? "" },
          kind: "entry",
          isCustom: true,
          isHidden: false,
          isReplacedByImport: true,
        };

    if (!place[key]) place[key] = defaultPlacement;

    // Full rebuild for this category: drop everything it used to hold.
    Object.keys(items).forEach((id) => {
      if (items[id].categoryId === key) {
        delete items[id];
        delete selectedActivities[id];
      }
    });

    const picked: string[] = [];
    dedupe(parsed.items).forEach((parsedItem) => {
      const id = `imp_${key}_${parsedItem.rowIndex}`;
      items[id] = {
        id,
        categoryId: key,
        isUserCreated: true,
        da: { head: parsedItem.head.da, meta: parsedItem.meta, desc: parsedItem.desc.da, tagValue: parsedItem.head.da },
        en: { head: parsedItem.head.en, meta: parsedItem.meta, desc: parsedItem.desc.en, tagValue: parsedItem.head.en },
        activities: parsedItem.activities,
      };
      if (parsedItem.selectedActivityIndices != null) selectedActivities[id] = parsedItem.selectedActivityIndices;
      if (parsedItem.inCv) picked.push(id);
    });
    selectedItems[key] = picked;
    on[key] = picked.length > 0;
  });

  return {
    ...state,
    order,
    categories,
    items,
    on,
    selectedItems,
    selectedActivities,
    place,
    appliedTitle: plan.metaTitle ?? state.appliedTitle,
    keywords: plan.metaKeywords ?? state.keywords,
  };
}
