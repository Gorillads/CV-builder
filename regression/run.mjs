/** Regression suite runner. See README.md in this folder for what this is
 *  and how to use it. Two modes:
 *
 *    node regression/run.mjs            — check mode: run every scenario,
 *      compare its section-title composition against the saved baseline,
 *      report PASS/FAIL, exit non-zero if anything differs.
 *
 *    node regression/run.mjs --record   — record mode: run every scenario
 *      and overwrite the baseline with whatever comes out. Only do this
 *      after confirming by eye (via the screenshots) that the new output
 *      is correct, not just different.
 *
 *  Requires the dev server running at CV_BUILDER_URL (default
 *  http://localhost:5188/CV-builder/). */

import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios.mjs";
import * as lib from "./lib.mjs";

const RECORD = process.argv.includes("--record");
const BASE_URL = process.env.CV_BUILDER_URL || "http://localhost:5188/CV-builder/";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = path.join(DIR, "baselines");
const CURRENT_DIR = path.join(DIR, "current");
fs.mkdirSync(BASELINE_DIR, { recursive: true });
fs.mkdirSync(CURRENT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let failures = 0;

for (const scenario of scenarios) {
  // Tall enough to hold several stacked A4 pages (1123px each) without
  // Playwright having to scroll-and-stitch the element screenshot, which
  // has been observed to silently paint later pages blank when the frame
  // is much taller than the viewport.
  const page = await browser.newPage({ viewport: { width: 1600, height: 4200 } });
  page.setDefaultTimeout(10000);
  page.on("dialog", (d) => d.accept());

  await lib.preparePage(page, BASE_URL);
  await scenario.setup(page);
  await page.waitForTimeout(300);

  const composition = await lib.readComposition(page);
  const currentPngPath = path.join(CURRENT_DIR, `${scenario.name}.png`);
  await lib.screenshot(page, currentPngPath);
  await page.close();

  const baselineJsonPath = path.join(BASELINE_DIR, `${scenario.name}.json`);
  const baselinePngPath = path.join(BASELINE_DIR, `${scenario.name}.png`);

  if (RECORD) {
    fs.writeFileSync(baselineJsonPath, JSON.stringify(composition, null, 2) + "\n");
    fs.copyFileSync(currentPngPath, baselinePngPath);
    console.log(`RECORDED   ${scenario.name}`);
    continue;
  }

  if (!fs.existsSync(baselineJsonPath)) {
    console.log(`NO BASELINE  ${scenario.name}  (run with --record first)`);
    failures++;
    continue;
  }

  const baseline = JSON.parse(fs.readFileSync(baselineJsonPath, "utf8"));
  const same = JSON.stringify(baseline) === JSON.stringify(composition);
  if (same) {
    console.log(`PASS       ${scenario.name}`);
  } else {
    failures++;
    console.log(`FAIL       ${scenario.name}`);
    console.log(`  expected: ${JSON.stringify(baseline)}`);
    console.log(`  actual:   ${JSON.stringify(composition)}`);
    console.log(`  screenshots: ${baselinePngPath}  vs  ${currentPngPath}`);
  }
}

await browser.close();

if (!RECORD) {
  console.log(`\n${scenarios.length - failures}/${scenarios.length} passed.`);
  if (failures > 0) process.exitCode = 1;
}
