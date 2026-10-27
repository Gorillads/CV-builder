import { create } from "zustand";

/** Every distinct kind of text/content the CV preview renders, each tied
 *  to exactly one pair of Design-tab controls (a size field and/or a color
 *  field — see DENSITY_FIELDS/THEME_FIELDS below) and, for anything below
 *  category level, back to the item/activity that produced it. Used by
 *  CvPreview to say what's under the mouse, and by ContentTab/TailorTab/
 *  DesignTab to light up whatever corresponds to it — see
 *  useIsHovered/useIsAncestorHovered below. */
export type HoverKind =
  | "name"
  | "appliedTitle"
  | "contact"
  | "sectionHeading"
  | "blurb"
  | "entryHeading"
  | "entryMeta"
  | "entryComment"
  | "entryDesc"
  | "activity"
  | "chip"
  | "logo";

export interface HoverTarget {
  kind: HoverKind;
  categoryId?: string;
  itemId?: string;
  activityIndex?: number;
}

/** The Design tab's "auto, unless pinned" size field(s) that a given kind
 *  of preview content is sized by — see HEADING3_SIZES etc. in
 *  designTokens.ts, each field named exactly as design.<field>. */
export const DENSITY_FIELDS: Partial<Record<HoverKind, string[]>> = {
  name: ["headSize"],
  appliedTitle: ["contactSize"],
  contact: ["contactSize"],
  sectionHeading: ["headingSize"],
  blurb: ["bodyTextSize"],
  entryHeading: ["heading3Size"],
  entryMeta: ["underheadingSize"],
  entryComment: ["elementTextSize"],
  entryDesc: ["elementTextSize"],
  activity: ["activitySize"],
  chip: ["chipSize"],
  logo: ["logoSize"],
};

/** The Theme tab's color field for a given kind — logo has none (it isn't
 *  colored by Theme at all). */
export const THEME_FIELDS: Partial<Record<HoverKind, string[]>> = {
  name: ["heading1Color"],
  appliedTitle: ["contactColor"],
  contact: ["contactColor"],
  sectionHeading: ["heading2Color"],
  blurb: ["bodyTextColor"],
  entryHeading: ["heading3Color"],
  entryMeta: ["underheadingColor"],
  entryComment: ["elementTextColor"],
  entryDesc: ["elementTextColor"],
  activity: ["activityColor"],
  chip: ["chipColor"],
};

interface HoverTargetStore {
  target: HoverTarget | null;
  setTarget: (target: HoverTarget | null) => void;
}

/** Deliberately a plain, unpersisted store rather than part of
 *  state/store.ts (AppState) — this is purely transient cross-pane UI
 *  state (what the mouse is over right now), never saved, and shared by
 *  every open document tab rather than scoped to one, since only one
 *  document's editor + preview pane is ever visible at a time anyway. */
export const useHoverTargetStore = create<HoverTargetStore>((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
}));

export function useHoverTarget(): HoverTarget | null {
  return useHoverTargetStore((s) => s.target);
}

/** Whether the given hover target is *the* literal source of some editor
 *  control — one or more kinds (an item's own heading doubles as both
 *  "entryHeading", in a standard entry, and "chip", in the chips variant,
 *  so a control that applies to either accepts both), plus whichever of
 *  categoryId/itemId/activityIndex are relevant narrow it further. Omit an
 *  id field entirely for a control that isn't scoped to one (e.g. a
 *  Design-tab slider, which only cares about kind). */
export function isExactHover(
  target: HoverTarget | null,
  kind: HoverKind | HoverKind[],
  ids: { categoryId?: string; itemId?: string; activityIndex?: number } = {},
): boolean {
  if (!target) return false;
  const kinds = Array.isArray(kind) ? kind : [kind];
  if (!kinds.includes(target.kind)) return false;
  if (ids.categoryId !== undefined && target.categoryId !== ids.categoryId) return false;
  if (ids.itemId !== undefined && target.itemId !== ids.itemId) return false;
  if (ids.activityIndex !== undefined && target.activityIndex !== ids.activityIndex) return false;
  return true;
}

/** Whether the hovered element lives *inside* this category — true for
 *  any kind, so a category card/row lights up (at the lighter "ancestor"
 *  weight) no matter which of its own items/fields is actually hovered,
 *  making it findable even while collapsed. */
export function isCategoryAncestorHover(target: HoverTarget | null, categoryId: string): boolean {
  return !!target && target.categoryId === categoryId;
}

/** Same as isCategoryAncestorHover, one level down — true while anything
 *  belonging to this specific item (its heading, meta, an activity, its
 *  logo, ...) is hovered. */
export function isItemAncestorHover(target: HoverTarget | null, itemId: string): boolean {
  return !!target && target.itemId === itemId;
}

/** Whether the hovered element's kind is sized by this Density field —
 *  for the DesignTab sliders, which (unlike the editor's own rows) are
 *  global and never scoped to a particular category/item. */
export function isDensityFieldHovered(target: HoverTarget | null, field: string): boolean {
  if (!target) return false;
  return (DENSITY_FIELDS[target.kind] ?? []).includes(field);
}

/** Same as isDensityFieldHovered, for the Theme tab's color fields. */
export function isThemeFieldHovered(target: HoverTarget | null, field: string): boolean {
  if (!target) return false;
  return (THEME_FIELDS[target.kind] ?? []).includes(field);
}

/** Spreadable onMouseEnter/onMouseLeave props for a hoverable preview
 *  element — sets the shared target on enter, clears it on leave. Every
 *  hoverable element in CvPreview is a leaf or near-leaf in the DOM (no
 *  hoverable element is nested inside another one), so an unconditional
 *  clear on leave never fights a sibling's own enter/leave pair. */
export function hoverTargetProps(target: HoverTarget) {
  const setTarget = useHoverTargetStore.getState().setTarget;
  return {
    onMouseEnter: () => setTarget(target),
    onMouseLeave: () => setTarget(null),
  };
}
