export type Lang = "da" | "en";

export type ByLang<T> = { da: T; en: T };

/** "entry": dated/sourced items with a description and bullet activities.
 *  "tags": a flat pill list (e.g. Kompetencer).
 *  null: pure prose — just a title + blurb, no elements (e.g. Profil). */
export type CategoryKind = "entry" | "tags" | null;

export interface Category {
  id: string;
  title: ByLang<string>;
  blurb: ByLang<string>;
  kind: CategoryKind;
  isCustom: boolean;
  isHidden: boolean;
  /** Set the moment a CSV import touches this category, independent of
   *  whether it ended up with any elements — otherwise an emptied
   *  category silently falls back to its built-in default content. */
  isReplacedByImport: boolean;
}

export interface Activity {
  da: string;
  en: string;
}

/** One element in a category's library: for "entry" categories this is a
 *  dated/sourced item with a description and a pool of bullet candidates;
 *  for "tags" categories only the `tagValue` fields are used. */
export interface LibraryItem {
  id: string;
  categoryId: string;
  isUserCreated: boolean;
  da: ElementText;
  en: ElementText;
  /** Pool of candidate bullets; which ones are picked for the current CV
   *  is tracked separately per item in AppState.selectedActivities. */
  activities: Activity[];
  /** Optional subgroup label within the category (the CSV's "Kategori"
   *  node, e.g. splitting a "Courses" category into "Bachelor"/"Master").
   *  Items sharing the same label render clustered under one subheading;
   *  absent/empty means the item isn't part of any subgroup. */
  group: ByLang<string>;
}

export interface ElementText {
  /** Heading text for an "entry" item. */
  head: string;
  /** Year/source line, language-neutral in practice but stored per language
   *  for parity with the CSV shape. */
  meta: string;
  desc: string;
  /** Pill text for a "tags" item. */
  tagValue: string;
}

export function blankElementText(): ElementText {
  return { head: "", meta: "", desc: "", tagValue: "" };
}

export interface AppState {
  lang: Lang;
  /** Display order of category ids currently in the registry. Hiding a
   *  category removes it from this list (restorable); it is distinct from
   *  a category being toggled off for the current CV (see `on`), which
   *  keeps its place in `order` but drops it from the rendered CV. */
  order: string[];
  categories: Record<string, Category>;
  items: Record<string, LibraryItem>;
  /** Per category: whether it's included in the current CV composition
   *  ("Sammensæt CV'et" tab toggle) — independent of element selection. */
  on: Record<string, boolean>;
  /** Per category: ordered ids of items selected for the current CV. */
  selectedItems: Record<string, string[]>;
  /** Per item: indices into its activities[] selected for the current CV.
   *  Absent means "all activities selected" (the default). */
  selectedActivities: Record<string, number[]>;
  /** Per category: how its elements are displayed — an id into
   *  ENTRY_VARIANTS (kind "entry") or TAG_VARIANTS (kind "tags"), chosen
   *  independently of the page-level structure. Absent means the kind's
   *  own standard (simplest) variant. */
  variant: Record<string, string>;
  appliedTitle: ByLang<string>;
  keywords: ByLang<string>;
  header: {
    name: string;
    phone: string;
    mail: string;
    location: ByLang<string>;
  };

  /** Design tokens for the CV sheet itself — ids into src/data/designTokens. */
  design: {
    font: string;
    scheme: string;
    headSize: string;
    /** Macro page layout — single/two/sidebar/marked/banded. */
    struct: string;
    headKind: string;
    density: string;
    /** Which side the sidebar sits on, when struct is "sidebar". */
    sidebarSide: string;
    /** Category/section heading (h3) size, independent of headSize. */
    headingSize: string;
    footer: {
      enabled: boolean;
      revision: string;
    };
  };
}
