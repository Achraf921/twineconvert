/**
 * Generate Product Hunt gallery screenshots via Playwright.
 *
 * Captures 4 images at PH's required 1270x760 dimensions:
 *   1. hero.png         — homepage hero with chip widget + dropzone
 *   2. all-tools.png    — /all-tools grid showing the breadth
 *   3. success.png      — /heic-to-jpg in the post-conversion "Download" state
 *   4. blog.png         — /blog index showing real content depth
 *
 * Output goes to tutorials/output/ph-gallery/.
 *
 * Run:
 *   node scripts/ph-screenshots.mjs
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve("tutorials/output/ph-gallery");
mkdirSync(OUT_DIR, { recursive: true });

const BASE = "https://twineconvert.com";

// PH gallery dimensions
const VIEWPORT = { width: 1270, height: 760 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await ctx.newPage();

console.log("[1/4] Homepage hero...");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: resolve(OUT_DIR, "1-hero.png"), fullPage: false });

console.log("[2/4] /all-tools grid...");
await page.goto(`${BASE}/all-tools`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: resolve(OUT_DIR, "2-all-tools.png"), fullPage: false });

console.log("[3/4] Tool page (heic-to-jpg) hero...");
await page.goto(`${BASE}/heic-to-jpg`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: resolve(OUT_DIR, "3-tool-page.png"), fullPage: false });

console.log("[4/4] /blog index...");
await page.goto(`${BASE}/blog`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: resolve(OUT_DIR, "4-blog.png"), fullPage: false });

await page.close();
await ctx.close();
await browser.close();

console.log("\nDone. Screenshots in:");
console.log("  " + OUT_DIR);
console.log("\nFiles:");
console.log("  1-hero.png         — homepage hero (use as PH gallery image 1)");
console.log("  2-all-tools.png    — tool variety (image 2)");
console.log("  3-tool-page.png    — tool page in idle state (image 3)");
console.log("  4-blog.png         — blog content depth (image 4)");
console.log("");
console.log("PH accepts 1270x760 PNG. At deviceScaleFactor 2 these come out");
console.log("at 2540x1520; PH will downscale, but the retina source means");
console.log("the displayed image stays sharp.");
