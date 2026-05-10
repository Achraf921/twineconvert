import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/hero-1440.png", fullPage: false });

await page.click('button[aria-label="Change input format"]');
await page.waitForTimeout(250);
await page.screenshot({ path: "/tmp/dropdown-input.png", fullPage: false });

await page.keyboard.press("Escape");
await page.waitForTimeout(150);
await page.click('button[aria-label="Change output format"]');
await page.waitForTimeout(250);
await page.screenshot({ path: "/tmp/dropdown-output.png", fullPage: false });

await page.keyboard.press("Escape");
await page.setViewportSize({ width: 1024, height: 800 });
await page.screenshot({ path: "/tmp/hero-1024.png", fullPage: false });
await page.setViewportSize({ width: 768, height: 800 });
await page.screenshot({ path: "/tmp/hero-768.png", fullPage: false });
await browser.close();
console.log("done");
