import type { ByLang, CategoryKind } from "../model/types";

export interface FontPairing {
  id: string;
  name: ByLang<string>;
  head: string;
  body: string;
  /** Google Fonts family name(s) to load for this pairing, if any — Aptos
   *  is the one pairing with no web font (it's Microsoft's own), so it
   *  falls through to its Google Fonts stand-in at display time. */
  googleFamilies: string[];
}

export const FONTS: FontPairing[] = [
  {
    id: "industry",
    name: { da: "Industry (kondenseret)", en: "Industry (condensed)" },
    head: '"Barlow Condensed", sans-serif',
    body: '"Barlow", sans-serif',
    googleFamilies: ["Barlow Condensed:wght@500;600;700", "Barlow:wght@400;500;600"],
  },
  {
    id: "plex",
    name: { da: "Teknisk (IBM Plex)", en: "Technical (IBM Plex)" },
    head: '"IBM Plex Sans", sans-serif',
    body: '"IBM Plex Sans", sans-serif',
    googleFamilies: ["IBM Plex Sans:wght@400;500;600;700"],
  },
  {
    id: "aptos",
    name: { da: "Aptos (Office)", en: "Aptos (Office)" },
    head: 'Aptos, "Source Sans 3", sans-serif',
    body: 'Aptos, "Source Sans 3", sans-serif',
    googleFamilies: ["Source Sans 3:wght@400;500;600;700"],
  },
  {
    id: "roboto",
    name: { da: "Roboto", en: "Roboto" },
    head: '"Roboto", sans-serif',
    body: '"Roboto", sans-serif',
    googleFamilies: ["Roboto:wght@400;500;600;700"],
  },
  {
    id: "lato",
    name: { da: "Lato", en: "Lato" },
    head: '"Lato", sans-serif',
    body: '"Lato", sans-serif',
    googleFamilies: ["Lato:wght@400;700;900"],
  },
  {
    id: "public",
    name: { da: "Public Sans", en: "Public Sans" },
    head: '"Public Sans", sans-serif',
    body: '"Public Sans", sans-serif',
    googleFamilies: ["Public Sans:wght@400;500;600;700"],
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
 *  (see ENTRY_VARIANTS / TAG_VARIANTS below). */
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

export const DENSITIES: Density[] = [
  { id: "standard", name: { da: "Standard", en: "Standard" } },
  { id: "compact", name: { da: "Kompakt (mere på siden)", en: "Compact (more on the page)" } },
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

/** Font size of a category/section heading (h3) — independent of the
 *  overall header/name size control. */
export const HEADING_SIZES: HeadingSize[] = [
  { id: "small", name: { da: "Lille", en: "Small" }, px: 11 },
  { id: "standard", name: { da: "Standard", en: "Standard" }, px: 12.5 },
  { id: "large", name: { da: "Stor", en: "Large" }, px: 14.5 },
];

export interface Variant {
  id: string;
  name: ByLang<string>;
}

/** Per-category display format for "entry" sections — independent of the
 *  page-level structure. "standard" is always the simplest/default. */
export const ENTRY_VARIANTS: Variant[] = [
  { id: "standard", name: { da: "Standard", en: "Standard" } },
  { id: "rows", name: { da: "Rækker (år i egen spalte)", en: "Rows (year in its own column)" } },
  { id: "line", name: { da: "Linje (kun titel + år)", en: "Line (title + year only)" } },
  { id: "two-col", name: { da: "To spalter (i sektionen)", en: "Two columns (within the section)" } },
];

/** Per-category display format for "tags" sections. "list" — a plain
 *  bold list, one per line — is the standard/simplest; "chips" are the
 *  rounded-pill alternative. */
export const TAG_VARIANTS: Variant[] = [
  { id: "list", name: { da: "Standard", en: "Standard" } },
  { id: "chips", name: { da: "Mærker", en: "Chips" } },
  { id: "inline", name: { da: "Én linje", en: "Inline" } },
];

export function defaultVariant(kind: CategoryKind): string {
  if (kind === "tags") return "list";
  return "standard";
}

export function variantsFor(kind: CategoryKind): Variant[] {
  if (kind === "tags") return TAG_VARIANTS;
  if (kind === "entry") return ENTRY_VARIANTS;
  return [];
}

/** Categories that default to the sidebar column when structure="sidebar". */
export const SIDE_DEFAULT = new Set(["kompetencer", "sprog", "kurser", "certificeringer", "interesser"]);

export function byId<T extends { id: string }>(list: T[], id: string): T {
  return list.find((x) => x.id === id) ?? list[0];
}
