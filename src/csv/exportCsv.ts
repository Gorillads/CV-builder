import type { AppState, Lang, LibraryItem } from "../model/types";
import { CSV_HEADER, META_KEYWORDS_ROW_ID, META_TITLE_ROW_ID } from "./columns";

function esc(v: string | number | null | undefined): string {
  return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
}

function selectedActivityIndices(state: AppState, item: LibraryItem): number[] {
  const sel = state.selectedActivities[item.id];
  if (sel) return sel.filter((i) => i < item.activities.length);
  return item.activities.map((_, i) => i);
}

function activitiesColumn(item: LibraryItem, lang: Lang): string {
  return item.activities.map((a) => a[lang] || a.da).filter(Boolean).join(" · ");
}

/** The line as it reads on the CV sheet: only the picked activities, first
 *  one capitalised, the rest lower-case (a sentence fragment). */
function selectedActivitiesLine(state: AppState, item: LibraryItem, lang: Lang): string {
  const parts = selectedActivityIndices(state, item)
    .map((i) => item.activities[i])
    .filter(Boolean)
    .map((a) => a[lang] || a.da)
    .filter(Boolean);
  if (parts.length) parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts.join(" · ");
}

/** Ported from the prototype's `_exportCsv`: one semicolon-delimited CSV,
 *  UTF-8 with a BOM so it opens correctly in Excel. One row per element;
 *  a category with a blurb but no elements gets a single blurb-only row;
 *  an empty category with no blurb still gets one row so the CSV keeps
 *  a record of it existing. Two meta rows carry the applied job title and
 *  ATS keywords through the Title (DA)/(EN) columns. */
export function exportCsv(state: AppState): string {
  const rows: string[][] = [[...CSV_HEADER]];

  rows.push([
    META_TITLE_ROW_ID,
    "Ansøgt titel",
    "Position applied for",
    state.appliedTitle.da,
    state.appliedTitle.en,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    META_KEYWORDS_ROW_ID,
    "Nøgleord",
    "Keywords",
    state.keywords.da,
    state.keywords.en,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const inUse = new Set<string>();
  Object.values(state.selectedItems).forEach((ids) => ids.forEach((id) => inUse.add(id)));

  state.order.forEach((key) => {
    const cat = state.categories[key];
    if (!cat || cat.isHidden) return;

    const nd = cat.title.da;
    const ne = cat.title.en;
    const bd = cat.blurb.da;
    const be = cat.blurb.en;

    if (bd || be) rows.push([key, nd, ne, "", "", "", bd, be, "", "", "", ""]);

    const own = Object.values(state.items).filter((it) => it.categoryId === key);
    const selectionOrder = state.selectedItems[key] ?? [];

    if (!own.length && !bd && !be) {
      rows.push([key, nd, ne, "", "", "", "", "", "", "", "", ""]);
    }

    own
      .slice()
      .sort((a, b) => {
        const ra = selectionOrder.indexOf(a.id);
        const rb = selectionOrder.indexOf(b.id);
        return (ra === -1 ? 1e6 : ra) - (rb === -1 ? 1e6 : rb);
      })
      .forEach((item) => {
        const isTag = cat.kind === "tags";
        rows.push([
          key,
          nd,
          ne,
          isTag ? item.da.tagValue : item.da.head,
          isTag ? item.en.tagValue : item.en.head,
          item.da.meta,
          item.da.desc,
          item.en.desc,
          activitiesColumn(item, "da"),
          activitiesColumn(item, "en"),
          isTag ? "" : selectedActivitiesLine(state, item, state.lang),
          inUse.has(item.id) ? "ja" : "",
        ]);
      });
  });

  return "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
}

export function downloadCsv(state: AppState, filename = "CV-bibliotek.csv"): void {
  const csv = exportCsv(state);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
