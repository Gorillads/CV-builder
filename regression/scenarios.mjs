/** Each scenario starts from a fresh document (see run.mjs), applies the
 *  "Moderne" preset for real, representative content, then sets up one
 *  specific layout that has historically been fragile. Add a new scenario
 *  whenever a bug turns out to depend on a particular combination of
 *  settings — that's the whole point of this suite: it should grow to
 *  cover every combination that has ever bitten us once. */

import * as lib from "./lib.mjs";

export const scenarios = [
  {
    name: "single-baseline",
    description: "Single-column struct, default settings — sanity baseline.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
    },
  },
  {
    name: "sidebar-default",
    description: "Sidebar struct at its default 33% width.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.selectStruct(page, "Sidebar");
    },
  },
  {
    name: "sidebar-narrow",
    description: "Sidebar struct at the narrowest 20% width — sidebar content overflow risk.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.selectStruct(page, "Sidebar");
      await lib.selectSidebarWidth(page, "20%");
    },
  },
  {
    name: "sidebar-wide",
    description: "Sidebar struct at the widest 40% width — main column overflow risk.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.selectStruct(page, "Sidebar");
      await lib.selectSidebarWidth(page, "40%");
    },
  },
  {
    name: "two-column",
    description: "Two-column struct.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.selectStruct(page, "To spalter");
    },
  },
  {
    name: "marked",
    description: "Marked (accent rail) struct.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.selectStruct(page, "Markeret (accentkant)");
    },
  },
  {
    name: "banded",
    description: "Banded (colored header field) struct.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.selectStruct(page, "Bånd (farvet headerfelt)");
    },
  },
  {
    name: "footer-toggle-near-boundary",
    description:
      "Erfaring duplicated twice (pushes content near the page-1/Bilag boundary), footer switched on. Coarse guard for the #80/#81 class of bug (the footer reserving far more budget than it needs and pushing categories to the appendix) — catches a large regression (tested: reserving 200px instead of ~16px does trip this), but the real historical bug's ~30px margin was too small to reliably land on this exact composition boundary by luck. If this keeps needing tuning, that's a sign the budget math deserves a real unit test on the pagination functions directly, not another scenario here.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.duplicateCategory(page, "Erfaring", 2);
      await lib.toggleFooter(page);
    },
  },
  {
    name: "multi-page-overflow",
    description:
      "Erfaring duplicated five times — forces real multi-page Bilag overflow, checked for stable ordering and no split categories.",
    setup: async (page) => {
      await lib.applyPreset(page, "Moderne");
      await lib.duplicateCategory(page, "Erfaring", 5);
    },
  },
];
