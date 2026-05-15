/**
 * Query Google Search Console for the twineconvert.com property.
 *
 * Uses the same OAuth refresh token written by scripts/oauth-auth-google.mjs.
 * After updating the script's SCOPES to include webmasters.readonly, you
 * MUST re-run oauth-auth-google.mjs once to get a token with the new scope.
 *
 * Subcommands:
 *   top-queries [--days N] [--limit N]
 *     Top search queries driving impressions/clicks. Default 7 days, 25 rows.
 *
 *   top-pages [--days N] [--limit N]
 *     Top pages by clicks.
 *
 *   coverage
 *     Total clicks, impressions, CTR, average position for the period.
 *
 *   sitemaps
 *     List submitted sitemaps and their last-fetch status.
 *
 * Heads-up: for a domain that's days old (twineconvert is <1 week), most
 * queries return very sparse data. GSC backfills over 2-3 days and Google
 * needs to crawl + serve impressions before anything shows up.
 */

import { google } from "googleapis";
import { readFileSync, existsSync } from "node:fs";
import { resolve as resolveHome } from "node:path";
import { homedir } from "node:os";

// Default to the Domain property. It aggregates www + non-www + http/https
// into one view; the URL-prefix properties (e.g. https://twineconvert.com/)
// only hold a partial slice and the sitemap lives under the www one, so
// querying a prefix property silently returns misleading partial data.
const SITE_URL = process.env.GSC_SITE ?? "sc-domain:twineconvert.com";

const clientCfgPath = resolveHome(homedir(), ".config/twineconvert-oauth-client.json");
const tokenPath = resolveHome(homedir(), ".config/twineconvert-oauth-token.json");
if (!existsSync(clientCfgPath) || !existsSync(tokenPath)) {
  console.error(
    "Missing OAuth client config or refresh token.\n" +
    `Expected:\n  ${clientCfgPath}\n  ${tokenPath}\n` +
    "Run `node scripts/oauth-auth-google.mjs` first.",
  );
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(clientCfgPath, "utf8"));
const installed = cfg.installed ?? cfg.web ?? cfg;
const tok = JSON.parse(readFileSync(tokenPath, "utf8"));
const oauth = new google.auth.OAuth2(installed.client_id, installed.client_secret);
oauth.setCredentials({ refresh_token: tok.refresh_token });

const sc = google.searchconsole({ version: "v1", auth: oauth });

function flag(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

function dateRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - Number(days));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

const subcommand = process.argv[2];

if (subcommand === "top-queries") {
  const days = flag("--days", "7");
  const limit = Number(flag("--limit", "25"));
  const [startDate, endDate] = dateRange(days);
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: limit },
  });
  const rows = res.data.rows ?? [];
  if (rows.length === 0) {
    console.log(`No query data for ${startDate} to ${endDate}. GSC backfills 2-3 days.`);
    process.exit(0);
  }
  console.log(`Top ${rows.length} queries, ${startDate} to ${endDate}:`);
  console.log("clicks  impr   ctr%   pos    query");
  for (const r of rows) {
    const clicks = String(r.clicks ?? 0).padStart(5);
    const impr = String(r.impressions ?? 0).padStart(5);
    const ctr = ((r.ctr ?? 0) * 100).toFixed(1).padStart(5);
    const pos = (r.position ?? 0).toFixed(1).padStart(5);
    console.log(`${clicks}  ${impr}  ${ctr}  ${pos}  ${r.keys?.[0] ?? ""}`);
  }
} else if (subcommand === "top-pages") {
  const days = flag("--days", "7");
  const limit = Number(flag("--limit", "25"));
  const [startDate, endDate] = dateRange(days);
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: limit },
  });
  const rows = res.data.rows ?? [];
  if (rows.length === 0) {
    console.log(`No page data for ${startDate} to ${endDate}.`);
    process.exit(0);
  }
  console.log(`Top ${rows.length} pages, ${startDate} to ${endDate}:`);
  console.log("clicks  impr   ctr%   pos    page");
  for (const r of rows) {
    const clicks = String(r.clicks ?? 0).padStart(5);
    const impr = String(r.impressions ?? 0).padStart(5);
    const ctr = ((r.ctr ?? 0) * 100).toFixed(1).padStart(5);
    const pos = (r.position ?? 0).toFixed(1).padStart(5);
    const page = (r.keys?.[0] ?? "").replace(/^https?:\/\/(www\.)?twineconvert\.com/, "");
    console.log(`${clicks}  ${impr}  ${ctr}  ${pos}  ${page}`);
  }
} else if (subcommand === "coverage") {
  const days = flag("--days", "7");
  const [startDate, endDate] = dateRange(days);
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { startDate, endDate, rowLimit: 1 },
  });
  const r = res.data.rows?.[0];
  if (!r) {
    console.log(`No coverage data for ${startDate} to ${endDate}.`);
    process.exit(0);
  }
  console.log(`Search performance ${startDate} to ${endDate}:`);
  console.log(`  clicks       ${r.clicks ?? 0}`);
  console.log(`  impressions  ${r.impressions ?? 0}`);
  console.log(`  CTR          ${((r.ctr ?? 0) * 100).toFixed(2)}%`);
  console.log(`  avg position ${(r.position ?? 0).toFixed(2)}`);
} else if (subcommand === "sitemaps") {
  const res = await sc.sitemaps.list({ siteUrl: SITE_URL });
  const items = res.data.sitemap ?? [];
  if (items.length === 0) {
    console.log("No sitemaps registered for this property.");
    process.exit(0);
  }
  for (const s of items) {
    console.log(`${s.path}`);
    console.log(`  type           ${s.type ?? "n/a"}`);
    console.log(`  last submitted ${s.lastSubmitted ?? "n/a"}`);
    console.log(`  last downloaded${s.lastDownloaded ? " " + s.lastDownloaded : " (never)"}`);
    console.log(`  errors / warnings  ${s.errors ?? 0} / ${s.warnings ?? 0}`);
    console.log(`  pages submitted    ${s.contents?.[0]?.submitted ?? "n/a"}`);
    console.log(`  pages indexed      ${s.contents?.[0]?.indexed ?? "n/a"}`);
  }
} else {
  console.log("Usage:");
  console.log("  node scripts/query-gsc.mjs top-queries [--days 7] [--limit 25]");
  console.log("  node scripts/query-gsc.mjs top-pages   [--days 7] [--limit 25]");
  console.log("  node scripts/query-gsc.mjs coverage    [--days 7]");
  console.log("  node scripts/query-gsc.mjs sitemaps");
  process.exit(1);
}
