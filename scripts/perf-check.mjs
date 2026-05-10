/**
 * Quick perf check via Playwright. Not a Lighthouse replacement — gives
 * us the headline numbers (transfer size, request count, load timing,
 * largest contentful paint proxy) for spot-checking. For the full
 * Core Web Vitals breakdown, paste the URL into pagespeed.web.dev.
 */
import { chromium } from "playwright";

const URLS = [
  "https://twineconvert.com",
  "https://twineconvert.com/heic-to-jpg",
  "https://twineconvert.com/compress-pdf",
  "https://twineconvert.com/mp4-to-mp3",
];

const browser = await chromium.launch();

for (const url of URLS) {
  // Throttled mobile-ish profile (slow 4G + 4x CPU slowdown)
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  const page = await ctx.newPage();

  const client = await page.context().newCDPSession(page);
  // Approximate Slow 4G + 4x CPU throttling, similar to PSI mobile defaults
  await client.send("Network.emable" in client ? "Network.enable" : "Network.enable").catch(() => {});
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  let totalBytes = 0;
  let requestCount = 0;
  page.on("response", async (res) => {
    requestCount++;
    try {
      const len = (await res.body()).length;
      totalBytes += len;
    } catch {
      // some responses (e.g. preflights) don't have a readable body
    }
  });

  const start = Date.now();
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  const loadMs = Date.now() - start;

  // Web Vitals via the navigation API
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
    const lcp = (() => {
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
      return lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : null;
    })();
    return {
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
      firstContentfulPaintMs: fcp ? Math.round(fcp) : null,
      largestContentfulPaintMs: lcp ? Math.round(lcp) : null,
    };
  });

  console.log(`\n=== ${url} ===`);
  console.log(`  total wall-clock: ${loadMs}ms (throttled mobile profile)`);
  console.log(`  DOMContentLoaded: ${metrics.domContentLoadedMs}ms`);
  console.log(`  load event:       ${metrics.loadEventMs}ms`);
  console.log(`  FCP:              ${metrics.firstContentfulPaintMs ?? "n/a"}ms`);
  console.log(`  LCP:              ${metrics.largestContentfulPaintMs ?? "n/a"}ms`);
  console.log(`  requests:         ${requestCount}`);
  console.log(`  transferred:      ${(totalBytes / 1024).toFixed(1)} KB`);
  await ctx.close();
}

await browser.close();
console.log("\ndone — for the official Lighthouse breakdown, paste each URL into https://pagespeed.web.dev/");
