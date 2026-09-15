export type Lang = "da" | "en";

export type ByLang<T> = { da: T; en: T };

export interface Category {
  id: string;
  title: ByLang<string>;
  blurb: ByLang<string>;
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

/** One element in a category's library: a dated/sourced item with a
 *  heading, description and a pool of bullet candidates. Every category
 *  stores its content this same way, so a category meant for short pill-
 *  style entries (e.g. Kompetencer) uses the same shape — it just picks a
 *  compact display variant (see src/data/designTokens) rather than a
 *  different element structure. */
export interface LibraryItem {
  id: string;
  categoryId: string;
  isUserCreated: boolean;
  da: ElementText;
  en: ElementText;
  /** Pool of candidate bullets; which ones are picked for the current CV
   *  is tracked separately per item in AppState.selectedActivities. */
  activities: Activity[];
}

export interface ElementText {
  /** Heading/name text for the item. */
  head: string;
  /** Year/source line, language-neutral in practice but stored per language
   *  for parity with the CSV shape. */
  meta: string;
  /** Short optional note shown right below the heading — a quick bit of
   *  context the heading alone doesn't convey. */
  comment: string;
  desc: string;
}

export function blankElementText(): ElementText {
  return { head: "", meta: "", comment: "", desc: "" };
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
  /** Per category: display/CV order of every item in the category
   *  (selected or not) — the single order shown and drag-reorderable in
   *  both the Content and Tailor tabs, and the order items are emitted in
   *  on the CV and in the CSV export. */
  itemOrder: Record<string, string[]>;
  /** Per item: indices into its activities[] selected for the current CV.
   *  Absent means "all activities selected" (the default). */
  selectedActivities: Record<string, number[]>;
  /** Per category: how its elements are displayed — an id into VARIANTS
   *  (see src/data/designTokens), chosen independently of the page-level
   *  structure. Absent means the standard (simplest, full-detail) variant. */
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
