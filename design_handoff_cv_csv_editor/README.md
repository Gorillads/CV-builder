# Handoff: CV Template Editor with CSV-Driven Content

## Overview
A CV/resume builder where the entire content library (every section, every
bullet, every piece of copy) is edited two equivalent ways: **in-app**
(a card-based editor with a live preview) and **via CSV** (export the
library as a spreadsheet, edit it in Excel, re-import it). Both paths write
to the same underlying model, so a change made one way shows up the other
way immediately.

**The point of this project is not the visual CV design** — it's the
editing model: a non-technical user should be able to restructure their
whole CV (add a section, rename one, reorder bullets, retire a section)
by editing rows in a spreadsheet, with zero risk of the app and the
spreadsheet drifting out of sync. Recreate that editing model faithfully;
the specific fonts/colors/layout of the CV sheet itself are secondary and
replaceable.

## About the Design Files
The bundled `CV Skabelon.dc.html` is a **working HTML prototype**, not
production code to lift as-is. It runs today (open it in a browser) and
its JavaScript is the real specification of every behavior described
below — when this README and the code disagree, trust the code, and when
in doubt, read the function referenced. The task is to **recreate this
system in the target codebase's actual environment** (whatever frontend
stack/backend/database it already uses), following its existing patterns,
not to embed this HTML file wholesale.

## Fidelity
This is a **functional/behavioral spec**, not a hifi visual one. The
in-app editor's visual design (cards, split view) is a reasonable
starting point but not sacred. The CV *output* sheet has real design
intent (typography pairing, accent color schemes, layout variants) that
should be preserved reasonably closely, but is still secondary to
getting the CSV round-trip and category model right.

## The Core Model

