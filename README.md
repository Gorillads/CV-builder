# CV Builder

A CV/resume builder whose entire content library — every section, every
bullet, every piece of copy — can be edited two equivalent ways: **in-app**
(a card-based editor with a live preview) and **via CSV** (export the
library as a spreadsheet, edit it in Excel, re-import it). Both paths write
to the same underlying data, so a change made one way shows up the other
way immediately.

This is a from-scratch React/TypeScript rebuild of an earlier Claude
Design prototype (`CV Skabelon.dc.html`, kept as a design reference — see
its own README for the full functional spec this app implements).

## The core model

- **Categories** ("modules") — Profil, Erfaring, Kompetencer, etc. Every
  category has the same shape: a stable id, a title and blurb per
  language, and zero or more elements. There's no separate "kind" —
  a category meant to read as a compact pill list (e.g. Kompetencer)
  isn't structurally different, it just picks a compact display variant
  (see Design tokens below) on the same element structure everything
  else uses.
- **Library items** — the content within a category. Whether an item is
  *in the library* (exists) and whether it's *selected for the current CV*
  are independent, so you can keep a large pool of bullets and pick a
  relevant subset per job application.
- **Built-in vs. custom categories** — 16 built-ins ship with placeholder
  content. Built-ins can be hidden (restorable); custom ones (created
  in-app or via an unrecognised CSV Module-ID) can be deleted for good.

## CSV round-trip

Export produces one semicolon-delimited CSV, UTF-8 with a BOM (opens
correctly in Excel with Danish/English text), structured as an **indented
outline** rather than one row per element. Each row is a node in a
hierarchy, named by its "Knude" (node) column and read by its Dansk/
Engelsk/Årstal-kilde/Beskrivelse/"Med i CV" columns depending on its role:

```
Titel                courses
-Tekst               These are the completed courses...
-Element             Project Management
--Aktivitet          Stakeholder interviews
-Element             LCA
--Aktivitet          Carbon emission calculations
--Aktivitet          Weighting and normalization of emissions
```

- **Titel** starts a new category. It's matched against existing
  categories *by title text* (in either language) — re-exporting and
  re-importing a category unchanged keeps its identity; changing its
  title in the file creates a new category instead of renaming in place.
- **Tekst**, directly under a Titel, is that category's intro blurb.
- **Element** is one library item — Dansk/Engelsk carry its heading, with
  year/source, an optional short Kommentar shown right under the heading,
  and a description as their own columns; "Med i CV" marks it as selected
  for the current CV.
- **Aktivitet**, under an Element, is one candidate bullet; "Med i CV"
  marks it as one of the picked bullets (absent activities default to
  all picked, matching in-app behavior).

An older export may still have a "Kategori" row grouping several Elements
under a shared subgroup label — that format has been replaced by the
per-element Kommentar columns, but importing such a file still works:
each Kategori row's text becomes the Kommentar of the Elements that used
to follow it.

Leading dashes are cosmetic (they just show nesting depth for readability
in a spreadsheet) — the importer identifies a row by its Knude keyword
and by what came before it, so an imperfectly indented hand-edit still
parses correctly. **Import replaces the whole library**, not a merge:
every category the file mentions is (re)created from the file; every
category it doesn't mention is removed (built-ins hidden and restorable,
custom ones deleted). A confirmation dialog shows the row/category counts
before committing. See `src/csv/` for the implementation.

## Design tokens

Two independent layers of visual choice, both in the Design tab (page-level)
and Tailor tab (per-category):

- **Page structure** (4, Design tab): single column, sidebar (a subset of
  categories move to a tinted side rail that bleeds to the page edges —
  see `SIDE_DEFAULT` in `src/data/designTokens.ts`), two columns (flowing),
  marked (an accent rail down the left of every section instead of a rule)
- **Per-category format** (Tailor tab, next to each category's on/off
  toggle): every category picks from the same six variants, independent
  of the page structure — standard (full name/year/description/bullets —
  the default), rows (year in its own column), line (title + year only,
  no description or bullets), two columns (within the section), chips
  (rounded pills, name only), or inline (one comma-separated line, name
  only). A category doesn't need to be pill-shaped to use chips, or vice
  versa — e.g. a sidebar layout with chips for competencies and the full
  standard format for tools.
- **Font pairings** (6): Industry (Barlow Condensed/Barlow), Technical (IBM
  Plex Sans), Aptos, Roboto, Lato, Public Sans — loaded from Google Fonts
  (Aptos falls back to Source Sans 3, since it's a Microsoft-only face)
- **Accent color schemes** (5): Steel, Graphite, Marine, Copper, Forest
- **Header size** (3) and **header alignment** (3): left / centered / a
  low inline line
- **Density** (2): standard, or compact (tighter spacing/type)
- **Footer** (optional, off by default): a page label + editable revision
  stamp (e.g. "REV 2026-09") along the bottom of every page, styled like
  a technical drawing's revision block

See `src/data/designTokens.ts` for the token values, `AppState.variant`
(`src/model/types.ts`) for how the per-category format is stored, and
`src/components/CvPreview.tsx` / the `.cv-*` rules in `src/App.css` for
how it's all applied.

## Print / PDF export

The "Print / Save as PDF" button opens the browser's print dialog. The CV
sheet is a fixed A4 box (`#cv-print-area`, see the `@media print` rules in
`src/App.css`) so what you see in the preview is what prints — one
`.cv-page` per sheet, editor chrome hidden, colors preserved.

Because the on-screen preview is that same fixed-size A4 box, it can tell
you when your content doesn't fit: `src/hooks/usePageOverflow.ts` measures
each page's content against the box and, if it overflows, draws a dashed
line at the actual page edge (so nothing is silently clipped) plus a
banner suggesting you move a section to the appendix or switch to the
"Compact" structure.

## Current state

- ✅ Category + library item data model, Zustand store, localStorage
  persistence
- ✅ CSV export/import with full-rebuild semantics, an indented outline
  format, dedup, new-category-from-unrecognised-title
- ✅ In-app editor (Indhold tab): category cards, element/activity editing,
  hide/delete, add category
- ✅ Tailor-to-the-job tab: category on/off, reorder, per-item CV
  checklist, applied title + ATS keywords
- ✅ CV preview styled as an actual sheet, with the design token system
  above
- ✅ Print/PDF export with a real print stylesheet, and overflow
  awareness (warns when content exceeds one page instead of clipping)
- ✅ Per-category display variants (standard/rows/line/two columns/chips/
  inline), independent of the page-level structure and available to
  every category alike
- ✅ Automatic pagination: whatever doesn't fit on the first page flows
  onto as many further "Bilag" pages as needed — no manual placement
- ✅ Optional per-item comment, shown right below the heading

To bring in real content from the original prototype, open
`design_handoff_cv_csv_editor/CV Skabelon.dc.html` in a browser, use its
own CSV export, and import that file into this app.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run lint     # oxlint
```
