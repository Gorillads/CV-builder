import type { ByLang } from "../model/types";

export interface FontPairing {
  id: string;
  name: ByLang<string>;
  head: string;
  body: string;
}

export const FONTS: FontPairing[] = [
  {
    id: "industry",
    name: { da: "Industry (kondenseret)", en: "Industry (condensed)" },
    head: '"Barlow Condensed", sans-serif',
    body: '"Barlow", sans-serif',
  },
  {
    id: "plex",
    name: { da: "Teknisk (IBM Plex)", en: "Technical (IBM Plex)" },
    head: '"IBM Plex Sans", sans-serif',
    body: '"IBM Plex Sans", sans-serif',
  },
  {
    id: "aptos",
    name: { da: "Aptos (Office)", en: "Aptos (Office)" },
    head: 'Aptos, "Source Sans 3", sans-serif',
    body: 'Aptos, "Source Sans 3", sans-serif',
  },
  {
    id: "roboto",
    name: { da: "Roboto", en: "Roboto" },
    head: '"Roboto", sans-serif',
    body: '"Roboto", sans-serif',
  },
  {
    id: "lato",
    name: { da: "Lato", en: "Lato" },
    head: '"Lato", sans-serif',
    body: '"Lato", sans-serif',
  },
  {
    id: "public",
    name: { da: "Public Sans", en: "Public Sans" },
    head: '"Public Sans", sans-serif',
    body: '"Public Sans", sans-serif',
  },
];

export interface ColorScheme {
  id: string;
  name: ByLang<string>;
  accent: string;
  soft: string;
  line: string;
  chipBorder: string;
  chipBg: string;
  chipFg: string;
}

export const SCHEMES: ColorScheme[] = [
  { id: "staal", name: { da: "Stål (standard)", en: "Steel (default)" }, accent: "#416180", soft: "#597ea3", line: "#9db3c7", chipBorder: "#b5d9fd", chipBg: "#eef6ff", chipFg: "#2c455d" },
  { id: "grafit", name: { da: "Grafit", en: "Graphite" }, accent: "#3a3a3d", soft: "#5d5d60", line: "#a4a4a7", chipBorder: "#c8c8cb", chipBg: "#e9e9ec", chipFg: "#2b2b2d" },
  { id: "marine", name: { da: "Marine", en: "Marine" }, accent: "#24405c", soft: "#3d5f80", line: "#8fa9c1", chipBorder: "#aec6de", chipBg: "#e8f0f7", chipFg: "#1b3247" },
  { id: "kobber", name: { da: "Kobber", en: "Copper" }, accent: "#8a4b2f", soft: "#a5674a", line: "#c99872", chipBorder: "#e2c3b2", chipBg: "#f7ece6", chipFg: "#63341f" },
  { id: "skov", name: { da: "Skov", en: "Forest" }, accent: "#2f5546", soft: "#487262", line: "#8bab98", chipBorder: "#b8cfc5", chipBg: "#eaf2ee", chipFg: "#224034" },
];

/** Number of steps every size slider (density, and the four individual
 *  controls below) offers — a plain 0-9 position, unnamed, rather than a
 *  handful of named categories (Small/Standard/Large, ...). */
export const SIZE_STEPS = 10;
/** The step every slider defaults to — chosen so its px value below (index
 *  4 in each table) matches what used to be the "Standard" named option,
 *  so a document saved before sliders existed keeps rendering at the same
 *  size once migrated (see migrateDensityScale/migrateSizeSliders in
 *  state/store.ts). */
export const DEFAULT_SIZE_STEP = 4;

/** Font size, in px, of the name in the CV header ("Heading size" in the
 *  Design tab) at each of the 10 slider positions — index 4 (27px, the old
 *  "Standard") is the default. */
export const HEAD_SIZES: number[] = [18, 20, 22, 24, 27, 29, 31, 33, 35, 38];

export interface LayoutStructure {
  id: string;
  name: ByLang<string>;
}

/** Macro page layout only — which columns exist and where. How each
 *  section's own content is laid out is a separate, per-category choice
 *  (see VARIANTS below). */
export const STRUCTS: LayoutStructure[] = [
  { id: "single", name: { da: "Én spalte (standard)", en: "Single column (default)" } },
  { id: "sidebar", name: { da: "Sidebar", en: "Sidebar" } },
  { id: "two", name: { da: "To spalter", en: "Two columns" } },
  { id: "marked", name: { da: "Markeret (accentkant)", en: "Marked (accent rail)" } },
  { id: "banded", name: { da: "Bånd (farvet headerfelt)", en: "Banded (colored header field)" } },
];