### A category ("module")
Every section of the CV — Profil, Erfaring, Kompetencer, Kurser, etc. — is
a **category**, all sharing one shape:
- `key`: a stable machine id (e.g. `erfaring`, `b_vaerktoejer` for
  appendix-only ones — the `b_` prefix just marks "lives in the
  appendix"). Never changes once created; it's the join key between the
  app, localStorage and the CSV.
- `title`: display name, per language (Danish/English). Editable in-app
  or via a CSV column — this is what the user actually renames.
  and the CSV's "Section Name" column, so the two never disagree.
- `blurb`: optional intro paragraph shown under the section title.
- `kind`: `"entry"` (a list of dated/sourced items with descriptions and
  bullet activities — Erfaring, Uddannelse) or `"tags"` (a flat pill list
  — Kompetencer) or `null` (pure prose, e.g. Profil — a title + blurb and
  nothing else).
- `elements`: for `"entry"` categories, each element has: heading text,
  year/source line, a longer description, and a list of "activities"
  (bullet points) — each activity itself is a candidate the user
  picks in or out per CV (this is the "tailor to the job" mechanism:
  build a big superset of bullets once, then pick a relevant subset per
  application).
- **Built-in vs. custom**: the app ships ~16 built-in categories with
  starter content. Users can also create brand-new categories in-app or
  via CSV (any Module-ID the app doesn't recognize becomes a new
  category on the spot). Built-ins can be **hidden** (removed from the
  CV, restorable later) but never disappear from the underlying registry;
  user-created ones can be **deleted permanently**.

### Selection vs. content
Two independent things per element: is it *in the library* (exists as a
candidate) and is it *selected for this CV* ("Med i CV" checkbox / the
CSV's "In CV" column). This split is what lets someone keep a big
personal library of bullets and pick a relevant few per job application.

### Where things live today (prototype only — replace with real storage)
The prototype keeps everything in `localStorage` as several JSON blobs
(library items, per-category selection/order, hidden-state, custom
category definitions, text overrides, applied job title + ATS keywords).
In a real product this is a database, not localStorage — but the *shape*
of that state (see "State Management" below) should carry over.

## CSV Round-Trip — the feature that matters most

### Export (`_exportCsv` in the prototype)
One CSV, semicolon-delimited, UTF-8 with BOM (opens correctly in Excel
with Danish/English text and accented characters). Columns:

| Column | Meaning |
|---|---|
| Module-ID | The category's stable key. Never rename by hand unless intentionally renaming a category (see below). |
| Section Name (DA) / (EN) | The category's display title in each language — editing this **renames the section** on import. |
| Title (DA) / (EN) | One element's heading, in each language. Blank on a category's own "section blurb" row. |
| Year/Source | The element's year/source line. |
| Description (DA) / (EN) | The element's long-form description. |
| Activities (DA) / (EN) | `·`-separated list of bullet candidates for that element. |
| Selected Activities | Which of those bullets are picked for the current CV. |
| In CV | Whether this element itself is selected for the current CV ("ja"/blank). |

One row per element; a category with a blurb but otherwise no elements
gets one row carrying just the blurb columns. Two special rows,
`_meta_title` and `_meta_keywords`, carry the "Tailor to the job" panel's
own two fields (the position title being applied for, and the ATS
keyword list) through the Title (DA)/(EN) columns — they are not
categories and must not be turned into sections on import.

### Import (`_importCsv`) — **full rebuild semantics, not a merge**
This is the most important design decision and the one most likely to be
gotten wrong in a straight reimplementation:

> **Importing a CSV replaces the entire library.** It is not a diff or a
> merge against what's already there. Every category the file mentions
> is (re)created exactly as described; every category the file does
> *not* mention is removed (built-ins are hidden/restorable, user-made
> ones are deleted for good). An empty file (header row only, or truly
> empty) is a valid instruction meaning "delete everything."

Behavior to preserve:
1. **New Module-ID → new category.** If a row's Module-ID isn't a
   category the app already knows, one is created on the spot, named
   from the Section Name column (or the raw Module-ID text if no
   Section Name given).
2. **Confirm before destroying.** Because this is irreversible for
   custom categories, the user must see a confirmation naming the row
   count and section count before the import commits.
3. **Renames flow from the Section Name columns**, not from changing the
   Module-ID (changing the Module-ID looks like deleting the old section
   and creating a new one — that's a real distinction to preserve:
   Module-ID is identity, Section Name is display text).
4. **Dedup**: identical (heading, year/source) pairs within one category
   collapse to one element, so accidental copy-pasted rows in Excel
   don't create duplicates.
5. **A category that ends up with zero elements after import must
   actually be empty** — not silently fall back to old default content.
   (This was a real bug in the prototype: a "replaced" flag has to be
   recorded and persisted per category the *moment* it's touched by an
   import, independent of whether it ended up with any items, or the
   old built-in catalogue leaks back in on the next export. See
   `_replacedSections()`/`_nukeCategoryDefs()` in the code for the fix.)
6. **Everything the in-app editor can do, the CSV can do too, and vice
   versa** — this is the whole point. Concretely: renaming a category,
   adding/removing an element, reordering elements, hiding/deleting a
   whole category, editing a blurb, and setting the applied job
   title/ATS keywords must all be expressible as CSV edits, and all
   must be reachable from the in-app card editor too.

## In-App Editor ("Indhold" tab)
Split view: left column is a scrollable list of category cards (one per
category, collapsible, showing element count and CV-page vs.
appendix placement), right column is the live CV preview. Per category
card: rename/blurb field, add/reorder/remove elements, per-element
description + activity picklists, and a delete button (hide for
built-ins with a restore path, permanent delete for custom categories —
same confirmation copy as the CSV-triggered deletion, since it's the same
underlying operation).

A second tab ("Sammensæt CV'et" / "Tailor to the job") is the
per-application workflow: toggle categories on/off, reorder them,
pick a page vs. appendix placement, cycle per-category layout
variants, and set the free-text applied job title + ATS keyword blurb
that gets tucked into the CV.

## State Management
Minimum state a real implementation needs, mirroring the prototype's
localStorage keys:
- Category registry: key → {title (per lang), blurb (per lang), kind,
  isCustom, isHidden}, plus an explicit order array.
- Per category: ordered list of element ids currently selected for the
  CV, and the full pool of that category's elements.
- Per element: heading/year-source/description (per lang), ordered list
  of activity strings (per lang) with which ones are currently selected.
- Text overrides: any inline edit made directly on the CV preview
  (title, blurb, per-element fields) needs to survive independently of
  which "variant" of a section is showing.
- "Replaced by import" flag per category — persists across reloads so a
  category emptied by CSV import doesn't fall back to default content.
- Global: applied job title + ATS keywords (per language), selected
  font pairing, accent color scheme, layout structure, header block
  (name/phone/email/photo).

## Design Tokens (prototype's CV sheet — for reference, not sacred)
- Type pairings: Barlow Condensed/Barlow (default), IBM Plex Sans, Aptos,
  Roboto, Lato, Public Sans.
- Accent color schemes (5 total), e.g. default "Stål": accent `#416180`,
  soft `#597ea3`, line `#9db3c7`, chip border `#b5d9fd`, chip bg
  `#eef6ff`, chip fg `#2c455d`.
- Layout structures: single column, two columns, sidebar, marked list,
  rows (title+year), compact.
- Header sizes: 12 / 14 / 16.5px.

## Files
- `CV Skabelon.dc.html` — the full working prototype. Read top-to-bottom:
  category registry & defaults (`MODS`, `LIB`, `CUSTOM_MODS`), state
  shape (`Component` class `state`), CSV export/import
  (`_exportCsv`/`_importCsv`/`_parseCsv`), category CRUD (`_removeCategory`,
  `_deleteCategory`, `_nukeCategoryDefs`), and the render template at the
  top of the file for the two-tab UI structure.
