import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Homepage
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/hero-1440.png", fullPage: false });

// Tool page with chip pair (DOCX → PDF)
await page.goto("http://localhost:3000/docx-to-pdf", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/tool-pair-1440.png", fullPage: false });

// Tool page without chip pair (single-action: Compress PDF)
await page.goto("http://localhost:3000/compress-pdf", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/tool-single-1440.png", fullPage: false });

// 768 view of tool page with pair
await page.setViewportSize({ width: 768, height: 800 });
await page.goto("http://localhost:3000/docx-to-pdf", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/tool-pair-768.png", fullPage: false });

await browser.close();
console.log("done");
