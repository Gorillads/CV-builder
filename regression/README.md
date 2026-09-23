# Regression suite

A small set of layout snapshot checks, meant to be run before shipping any
change that touches pagination, layout structs, the footer, or the sidebar
width — the areas that have caused the trickiest bugs in this project.

It is not a normal test framework. It drives the real app in a real
browser (Playwright + Chromium), sets up a specific scenario (preset +
struct + toggles), and records two things per scenario:

1. **Composition** — the ordered list of section headings that ended up on
   page 1 and on each Bilag (appendix) page. This is the real signal: a
   category silently moving pages, disappearing, or reordering is exactly
   the shape every pagination bug so far has taken.
2. **A screenshot** of the whole rendered document, for a human (or Claude)
   to look at when the composition check flags something, or to catch
   purely visual breakage (overlap, clipping) that a list of titles can't.

## Running it

Needs the dev server running first (`npm run dev`, default port 5188 — set
`CV_BUILDER_URL` if it's running somewhere else).

```
node regression/run.mjs            # check mode — compares against saved baselines
node regression/run.mjs --record   # record mode — overwrites the baselines
```

There's no npm dependency to install: this environment has Playwright and
Chromium pre-installed globally (see `/opt/node22` and `/opt/pw-browsers`
in `regression/run.mjs`), which is what every other verification script in
this project's history has relied on too.

## Baselines

`regression/baselines/` holds the last known-good composition (JSON) and
screenshot (PNG) per scenario, committed to the repo. `regression/current/`
holds the latest run's output and is not committed (see .gitignore) — it's
only there for comparing against the baseline when something fails.

## Adding a scenario

Add an entry to `regression/scenarios.mjs`. Do this whenever a bug turns
out to depend on a specific combination of settings — the value of this
suite is that it accumulates every combination that has bitten us once, so
it can never bite us silently again. Then run with `--record` once you've
confirmed the new scenario's output is actually correct (check the
screenshot), and commit the new baseline files.
