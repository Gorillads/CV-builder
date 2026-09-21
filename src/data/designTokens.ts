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

export interface HeadSize {
  id: string;
  name: ByLang<string>;
  /** Font size, in px, of the name in the CV header. */
  namePx: number;
}

/** "Heading size" in the Design tab — the CV owner's own name. Its id set
 *  (small/standard/large) matches DENSITIES' own, so when
 *  AppState.design.headSize is "auto" it can look its size up straight
 *  from whichever density is picked (see resolveSize below). */
export const HEAD_SIZES: HeadSize[] = [
  { id: "small", name: { da: "Lille", en: "Small" }, namePx: 22 },
  { id: "standard", name: { da: "Standard", en: "Standard" }, namePx: 27 },
  { id: "large", name: { da: "Stor", en: "Large" }, namePx: 32 },
];

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

export interface Density {
  id: string;
  name: ByLang<string>;
}

/** The overall/master size lever — like a game's single graphics-quality
 *  preset, it sets the default for every individual size control below
 *  (HEAD_SIZES, HEADING_SIZES, TEXT_SIZES) at once, and also tightens or
 *  loosens section/entry spacing directly (see the .density-* rules in
 *  App.css) so picking "small" is the one-lever way to fit more content
 *  on the page. Any individual control can still be set explicitly
 *  (overriding this default for just that one text type) via its own
 *  "auto" vs explicit-size choice — see AppState.design's field comments. */
export const DENSITIES: Density[] = [
  { id: "small", name: { da: "Kompakt (mere på siden)", en: "Compact (more on the page)" } },
  { id: "standard", name: { da: "Standard", en: "Standard" } },
  { id: "large", name: { da: "Rummelig", en: "Spacious" } },
];

export interface SidebarSide {
  id: string;
  name: ByLang<string>;
}

export const SIDEBAR_SIDES: SidebarSide[] = [
  { id: "right", name: { da: "Højre (standard)", en: "Right (default)" } },
  { id: "left", name: { da: "Venstre", en: "Left" } },
];

export interface HeadingSize {
  id: string;
  name: ByLang<string>;
  px: number;
}

/** Font size of a category/section heading (h3) — "heading 2" in the
 *  Design tab, independent of the name's own "heading" size control
 *  above. Its id set (small/standard/large) matches DENSITIES' own, so
 *  when AppState.design.headingSize is "auto" it can look its size up
 *  straight from whichever density is picked (see CvPreview.tsx). */
export const HEADING_SIZES: HeadingSize[] = [
  { id: "small", name: { da: "Lille", en: "Small" }, px: 11 },
  { id: "standard", name: { da: "Standard", en: "Standard" }, px: 12.5 },
  { id: "large", name: { da: "Stor", en: "Large" }, px: 14.5 },
];

export interface TextSize {
  id: string;
  name: ByLang<string>;
  /** Font size, in px, of the CV's body text — profile/description text,
   *  entry meta/comment lines and activity bullets alike; everything that
   *  isn't the name or a section/entry heading. */
  px: number;
}

/** Same role as HEAD_SIZES/HEADING_SIZES but for body text — "text size"
 *  in the Design tab. Its id set matches DENSITIES' own for the same
 *  "auto" lookup (see HEADING_SIZES above). */
export const TEXT_SIZES: TextSize[] = [
  { id: "small", name: { da: "Lille", en: "Small" }, px: 12 },
  { id: "standard", name: { da: "Standard", en: "Standard" }, px: 13 },
  { id: "large", name: { da: "Stor", en: "Large" }, px: 14 },
];

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

/** Resolves one of the individual size controls (HEAD_SIZES, HEADING_SIZES,
 *  TEXT_SIZES) against its stored id — "auto" (the default, "follow the
 *  overall density") falls back to whichever entry shares the current
 *  density's own id, so picking "small"/"standard"/"large" density moves
 *  every "auto" control together, the same way a game's overall graphics
 *  preset drives every individual setting left on "auto". An explicit
 *  size id overrides that for just this one control. */
export function resolveSize<T extends { id: string }>(list: T[], id: string, densityId: string): T {
  return byId(list, id === "auto" ? densityId : id);
}
