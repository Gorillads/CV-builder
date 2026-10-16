import type { AppState } from "../model/types";

/** Pulls just the plain-data AppState fields out of a state object that may
 *  carry extra properties alongside them — namely a Zustand Store, whose
 *  action methods (setHeaderField, addCategory, ...) aren't part of a
 *  document's actual content and must never end up copied into another
 *  store's state (they're closures bound to the store they came from, so
 *  spreading them into a different store would silently call the wrong
 *  store's `set`/`get`). Used both for the JSON backup below and for
 *  duplicating a tab (see state/tabs.ts). */
export function snapshotAppState(state: AppState): AppState {
  return {
    lang: state.lang,
    order: state.order,
    categories: state.categories,
    items: state.items,
    on: state.on,
    selectedItems: state.selectedItems,
    itemOrder: state.itemOrder,
    selectedActivities: state.selectedActivities,
    variant: state.variant,
    activityStyle: state.activityStyle,
    sidebarPlacement: state.sidebarPlacement,
    appliedTitle: state.appliedTitle,
    header: state.header,
    design: state.design,
  };
}

/** A full-state backup — unlike the CSV, this also carries header contact
 *  details, design tokens, per-category display variants, on/off toggles
 *  and order, and applied title, so restoring one puts the app back
 *  exactly as it was, not just the content library. */
export function exportJson(state: AppState): string {
  return JSON.stringify(snapshotAppState(state), null, 2);
}

export function downloadJson(state: AppState, filename = "CV-builder-backup.json"): void {
  const json = exportJson(state);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export type JsonParseResult = { ok: true; data: Partial<AppState> } | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Light structural check only — trusts the file otherwise, same spirit as
 *  the CSV importer. Rejects anything that clearly isn't one of our own
 *  backups (wrong file picked by accident) rather than trying to validate
 *  every field. */
export function parseJsonBackup(text: string): JsonParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Filen er ikke gyldig JSON." };
  }
  if (!isPlainObject(parsed)) {
    return { ok: false, error: "Filen indeholder ikke et gyldigt CV-builder-backup." };
  }
  if (!isPlainObject(parsed.categories) || !isPlainObject(parsed.items) || !Array.isArray(parsed.order)) {
    return { ok: false, error: "Filen ligner ikke en CV-builder-backup (mangler kategorier eller elementer)." };
  }
  return { ok: true, data: parsed as Partial<AppState> };
}
