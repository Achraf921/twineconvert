/**
 * Adds twineconvert tool URLs to relevant Wikidata items via the
 * official MediaWiki action API. Wikidata flows directly into
 * Google's Knowledge Graph so backlinks here can show up in the
 * right-side info panels for related search queries.
 *
 * Approach: for each format we have a converter for, find the format's
 * Wikidata item (Q-number), then add a "described at URL" (P973) or
 * "official website" claim pointing at our tool page.
 *
 * Auth: uses the MediaWiki OAuth flow with bot password credentials.
 * Set up at https://www.wikidata.org/wiki/Special:BotPasswords
 *
 * Required env vars (drop into .env.local, gitignored):
 *   WIKIDATA_USER=YourWikidataUsername
 *   WIKIDATA_BOT_PASSWORD=YourBotName@bot_password_here
 *
 * Usage:
 *   WIKIDATA_USER=... WIKIDATA_BOT_PASSWORD=... \
 *     node scripts/submit-wikidata.mjs
 *
 * Heads-up: Wikidata edits go live immediately and are visible to all
 * editors. Only add genuinely useful "described at" URLs, not bare
 * promo links. Wikidata editors are vigilant about spam and can
 * revert + block accounts. Run this conservatively (the script targets
 * only obvious matches) and stop if any edit gets reverted.
 */

import { writeFileSync } from "node:fs";

const API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "twineconvert-link-bot/1.0 (https://twineconvert.com; admin@twineconvert.com)";

const WIKIDATA_USER = process.env.WIKIDATA_USER;
const WIKIDATA_BOT_PASSWORD = process.env.WIKIDATA_BOT_PASSWORD;

if (!WIKIDATA_USER || !WIKIDATA_BOT_PASSWORD) {
  console.error("Set WIKIDATA_USER and WIKIDATA_BOT_PASSWORD environment variables.");
  console.error("Get a bot password at https://www.wikidata.org/wiki/Special:BotPasswords");
  process.exit(1);
}

// Format -> { Q-number, twineconvert tool path to link }. Only formats
// where we have a clear, popular conversion. Keep this list short and
// uncontroversial; bulk-spamming Wikidata gets accounts blocked fast.
const TARGETS = [
  { format: "HEIC", qid: "Q24938866", toolPath: "/heic-to-jpg" },
  { format: "GEDCOM", qid: "Q1071617", toolPath: "/gedcom-to-csv" },
  { format: "OFX", qid: "Q1404935", toolPath: "/ofx-to-csv" },
  { format: "ADIF", qid: "Q391006", toolPath: "/adif-to-csv" },
  { format: "DST", qid: "Q1144470", toolPath: "/dst-to-pes" },
  { format: "PES", qid: "Q5170949", toolPath: "/pes-to-dst" },
  // Property P2888 = "exact match" for related external tools/resources.
];

// Cookie jar for the session.
const cookieJar = new Map();

function setCookies(headers) {
  const setCookie = headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    const [k, v] = pair.split("=");
    if (k && v !== undefined) cookieJar.set(k.trim(), v.trim());
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function call(params, method = "POST") {
  const formBody = new URLSearchParams({ format: "json", ...params });
  const res = await fetch(API, {
    method,
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(),
    },
    body: method === "POST" ? formBody.toString() : undefined,
  });
  setCookies(res.headers);
  const json = await res.json();
  if (json.error) {
    throw new Error(`API error: ${json.error.code}: ${json.error.info}`);
  }
  return json;
}

// 1. Get login token
const tokenRes = await call({ action: "query", meta: "tokens", type: "login" });
const loginToken = tokenRes.query.tokens.logintoken;

// 2. Login
const loginRes = await call({
  action: "login",
  lgname: WIKIDATA_USER,
  lgpassword: WIKIDATA_BOT_PASSWORD,
  lgtoken: loginToken,
});
if (loginRes.login?.result !== "Success") {
  console.error("Login failed:", loginRes);
  process.exit(1);
}
console.log(`Logged in as ${loginRes.login.lgusername}`);

// 3. Get CSRF token for edit operations
const csrfRes = await call({ action: "query", meta: "tokens", type: "csrf" });
const csrfToken = csrfRes.query.tokens.csrftoken;

const results = [];
for (const target of TARGETS) {
  const url = `https://twineconvert.com${target.toolPath}`;
  process.stdout.write(`adding ${url} to ${target.qid} (${target.format})... `);
  try {
    // Add a P973 "described at URL" claim with the tool page.
    const claim = await call({
      action: "wbcreateclaim",
      entity: target.qid,
      property: "P973",
      snaktype: "value",
      value: JSON.stringify(url),
      token: csrfToken,
      bot: "1",
    });
    if (claim.success) {
      console.log(`✓ claim ${claim.claim.id}`);
      results.push({ ...target, status: "ok", claimId: claim.claim.id });
    } else {
      console.log(`unexpected response`);
      results.push({ ...target, status: "unexpected", response: claim });
    }
  } catch (e) {
    console.log(`FAIL: ${e.message}`);
    results.push({ ...target, status: "fail", error: e.message });
  }
  // Be polite; Wikidata's recommendation is not more than 1 edit per second
  await new Promise((r) => setTimeout(r, 1500));
}

writeFileSync(
  "/tmp/wikidata-results.json",
  JSON.stringify(results, null, 2),
);
const ok = results.filter((r) => r.status === "ok").length;
console.log(`\ndone. ${ok}/${results.length} claims added. Full results in /tmp/wikidata-results.json`);
console.log(`\nIMPORTANT: open https://www.wikidata.org/wiki/Special:Contributions/${loginRes.login.lgusername}`);
console.log("and check the edits look reasonable. If any get reverted, stop and don't re-run.");
