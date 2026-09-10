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

## Current state

This first pass focused on getting the data model and CSV round-trip
solid, with a functional (not yet visually polished) editor UI:

- ✅ Category + library item data model, Zustand store, localStorage
  persistence
- ✅ CSV export/import with full-rebuild semantics, category rename via
  Section Name columns, dedup, new-category-from-unknown-Module-ID
- ✅ In-app editor (Indhold tab): category cards, element/activity editing,
  hide/delete, add category
- ✅ Tailor-to-the-job tab: category on/off, reorder, CV vs. appendix
  placement, applied title + ATS keywords
- ✅ Plain live CV preview
- ⬜ Visual design fidelity (fonts, accent color schemes, layout variants,
  pagination/fit) from the prototype — not yet ported

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
