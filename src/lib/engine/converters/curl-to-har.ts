import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * curl commands → HAR. Parses one or more curl invocations (each on
 * its own logical line, with `\` continuations and blank-line
 * separators both supported) into a HAR 1.2 document with one entry
 * per command. Useful for replaying a captured sequence in Charles
 * Proxy, mitmproxy, Insomnia, or any HAR-importing tool.
 *
 * Supported curl flags: -X / --request, -H / --header,
 * -d / --data / --data-raw / --data-binary, --url, and a positional
 * URL. The lib intentionally does NOT execute the commands.
 */
const curlToHar: Converter = {
  id: "curl-to-har",
  label: "curl → HAR",
  fromMime: ["text/plain", "application/x-sh", "text/x-shellscript"],
  accept: [".sh", ".txt", ".curl"],
  toMime: "application/har+json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const text = await input.text();
      const commands = splitCommands(text);
      if (commands.length === 0) {
        throw new Error('No curl commands found. Each command should start with "curl ".');
      }
      const sq = await import("shell-quote");
      const parseFn = sq.parse as (cmd: string) => Array<string | { op?: string }>;
      const entries: unknown[] = [];
      for (const cmd of commands) {
        const tokens = parseFn(cmd).filter(
          (t): t is string => typeof t === "string",
        );
        const entry = curlTokensToHarEntry(tokens);
        if (entry) entries.push(entry);
      }
      if (entries.length === 0) {
        throw new Error("All curl commands failed to parse (no URL detected).");
      }
      json = JSON.stringify(
        {
          log: {
            version: "1.2",
            creator: { name: "twineconvert", version: "1.0" },
            entries,
          },
        },
        null,
        2,
      );
      opts?.onProgress?.(0.9);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert curl to HAR",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/har+json;charset=utf-8" }),
      filename: swapExtension(input.name, "har"),
    };
  },
};

function splitCommands(input: string): string[] {
  // Join `\` line-continuations into single logical lines, then split
  // on blank lines OR on a new line that starts with "curl ".
  const joined = input.replace(/\\\r?\n/g, " ");
  const out: string[] = [];
  let current = "";
  for (const line of joined.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (current.trim().length > 0) {
        out.push(current.trim());
        current = "";
      }
      continue;
    }
    if (/^curl\b/.test(trimmed) && current.trim().length > 0) {
      out.push(current.trim());
      current = "";
    }
    current += " " + trimmed;
  }
  if (current.trim().length > 0) out.push(current.trim());
  return out.filter((c) => /^curl\b/.test(c));
}

interface HarHeader {
  name: string;
  value: string;
}
interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: HarHeader[];
    queryString: [];
    cookies: [];
    headersSize: number;
    bodySize: number;
    postData?: { mimeType: string; text: string };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: [];
    cookies: [];
    content: { size: number; mimeType: string };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: { send: number; wait: number; receive: number };
}

function curlTokensToHarEntry(tokens: string[]): HarEntry | null {
  let method = "GET";
  let url: string | null = null;
  const headers: HarHeader[] = [];
  let body: string | null = null;

  // Skip the leading "curl" token.
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") {
      method = (tokens[++i] ?? "GET").toUpperCase();
    } else if (t === "-H" || t === "--header") {
      const raw = tokens[++i] ?? "";
      const colon = raw.indexOf(":");
      if (colon === -1) continue;
      headers.push({
        name: raw.slice(0, colon).trim(),
        value: raw.slice(colon + 1).trim(),
      });
    } else if (
      t === "-d" ||
      t === "--data" ||
      t === "--data-raw" ||
      t === "--data-binary" ||
      t === "--data-urlencode"
    ) {
      body = tokens[++i] ?? "";
      if (method === "GET") method = "POST";
    } else if (t === "--url") {
      url = tokens[++i] ?? null;
    } else if (t.startsWith("-")) {
      // Unknown flag; if it expects a value we'd over-consume here. Curl
      // flags are inconsistent, so we play safe by only consuming an
      // arg if the next token doesn't itself look like a flag.
      const next = tokens[i + 1];
      if (next && !next.startsWith("-") && !/^https?:/.test(next)) i++;
    } else if (!url && /^https?:\/\//.test(t)) {
      url = t;
    }
  }

  if (!url) return null;

  const request: HarEntry["request"] = {
    method,
    url,
    httpVersion: "HTTP/1.1",
    headers,
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: body ? body.length : 0,
  };
  if (body) {
    const ct = headers.find((h) => h.name.toLowerCase() === "content-type")?.value;
    request.postData = { mimeType: ct ?? "application/octet-stream", text: body };
  }

  return {
    startedDateTime: new Date(0).toISOString(),
    time: 0,
    request,
    response: {
      status: 0,
      statusText: "",
      httpVersion: "HTTP/1.1",
      headers: [],
      cookies: [],
      content: { size: 0, mimeType: "" },
      redirectURL: "",
      headersSize: -1,
      bodySize: -1,
    },
    cache: {},
    timings: { send: 0, wait: 0, receive: 0 },
  };
}

export default curlToHar;
