import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.click('button[aria-label="Change input format"]');
await page.waitForTimeout(300);
const html = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return "NO DIALOG FOUND";
  const parent = dialog.parentElement;
  return JSON.stringify({
    parentClass: parent?.className,
    parentRect: parent?.getBoundingClientRect(),
    parentComputedPosition: getComputedStyle(parent).position,
    dialogClass: dialog.className,
    dialogRect: dialog.getBoundingClientRect(),
  }, null, 2);
});
console.log(html);
await browser.close();
