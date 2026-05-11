/**
 * Semi-automated forum reply helper. Opens each forum thread in a
 * persistent Playwright browser session (cookies persist across runs),
 * pre-fills the reply textarea with the drafted text from the
 * backlinks playbook, then pauses so YOU click Submit yourself.
 *
 * Why semi-automated and not full auto-submit:
 *   Forum anti-spam systems flag rapid scripted posting from
 *   authenticated sessions, especially from new accounts. Posts get
 *   silently quarantined to a mod queue or shadowbanned. Manual click
 *   on Submit avoids tripping that.
 *
 * What this DOES automate:
 *   - Opening the right URL
 *   - Finding the reply textarea (forum-specific selectors)
 *   - Pasting the drafted reply
 *   - Pausing for your review
 *
 * What you do:
 *   - First run: log in to each forum manually in the opened browser
 *     (cookies persist in tutorials/.forum-session/ for future runs,
 *     gitignored)
 *   - Each thread: review the prefilled draft, edit if you want, click
 *     Reply / Submit
 *   - Hit Enter in the terminal to move to the next thread
 *
 * Usage:
 *   node scripts/forum-helper.mjs
 */

import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { createInterface } from "node:readline";

const SESSION_DIR = resolve("tutorials/.forum-session");
mkdirSync(SESSION_DIR, { recursive: true });

const THREADS = [
  {
    label: "Obsidian Forum: Kindle highlights to markdown",
    url: "https://forum.obsidian.md/t/kindle-highlights-to-markdown/3842",
    platform: "discourse",
    reply: `Slightly different angle: I built a browser-based converter that takes the raw \`My Clippings.txt\` straight off the Kindle and outputs one \`.md\` file per book with frontmatter (\`title\`, \`author\`, \`date_finished\`). Drops cleanly into a vault Sources/ folder. No install, no upload, runs in the tab via WebAssembly: https://twineconvert.com/kindle-clippings-to-obsidian-md

For folks who prefer Amazon-account sync, the official Obsidian Kindle Plugin is still the easiest. The converter is for people who don't want to log in to Amazon to get their own data back.`,
  },
  {
    label: "Obsidian Forum: Fyodor for extracting Kindle clippings",
    url: "https://forum.obsidian.md/t/fyodor-for-extracting-kindle-clippings/12567",
    platform: "discourse",
    reply: `For anyone reading this who doesn't want to install a plugin or run a script, there's a no-install browser version: https://twineconvert.com/kindle-clippings-to-obsidian-md drop My Clippings.txt, get a zip of one .md per book. Same end result, no setup. Built it because every existing tool I tried needed Python or an Amazon login.`,
  },
  {
    label: "Quantified Self Forum: Converting iOS Health data export to CSV",
    url: "https://forum.quantifiedself.com/t/converting-ios-health-data-export-to-csv/10749",
    platform: "discourse",
    reply: `Adding a 2026 option for anyone landing here from search: there's now a browser-only converter that drops the entire export.zip in, splits into one CSV per metric (heart rate, steps, sleep, workouts, mindful minutes, etc.). Runs locally in the tab via WASM, your health data never leaves the device. https://twineconvert.com/apple-health-to-csv

Heads-up: large multi-year exports (300MB+) take 30-90 seconds to process. Single-threaded, no GPU.`,
  },
  {
    label: "Apple Community: How can I download or extract data from Health",
    url: "https://discussions.apple.com/thread/255037259",
    platform: "apple",
    reply: `The native export gives you a 100MB+ XML file that no normal spreadsheet tool can open. There's a browser converter that splits it per metric (heart rate, steps, sleep, workouts) into clean CSVs you can open in Numbers or Excel: https://twineconvert.com/apple-health-to-csv. Files stay on your device, it runs locally in the tab.

For just one specific metric, there are sub-tools that skip the full XML parse: e.g. https://twineconvert.com/apple-health-heart-rate-to-csv`,
  },
  {
    label: "Apple Community: How to export Apple Health Data to Excel",
    url: "https://discussions.apple.com/thread/255564716",
    platform: "apple",
    reply: `The Apple export gives you export.xml inside a zip, and Excel can't open it directly. Easiest path I've found is converting to CSV first: https://twineconvert.com/apple-health-to-csv (browser-based, doesn't upload your health data). Each metric becomes its own CSV, opens in Excel, Numbers, or Sheets directly.`,
  },
];

// Selectors per platform. Discourse is the same across Obsidian + QS;
// Apple Community uses a different richtext editor.
const SELECTORS = {
  discourse: {
    // The "Reply" button on the thread that opens the editor
    openReply: "#topic-footer-buttons button.create",
    // The contenteditable composer textarea (markdown source view)
    composer: ".d-editor-input",
  },
  apple: {
    // Apple's reply box is inline at the bottom of the thread
    composer: 'textarea, [contenteditable="true"][role="textbox"]',
  },
};

function ask(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

console.log(`Forum reply helper`);
console.log(`Session dir: ${SESSION_DIR}`);
console.log(`Threads queued: ${THREADS.length}`);
console.log(`\nFirst-time setup: when each thread opens, log in to that forum if`);
console.log(`prompted. Cookies persist across runs.\n`);

const browser = await chromium.launchPersistentContext(SESSION_DIR, {
  headless: false,
  viewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();

for (let i = 0; i < THREADS.length; i++) {
  const t = THREADS[i];
  console.log(`\n[${i + 1}/${THREADS.length}] ${t.label}`);
  console.log(`  URL: ${t.url}`);
  await page.goto(t.url, { waitUntil: "domcontentloaded" });

  if (t.platform === "discourse") {
    // Discourse: click Reply button to open composer, then fill
    try {
      await page.waitForSelector(SELECTORS.discourse.openReply, { timeout: 8000 });
      await page.click(SELECTORS.discourse.openReply);
      await page.waitForSelector(SELECTORS.discourse.composer, { timeout: 6000 });
      await page.fill(SELECTORS.discourse.composer, t.reply);
      console.log(`  ✓ reply pre-filled in composer`);
    } catch (e) {
      console.log(`  ! couldn't auto-fill (you might not be logged in yet)`);
      console.log(`    ${e.message.split("\n")[0]}`);
    }
  } else if (t.platform === "apple") {
    // Apple Community: highlight URL in clipboard so user can paste
    // (their composer is harder to auto-fill reliably)
    await page.evaluate((text) => navigator.clipboard.writeText(text).catch(() => {}), t.reply);
    console.log(`  ✓ reply copied to clipboard (Cmd+V into the reply box)`);
  }

  console.log(`  Review, click Reply / Submit, then press Enter here for next.`);
  await ask("  > ");
}

console.log(`\nAll threads processed. Closing browser.`);
await browser.close();
