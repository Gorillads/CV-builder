import type { AppState, LibraryItem } from "../model/types";
import { CSV_HEADER, META_TITLE_ROW_ID, NODE_ROLE } from "./columns";

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
 *  Titel → Tekst → Element → Aktivitet hierarchy — see src/csv/columns.ts.
 *  A meta row carries the applied job title ahead of the category tree. */
export function exportCsv(state: AppState): string {
  const rows: string[][] = [[...CSV_HEADER]];
  const blank = (knude: string, da: string, en: string) => rows.push([knude, da, en, "", "", "", "", "", ""]);

  blank(META_TITLE_ROW_ID, state.appliedTitle.da, state.appliedTitle.en);

  const inUse = new Set<string>();
  Object.values(state.selectedItems).forEach((ids) => ids.forEach((id) => inUse.add(id)));

  state.order.forEach((key) => {
    const cat = state.categories[key];
    if (!cat || cat.isHidden) return;

    rows.push([node(NODE_ROLE.title, 0), cat.title.da, cat.title.en, "", "", "", "", "", ""]);
    if (cat.blurb.da || cat.blurb.en) {
      rows.push([node(NODE_ROLE.text, 1), cat.blurb.da, cat.blurb.en, "", "", "", "", "", ""]);
    }

    const own = Object.values(state.items).filter((it) => it.categoryId === key);
    const itemOrder = state.itemOrder[key] ?? [];
    const ordered = own.slice().sort((a, b) => {
      const ra = itemOrder.indexOf(a.id);
      const rb = itemOrder.indexOf(b.id);
      return (ra === -1 ? 1e6 : ra) - (rb === -1 ? 1e6 : rb);
    });

    ordered.forEach((item) => {
      rows.push([
        node(NODE_ROLE.element, 1),
        item.da.head,
        item.en.head,
        item.da.meta,
        item.da.comment,
        item.en.comment,
        item.da.desc,
        item.en.desc,
        inUse.has(item.id) ? "ja" : "",
      ]);

      const selected = new Set(selectedActivityIndices(state, item));
      item.activities.forEach((a, i) => {
        rows.push([node(NODE_ROLE.activity, 2), a.da, a.en, "", "", "", "", "", selected.has(i) ? "ja" : ""]);
      });
    });
  });

  return "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
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