export interface HeaderAlignment {
  id: string;
  name: ByLang<string>;
}

export const HEADS: HeaderAlignment[] = [
  { id: "left", name: { da: "Venstre (standard)", en: "Left (default)" } },
  { id: "center", name: { da: "Centreret", en: "Centred" } },
  { id: "inline", name: { da: "Lav linje", en: "Low line" } },
];

/** The overall/master size lever, a plain 0-9 slider position (see
 *  SIZE_STEPS/DEFAULT_SIZE_STEP above) — like a game's single
 *  graphics-quality preset, it's the default every individual size
 *  control below (HEAD_SIZES, HEADING_SIZES, TEXT_SIZES,
 *  ELEMENT_TEXT_SIZES, SECTION_GAPS, ENTRY_GAPS) falls back to. Any
 *  individual control can still be pinned to an explicit step instead of
 *  following it — see AppState.design's field comments. There's no
 *  longer a named table for density itself (a slider position needs no
 *  name), just the 0-9 range other controls resolve their own step
 *  against. */

export interface SidebarSide {
  id: string;
  name: ByLang<string>;
}

export const SIDEBAR_SIDES: SidebarSide[] = [
  { id: "right", name: { da: "Højre (standard)", en: "Right (default)" } },
  { id: "left", name: { da: "Venstre", en: "Left" } },
];

/** Font size of a category/section heading (h3) — "heading 2 size" in the
 *  Design tab, independent of the name's own "heading size" control
 *  above — at each of the 10 slider positions. Index 4 (12.5px, the old
 *  "Standard") is the default. */
export const HEADING_SIZES: number[] = [9, 10, 11.25, 12, 12.5, 13, 13.75, 14.5, 15.5, 17];

/** Font size, in px, of the CV's general body text — a category's own
 *  blurb, tag/chip labels, an entry's own heading/meta line; everything
 *  that isn't the name, a section/entry heading, the contact line (see
 *  CONTACT_SIZES below for that), or text inside an element (see
 *  ELEMENT_TEXT_SIZES below for that) — "text size" in the Design tab, at
 *  each of the 10 slider positions. Index 4 (13px, the old "Standard") is
 *  the default. */
export const TEXT_SIZES: number[] = [10, 11, 11.5, 12, 13, 13.5, 14, 14.5, 15, 16];

/** Same role as TEXT_SIZES but scoped to an element's own body content
 *  (description/comment/activities) — "text in elements" in the Design
 *  tab, at each of the 10 slider positions. Index 4 (12.5px, the old
 *  "Standard") is the default. */
export const ELEMENT_TEXT_SIZES: number[] = [9.5, 10, 10.5, 11.5, 12.5, 13, 13.5, 14.5, 15.5, 16.5];

/** Font size, in px, of the header's own contact line (address · phone ·
 *  mail · location) — "contact line size" in the Design tab, at each of
 *  the 10 slider positions. Index 4 (12.5px, the old fixed value) is the
 *  default. The applied-title line (see .cv-applied-title in App.css)
 *  scales off this same control too, at a fixed 1.12 ratio to its own old
 *  14px vs. this table's old 12.5px, rather than getting its own slider —
 *  they're both part of the same "line under the name" grouping. */
export const CONTACT_SIZES: number[] = [9.5, 10, 10.5, 11.5, 12.5, 13, 13.5, 14.5, 15.5, 16.5];

/** Diameter, in px, of an element's own optional logo (see
 *  LibraryItem.logo) — "logo size" in the Design tab, at each of the 10
 *  slider positions. Rendered too small at every step before (10-28px,
 *  default 16px, then briefly 6-20px, default 10px); index 4 (32px) is
 *  now the default, and the largest step (56px) lets it stand out
 *  clearly next to the title. */
export const LOGO_SIZES: number[] = [16, 20, 24, 28, 32, 37, 42, 46, 51, 56];

/** Margin-bottom, in px, of a category section (.cv-section) at each of
 *  the 10 slider positions — "section spacing" in the Design tab's
 *  advanced controls. Index 4 (18px) is the default, the same margin
 *  .cv-section always had before density could change it. */
export const SECTION_GAPS: number[] = [8.4, 10.8, 13.2, 15.6, 18, 20.4, 22.8, 25.2, 27.6, 30];

/** Margin-bottom, in px, of an entry within a section (.cv-entry/
 *  .cv-entry--line) at each of the 10 slider positions — "element
 *  spacing" in the Design tab's advanced controls. Index 4 (9px) is the
 *  default, the same margin .cv-entry always had before density could
 *  change it. */
export const ENTRY_GAPS: number[] = [4.2, 5.4, 6.6, 7.8, 9, 10.2, 11.4, 12.6, 13.8, 15];

