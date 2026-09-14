/** The CSV is an indented outline rather than one row per element: each
 *  row is a node in a Titel → Tekst / Kategori → Element → Aktivitet
 *  hierarchy (see src/csv/exportCsv.ts and importCsv.ts). The "Knude"
 *  (node) column carries the role name, dash-prefixed by nesting depth;
 *  the value columns are read differently depending on that role. */
export const CSV_HEADER = [
  "Knude",
  "Dansk",
  "Engelsk",
  "Årstal/kilde",
  "Beskrivelse (DA)",
  "Beskrivelse (EN)",
  "Med i CV",
] as const;

export const NODE_ROLE = {
  title: "Titel",
  text: "Tekst",
  category: "Kategori",
  element: "Element",
  activity: "Aktivitet",
} as const;

export type NodeRole = (typeof NODE_ROLE)[keyof typeof NODE_ROLE];

/** Strip the leading dashes a node's nesting depth is written with and
 *  match it against a known role, case-insensitively — depth itself is
 *  cosmetic on import, the role keyword and row order carry the meaning. */
export function parseNodeRole(cell: string): NodeRole | null {
  const bare = String(cell || "").replace(/^-+/, "").trim().toLowerCase();
  const match = Object.values(NODE_ROLE).find((role) => role.toLowerCase() === bare);
  return match ?? null;
}

export const META_TITLE_ROW_ID = "_meta_titel";
export const META_KEYWORDS_ROW_ID = "_meta_noegleord";
