import type { AppState, LibraryItem } from "../model/types";
import { CSV_HEADER, META_KEYWORDS_ROW_ID, META_TITLE_ROW_ID, NODE_ROLE } from "./columns";

function esc(v: string | number | null | undefined): string {
  return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
}

function node(role: string, depth: number): string {
  return "-".repeat(depth) + role;
}

function selectedActivityIndices(state: AppState, item: LibraryItem): number[] {
  const sel = state.selectedActivities[item.id];
  if (sel) return sel.filter((i) => i < item.activities.length);
  return item.activities.map((_, i) => i);
}

/** Ported from the prototype's `_exportCsv`, restructured as an indented
 *  outline: one semicolon-delimited CSV, UTF-8 with a BOM so it opens
 *  correctly in Excel. Each row is a node in a
 *  Titel → Tekst / Kategori → Element → Aktivitet hierarchy — see
 *  src/csv/columns.ts. Two meta rows carry the applied job title and ATS
 *  keywords ahead of the category tree. */
export function exportCsv(state: AppState): string {
  const rows: string[][] = [[...CSV_HEADER]];
  const blank = (knude: string, da: string, en: string) => rows.push([knude, da, en, "", "", "", ""]);

  blank(META_TITLE_ROW_ID, state.appliedTitle.da, state.appliedTitle.en);
  blank(META_KEYWORDS_ROW_ID, state.keywords.da, state.keywords.en);

  const inUse = new Set<string>();
  Object.values(state.selectedItems).forEach((ids) => ids.forEach((id) => inUse.add(id)));

  state.order.forEach((key) => {
    const cat = state.categories[key];
    if (!cat || cat.isHidden) return;

    rows.push([node(NODE_ROLE.title, 0), cat.title.da, cat.title.en, "", "", "", ""]);
    if (cat.blurb.da || cat.blurb.en) {
      rows.push([node(NODE_ROLE.text, 1), cat.blurb.da, cat.blurb.en, "", "", "", ""]);
    }

    const own = Object.values(state.items).filter((it) => it.categoryId === key);
    const selectionOrder = state.selectedItems[key] ?? [];
    const ordered = own.slice().sort((a, b) => {
      const ra = selectionOrder.indexOf(a.id);
      const rb = selectionOrder.indexOf(b.id);
      return (ra === -1 ? 1e6 : ra) - (rb === -1 ? 1e6 : rb);
    });

    let openGroup: string | null = null;
    ordered.forEach((item) => {
      const groupDa = item.group.da.trim();
      const groupKey = groupDa || item.group.en.trim();
      if (groupKey && groupKey !== openGroup) {
        rows.push([node(NODE_ROLE.category, 1), item.group.da, item.group.en, "", "", "", ""]);
        openGroup = groupKey;
      } else if (!groupKey) {
        openGroup = null;
      }
      const depth = groupKey ? 2 : 1;

      rows.push([
        node(NODE_ROLE.element, depth),
        item.da.head,
        item.en.head,
        item.da.meta,
        item.da.desc,
        item.en.desc,
        inUse.has(item.id) ? "ja" : "",
      ]);

      const selected = new Set(selectedActivityIndices(state, item));
      item.activities.forEach((a, i) => {
        rows.push([node(NODE_ROLE.activity, depth + 1), a.da, a.en, "", "", "", selected.has(i) ? "ja" : ""]);
      });
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
