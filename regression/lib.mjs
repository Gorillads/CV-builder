/** Shared Playwright helpers for the regression suite (see README.md in
 *  this folder). Kept as plain functions over the real UI, no page object
 *  classes, since the scenario list in scenarios.mjs is the only caller. */

export async function preparePage(page, baseUrl) {
  await page.goto(baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(400);
}

export async function openContentTab(page) {
  await page.getByRole("button", { name: "Indhold", exact: true }).click();
  await page.waitForTimeout(200);
}

export async function openDesignTab(page) {
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.waitForTimeout(200);
}

/** Loads one of the three built-in content presets (Klassisk/Moderne/
 *  Kunstnerisk) — every scenario starts from one so the suite exercises
 *  real, representative content instead of an empty document. */
export async function applyPreset(page, name) {
  await openContentTab(page);
  await page.getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(400);
}

/** label is the exact pill text, e.g. "Sidebar", "To spalter",
 *  "Markeret (accentkant)", "Bånd (farvet headerfelt)",
 *  "Én spalte (standard)" — see STRUCTS in src/data/designTokens.ts. */
export async function selectStruct(page, label) {
  await openDesignTab(page);
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(300);
}

/** label is the exact pill text, e.g. "20%", "33%", "40%" — see
 *  SIDEBAR_WIDTHS in src/data/designTokens.ts. Struct must already be
 *  "Sidebar" (selectStruct) or this control isn't on screen. */
export async function selectSidebarWidth(page, label) {
  await openDesignTab(page);
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(300);
}

export async function toggleFooter(page) {
  await openDesignTab(page);
  await page.getByText("Vis sidefod", { exact: false }).click();
  await page.waitForTimeout(300);
}

/** Duplicates the first category whose title field matches exactly
 *  (case-sensitive), `times` times in a row — used to push a document
 *  toward a page-1/appendix boundary on purpose. */
export async function duplicateCategory(page, title, times = 1) {
  await openContentTab(page);
  const card = page.locator(".category-card").filter({ has: page.locator(`input.category-title[value="${title}"]`) });
  for (let i = 0; i < times; i++) {
    await card.first().scrollIntoViewIfNeeded();
    await card.first().getByText("Dupliker kategori", { exact: false }).click();
    await page.waitForTimeout(250);
  }
}

/** Reads what actually ended up where: the ordered list of section
 *  headings on page 1, plus one ordered list per Bilag (appendix) page.
 *  This is the real regression signal — a category silently moving pages,
 *  disappearing, or reordering is a much more reliable "something broke"
 *  indicator than a pixel diff, which trips on font antialiasing noise. */
export async function readComposition(page) {
  return page.evaluate(() => {
    const frame = document.querySelector(".cv-zoom-frame");
    const pages = Array.from(frame.querySelectorAll(".cv-page:not(.cv-measure-hidden)"));
    const page1 = pages.find((p) => !p.classList.contains("cv-appendix"));
    const appendixPages = pages.filter((p) => p.classList.contains("cv-appendix"));
    const titlesOf = (el) => Array.from(el.querySelectorAll(".cv-section h3")).map((h) => h.textContent.trim());
    return {
      page1: page1 ? titlesOf(page1) : [],
      appendix: appendixPages.map(titlesOf),
      pageCount: pages.length,
    };
  });
}

/** Screenshot of every rendered page stacked (the whole .cv-zoom-frame),
 *  for a human to eyeball when the composition check above flags a diff,
 *  or to catch visual-only breakage (overlap, clipping) that a list of
 *  section titles can't. Hides .preview-toolbar first — it's
 *  `position: sticky; top: 0`, so it visually overlaps the top of the
 *  frame and would otherwise bleed into the crop (and its own live state,
 *  like the zoom percentage, has nothing to do with the CV and would just
 *  add noise to future comparisons). */
export async function screenshot(page, filePath) {
  await page.addStyleTag({ content: ".preview-toolbar { visibility: hidden; }" });
  const frame = page.locator(".cv-zoom-frame");
  await frame.screenshot({ path: filePath });
}
