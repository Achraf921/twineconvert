/**
 * One-time OAuth consent flow for the Google Indexing API.
 *
 * Why: the service-account auth flow requires the service account to be a
 * verified Owner of a URL Prefix property in Search Console. Google has
 * blocked that path in late 2024 / 2025 ("email not found" for service
 * accounts when added with Owner permission). The workaround that still
 * works in 2026 is user-credential OAuth — we authenticate as a real human
 * who IS already a verified Owner, and the Indexing API accepts the calls.
 *
 * Flow:
 *   1. Spin up a localhost HTTP server on a free port (Google's loopback
 *      redirect rules require this; "oob" is deprecated).
 *   2. Open the user's browser to Google's consent URL.
 *   3. Capture the auth code from the redirect.
 *   4. Exchange the code for a refresh token.
 *   5. Save the refresh token to ~/.config/twineconvert-oauth-token.json.
 *
 * Run once:
 *   node scripts/oauth-auth-google.mjs
 *
 * Subsequent runs of submit-urls-to-google.mjs --oauth use the saved token.
 */

import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { createServer } from "node:http";
import { resolve as resolvePath } from "node:path";
import { homedir } from "node:os";
import { execFile } from "node:child_process";

const CLIENT_FILE = resolvePath(homedir(), ".config/twineconvert-oauth-client.json");
const TOKEN_FILE = resolvePath(homedir(), ".config/twineconvert-oauth-token.json");
const SCOPE = "https://www.googleapis.com/auth/indexing";

if (!existsSync(CLIENT_FILE)) {
  console.error(`missing ${CLIENT_FILE} — paste the OAuth client JSON there first`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(CLIENT_FILE, "utf8"));
const installed = config.installed ?? config.web ?? config;
const { client_id, client_secret } = installed;

// Spin up a one-shot HTTP server on a random localhost port so Google
// can redirect back to us with the auth code.
const server = createServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const redirectUri = `http://127.0.0.1:${port}`;

const oauth = new google.auth.OAuth2(client_id, client_secret, redirectUri);
const authUrl = oauth.generateAuthUrl({
  access_type: "offline", // forces refresh_token in response
  prompt: "consent",       // forces re-consent so refresh_token is always returned (Google omits it on re-auth otherwise)
  scope: [SCOPE],
});

console.log("Opening your browser to authorize...");
console.log("If it doesn't open, paste this URL manually:");
console.log("");
console.log(`  ${authUrl}`);
console.log("");

// Open browser via execFile (no shell, avoids injection on macOS / Linux / Windows)
const opener =
  process.platform === "darwin" ? "open" :
  process.platform === "win32" ? "cmd" :
  "xdg-open";
const args = process.platform === "win32" ? ["/c", "start", "", authUrl] : [authUrl];
execFile(opener, args, () => { /* best effort; ignore errors, user can paste URL manually */ });

const code = await new Promise((resolveCode, rejectCode) => {
  server.on("request", (req, res) => {
    try {
      const url = new URL(req.url ?? "/", redirectUri);
      const c = url.searchParams.get("code");
      const err = url.searchParams.get("error");
      if (err) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`OAuth error: ${err}. Close this tab.`);
        rejectCode(new Error(`OAuth error: ${err}`));
        return;
      }
      if (!c) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("No code in redirect");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<h1>✓ Authorized</h1><p>You can close this tab and return to the terminal.</p>`);
      resolveCode(c);
    } catch (e) {
      rejectCode(e);
    }
  });
});

server.close();

const { tokens } = await oauth.getToken(code);
if (!tokens.refresh_token) {
  console.error(
    "No refresh_token in response. Google sometimes omits it on re-auth.\n" +
    "Revoke at https://myaccount.google.com/permissions and re-run.",
  );
  process.exit(1);
}

writeFileSync(
  TOKEN_FILE,
  JSON.stringify({ refresh_token: tokens.refresh_token, obtained_at: Date.now() }, null, 2),
);
chmodSync(TOKEN_FILE, 0o600);

console.log(`✓ Refresh token saved to ${TOKEN_FILE}`);
console.log("");
console.log("Next: node scripts/submit-urls-to-google.mjs --probe --oauth");
