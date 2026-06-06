import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * HAR → curl commands. HAR is the HTTP Archive JSON format every
 * browser DevTools exports. Each captured request is rebuilt as a
 * properly quoted curl command on its own line, so you can:
 *   - reproduce a failing API call against your dev server,
 *   - rerun a sequence of requests in a bash script,
 *   - paste a single curl into Postman / Insomnia for further work.
 *
 * Header order is preserved (HAR captures it), and quoting uses POSIX
 * single quotes (escaped via the standard '...'\''...' trick) so the
 * output is safe to paste into any shell.
 */
const harToCurl: Converter = {
  id: "har-to-curl",
  label: "HAR → curl",
  fromMime: ["application/json", "application/har+json", "text/plain"],
  accept: [".har", ".json"],
  toMime: "application/x-sh",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed = JSON.parse(await input.text());
      const entries = parsed?.log?.entries;
      if (!Array.isArray(entries)) {
        throw new Error(
          'HAR is missing the required "log.entries" array. Re-export from the browser DevTools (Network tab, right-click, "Save all as HAR with content").',
        );
      }
      const lines: string[] = [];
      for (const e of entries) {
        const cmd = entryToCurl(e);
        if (cmd) lines.push(cmd);
      }
      if (lines.length === 0) {
        throw new Error("HAR contains no requests with a URL; nothing to emit.");
      }
      out = lines.join("\n\n") + "\n";
      opts?.onProgress?.(0.9);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HAR to curl",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/x-sh;charset=utf-8" }),
      filename: swapExtension(input.name, "sh"),
    };
  },
};

interface HarRequest {
  method?: string;
  url?: string;
  headers?: Array<{ name: string; value: string }>;
  postData?: { text?: string; mimeType?: string };
}

function entryToCurl(entry: unknown): string | null {
  const req = (entry as { request?: HarRequest })?.request;
  if (!req || !req.url) return null;
  const method = (req.method ?? "GET").toUpperCase();
  const parts = ["curl"];
  if (method !== "GET") parts.push("-X", method);
  parts.push(shellQuote(req.url));

  for (const h of req.headers ?? []) {
    if (!h?.name) continue;
    // Filter pseudo-headers (HTTP/2 ":path", ":method") that aren't
    // meaningful as curl -H flags and would just confuse the user.
    if (h.name.startsWith(":")) continue;
    parts.push("-H", shellQuote(`${h.name}: ${h.value ?? ""}`));
  }

  const body = req.postData?.text;
  if (body && body.length > 0) {
    parts.push("--data-raw", shellQuote(body));
  }
  return parts.join(" ");
}

function shellQuote(value: string): string {
  // POSIX single-quote: wrap in single quotes, replace any embedded
  // single quote with the standard '\'' escape sequence.
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export default harToCurl;
