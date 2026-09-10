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

- **Categories** ("modules") — Profil, Erfaring, Kompetencer, etc. Each has
  a stable id, a title and blurb per language, and a `kind`: `entry` (dated
  items with a description and a pool of bullet activities), `tags` (a
  flat pill list), or `null` (pure prose — just a title + blurb).
- **Library items** — the content within a category. Whether an item is
  *in the library* (exists) and whether it's *selected for the current CV*
  are independent, so you can keep a large pool of bullets and pick a
  relevant subset per job application.
- **Built-in vs. custom categories** — 16 built-ins ship with placeholder
  content. Built-ins can be hidden (restorable); custom ones (created
  in-app or via an unrecognised CSV Module-ID) can be deleted for good.

## CSV round-trip

Export produces one semicolon-delimited CSV, UTF-8 with a BOM (opens
correctly in Excel with Danish/English text). **Import replaces the whole
library**, not a merge: every category the file mentions is (re)created
from the file; every category it doesn't mention is removed (built-ins
hidden and restorable, custom ones deleted). A confirmation dialog shows
the row/section counts before committing. See `src/csv/` for the ported
logic.

## Design tokens

A Design tab lets you pick the CV sheet's typography and layout,
independent of content — the same set the prototype offered:

- **Font pairings** (6): Industry (Barlow Condensed/Barlow), Technical (IBM
  Plex Sans), Aptos, Roboto, Lato, Public Sans — loaded from Google Fonts
  (Aptos falls back to Source Sans 3, since it's a Microsoft-only face)
- **Accent color schemes** (5): Steel, Graphite, Marine, Copper, Forest
- **Header size** (3): small/standard/large
- **Layout structure** (6): single column, two columns, sidebar (core
  competencies/languages/courses/certifications/interests move to a side
  rail), marked list (accent rail per section), rows (year in its own
  column), compact (tighter spacing)
- **Header alignment** (3): left, centered, low inline line

See `src/data/designTokens.ts` for the token values and
`src/components/CvPreview.tsx` / the `.cv-*` rules in `src/App.css` for
how they're applied.

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
- ✅ CSV export/import with full-rebuild semantics, category rename via
  Section Name columns, dedup, new-category-from-unknown-Module-ID
- ✅ In-app editor (Indhold tab): category cards, element/activity editing,
  hide/delete, add category
- ✅ Tailor-to-the-job tab: category on/off, reorder, CV vs. appendix
  placement, applied title + ATS keywords
- ✅ CV preview styled as an actual sheet, with the design token system
  above
- ✅ Print/PDF export with a real print stylesheet, and overflow
  awareness (warns when content exceeds one page instead of clipping)
- ⬜ Per-category display variants (standard/two-col/row/line cycling per
  section, independent of the page-level structure) — not yet ported
- ⬜ Multi-page appendix (content that overflows the appendix page doesn't
  yet flow onto a second appendix sheet the way the prototype's algorithmic
  chunking did — it just warns)

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
