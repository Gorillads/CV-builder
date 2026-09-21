export type Lang = "da" | "en";

export type ByLang<T> = { da: T; en: T };

export interface Category {
  id: string;
  title: ByLang<string>;
  blurb: ByLang<string>;
  isCustom: boolean;
  /** Excludes the category from the Tailor tab and the CV entirely — set
   *  only as a side effect of a CSV import that no longer mentions this
   *  category (see applyImportPlan), never by a direct user action. A
   *  category a user collapses by hand stays fully visible/selectable;
   *  see isCollapsed for that. */
  isHidden: boolean;
  /** Collapses this category to a single line in the Content tab — the
   *  same display convenience as LibraryItem.isCollapsed / Activity.isCollapsed,
   *  unrelated to whether it's included in the CV (see AppState.on) or
   *  shown in the Tailor tab. */
  isCollapsed: boolean;
  /** Set the moment a CSV import touches this category, independent of
   *  whether it ended up with any elements — otherwise an emptied
   *  category silently falls back to its built-in default content. */
  isReplacedByImport: boolean;
}

export interface Activity {
  da: string;
  en: string;
  /** Collapses this bullet to a single line in the Content tab — a display
   *  convenience for scanning/reordering a long list, unrelated to whether
   *  it's picked for the current CV (see AppState.selectedActivities). */
  isCollapsed: boolean;
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
  /** Collapses this element to a single line in the Content tab — same
   *  display convenience as Activity.isCollapsed, unrelated to whether
   *  it's picked for the current CV (see AppState.selectedItems). */
  isCollapsed: boolean;
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
  /** Display order of every category id in the registry, hidden ones
   *  included — a hidden category (see Category.isHidden) keeps its place
   *  here and is still draggable, just collapsed to one line in the
   *  Content tab. Distinct from a category being toggled off for the
   *  current CV (see `on`), which is a separate, unrelated switch. */
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
  /** Per item (LibraryItem id): how that entry's own activity bullets are
   *  displayed — an id into ACTIVITY_STYLES (see src/data/designTokens): a
   *  bulleted list, or a single dot-separated line. Only relevant for a
   *  category variant that renders activities at all; absent means the
   *  list style (the current default). */
  activityStyle: Record<string, string>;
  /** Per category: explicit override of which column it renders in when
   *  design.struct is "sidebar" or "two" — true for the second column (the
   *  sidebar, or the right-hand column under "two"), false for the first.
   *  Absent falls back to SIDE_DEFAULT (see src/data/designTokens'
   *  isInSidebar), so existing saved documents keep their current look
   *  without needing every category listed here. */
  sidebarPlacement: Record<string, boolean>;
  appliedTitle: ByLang<string>;
  header: {
    name: string;
    /** Street address (or however granular the user wants) — shown on the
     *  contact line before phone, same as phone/mail not translated per
     *  language (unlike location, which is a city name that often does
     *  need its own translation). */
    address: string;
    phone: string;
    mail: string;
    location: ByLang<string>;
    /** Optional profile picture, as a data URL — empty string means none.
     *  Resized/re-encoded client-side on upload (see DesignTab.tsx) to keep
     *  it reasonably small in localStorage and JSON backups. */
    photo: string;
  };

  /** Design tokens for the CV sheet itself — ids into src/data/designTokens. */
  design: {
    font: string;
    scheme: string;
    /** "Heading size" (the CV owner's own name) — a slider, "auto" follows
     *  `density` (see below), or a stringified 0-9 step into HEAD_SIZES
     *  overrides it just for this one text type (see resolveSizePx in
     *  src/data/designTokens). */
    headSize: string;
    /** Macro page layout — single/two/sidebar/marked/banded. */
    struct: string;
    headKind: string;
    /** The overall/master size lever — a slider, a stringified 0-9 step
     *  (see SIZE_STEPS/DEFAULT_SIZE_STEP in src/data/designTokens) rather
     *  than a named option. Like a game's single graphics-quality preset,
     *  it's the default every "auto" individual size control (headSize,
     *  headingSize, textSize, elementTextSize, sectionGap, entryGap) falls
     *  back to. A smaller step is the one-slider way to fit more content
     *  on the page; any individual control can still be pinned to an
     *  explicit step instead of following it. */
    density: string;
    /** Which side the sidebar sits on, when struct is "sidebar". */
    sidebarSide: string;
    /** "Heading 2 size" (category/section headings) — same "auto" vs
     *  explicit-step-into-HEADING_SIZES shape as headSize above,
     *  independent of it. */
    headingSize: string;
    /** "Text size" (general body text: a category's own blurb, tag/chip
     *  labels, an entry's own heading/meta line) — same "auto" vs
     *  explicit-step-into-TEXT_SIZES shape as headSize/headingSize above.
     *  Does not cover the contact line (see contactSize below) or an
     *  element's own description/comment/activities (see elementTextSize
     *  below). */
    textSize: string;
    /** "Text in elements" (an element's own description, its short italic
     *  comment line, and its activity bullets) — same "auto" vs
     *  explicit-step-into-ELEMENT_TEXT_SIZES shape as the other size
     *  controls, independent of textSize above. */
    elementTextSize: string;
    /** "Contact line size" (address · phone · mail · location, plus the
     *  applied-title line right above it — see CONTACT_SIZES in
     *  src/data/designTokens) — same "auto" vs explicit-step-into-
     *  CONTACT_SIZES shape as the other size controls, independent of
     *  textSize above. */
    contactSize: string;
    /** "Section spacing" (margin-bottom of a category section) — same
     *  "auto" vs explicit-step-into-SECTION_GAPS shape as the other size
     *  controls. */
    sectionGap: string;
    /** "Element spacing" (margin-bottom of an entry within a section) —
     *  same "auto" vs explicit-step-into-ENTRY_GAPS shape as the other
     *  size controls. */
    entryGap: string;
    /** Diameter of the optional profile picture (see header.photo) — an id
     *  into PHOTO_SIZES (see src/data/designTokens), independent of whether
     *  a photo is actually set. */
    photoSize: string;
    /** Where the profile picture sits relative to the name/title/contact
     *  block — an id into PHOTO_POSITIONS (see src/data/designTokens). */
    photoPosition: string;
    footer: {
      enabled: boolean;
      revision: string;
    };
  };
}