export interface PhotoSize {
  id: string;
  name: ByLang<string>;
  /** Diameter, in px, of the profile picture on the CV. */
  px: number;
}

/** Diameter options for the optional profile picture (see AppState.header.photo). */
export const PHOTO_SIZES: PhotoSize[] = [
  { id: "small", name: { da: "Lille", en: "Small" }, px: 64 },
  { id: "standard", name: { da: "Standard", en: "Standard" }, px: 88 },
  { id: "large", name: { da: "Stor", en: "Large" }, px: 112 },
];

export interface PhotoPosition {
  id: string;
  name: ByLang<string>;
}

/** Where the profile picture sits relative to the name/title/contact block. */
export const PHOTO_POSITIONS: PhotoPosition[] = [
  { id: "left", name: { da: "Venstre for teksten", en: "Left of the text" } },
  { id: "right", name: { da: "Højre for teksten", en: "Right of the text" } },
  { id: "top", name: { da: "Over teksten", en: "Above the text" } },
];

export interface Variant {
  id: string;
  name: ByLang<string>;
}

/** Per-category display format — independent of the page-level structure
 *  and available to every category alike. "standard" (full name, year/
 *  source, description and activities) is always the default; "chips"
 *  and "inline" are compact, name-only alternatives for a category a
 *  user wants to show as a dense pill list (e.g. Kompetencer). */
export const VARIANTS: Variant[] = [
  { id: "standard", name: { da: "Standard", en: "Standard" } },
  { id: "rows", name: { da: "Rækker (år i egen spalte)", en: "Rows (year in its own column)" } },
  { id: "line", name: { da: "Linje (kun titel + år)", en: "Line (title + year only)" } },
  { id: "two-col", name: { da: "To spalter (i sektionen)", en: "Two columns (within the section)" } },
  { id: "chips", name: { da: "Mærker", en: "Chips" } },
  { id: "inline", name: { da: "Én linje", en: "Inline" } },
];

export function defaultVariant(): string {
  return "standard";
}

export function variantsFor(): Variant[] {
  return VARIANTS;
}

export interface ActivityStyle {
  id: string;
  name: ByLang<string>;
}

/** How an entry's activity bullets are displayed — independent of `variant`,
 *  since it only matters for entry variants that render activities at all
 *  (not "line", "chips" or "inline"). */
export const ACTIVITY_STYLES: ActivityStyle[] = [
  { id: "list", name: { da: "Liste", en: "List" } },
  { id: "inline", name: { da: "Inline", en: "Inline" } },
];

export function defaultActivityStyle(): string {
  return "list";
}

/** Categories that default to the second column — the sidebar under
 *  structure="sidebar", or the right-hand column under structure="two" —
 *  before any per-category override in AppState.sidebarPlacement. */
export const SIDE_DEFAULT = new Set(["kompetencer", "sprog", "kurser", "certificeringer", "interesser"]);

/** Whether a category renders in the second column under structure="sidebar"
 *  or structure="two" — an explicit entry in sidebarPlacement wins,
 *  otherwise falls back to SIDE_DEFAULT so existing documents look the same
 *  as before this override existed. */
export function isInSidebar(categoryId: string, sidebarPlacement: Record<string, boolean>): boolean {
  return sidebarPlacement[categoryId] ?? SIDE_DEFAULT.has(categoryId);
}

export function byId<T extends { id: string }>(list: T[], id: string): T {
  return list.find((x) => x.id === id) ?? list[0];
}

/** Clamps a slider step to a valid index into a 10-entry size table
 *  (falls back to DEFAULT_SIZE_STEP for anything that doesn't parse, e.g.
 *  a stray "auto" that reached here by mistake). */
export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return DEFAULT_SIZE_STEP;
  return Math.min(SIZE_STEPS - 1, Math.max(0, Math.round(step)));
}

/** Resolves one of the individual size sliders (HEAD_SIZES, HEADING_SIZES,
 *  TEXT_SIZES, ELEMENT_TEXT_SIZES, SECTION_GAPS, ENTRY_GAPS) against its
 *  stored value — "auto" (the default, "follow the overall density")
 *  falls back to the density slider's own step, so dragging density moves
 *  every "auto" control together, the same way a game's overall graphics
 *  preset drives every individual setting left on "auto". An explicit
 *  step (a stringified 0-9 number) overrides that for just this one
 *  control. */
export function resolveSizePx(sizes: number[], value: string, densityStep: number): number {
  const step = value === "auto" ? densityStep : clampStep(Number(value));
  return sizes[clampStep(step)];
}
