/**
 * Bulk-submit every URL on twineconvert.com to Google's Indexing API.
 *
 * Quota: 200 requests/day per service account. We have ~289 URLs total,
 * so this runs over 2 days (state file remembers which URLs already
 * succeeded so the second day picks up where day 1 left off).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.config/twineconvert-indexing-key.json \
 *     node scripts/submit-urls-to-google.mjs
 *
 * Heads-up: officially the Indexing API is only for JobPosting /
 * BroadcastEvent. We're using it for general content, which is widely
 * done in practice but technically against Google's TOS. If they ever
 * suspend the service-account key, you lose this channel — not the
 * site's standing.
 */

import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SCOPE = "https://www.googleapis.com/auth/indexing";
const ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const STATE_FILE = resolve(".indexing-state.json");
const DAILY_QUOTA = 200; // Google's hard cap per service account
const PAUSE_MS = 200;    // gentle rate-limit between requests

// Auth via the service-account JSON pointed at by
// GOOGLE_APPLICATION_CREDENTIALS (set in the environment).
const auth = new google.auth.GoogleAuth({ scopes: [SCOPE] });
const client = await auth.getClient();

// Pull the URL list from the live sitemap so we never drift.
async function fetchSitemapUrls() {
  const res = await fetch("https://twineconvert.com/sitemap.xml");
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// Track which URLs succeeded so we can resume on day 2 without burning
// quota on already-submitted ones.
function loadState() {
  if (!existsSync(STATE_FILE)) return { submitted: [] };
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}
function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function notifyOne(url) {
  const res = await client.request({
    url: ENDPOINT,
    method: "POST",
    data: { url, type: "URL_UPDATED" },
  });
  return res.status;
}

const allUrls = await fetchSitemapUrls();
const state = loadState();
const submittedSet = new Set(state.submitted);
const pending = allUrls.filter((u) => !submittedSet.has(u));

console.log(`sitemap: ${allUrls.length} total | already submitted: ${state.submitted.length} | pending: ${pending.length}`);

const todayBatch = pending.slice(0, DAILY_QUOTA);
console.log(`today's batch: ${todayBatch.length} URLs (max ${DAILY_QUOTA}/day per service account)`);

let ok = 0;
let failed = 0;
for (const url of todayBatch) {
  try {
    const status = await notifyOne(url);
    state.submitted.push(url);
    saveState(state);
    ok++;
    console.log(`  ${status}  ${url}`);
  } catch (e) {
    failed++;
    const msg = e?.response?.data?.error?.message ?? e.message;
    console.error(`  FAIL  ${url}  →  ${msg}`);
    // 429 = daily quota exhausted; stop early
    if (e?.response?.status === 429) {
      console.error("daily quota reached, stopping");
      break;
    }
  }
  await new Promise((r) => setTimeout(r, PAUSE_MS));
}

console.log(`\ndone — submitted ${ok}, failed ${failed}, remaining ${pending.length - ok}`);
if (pending.length - ok > 0) {
  console.log("re-run tomorrow to continue (state file remembers progress).");
}
