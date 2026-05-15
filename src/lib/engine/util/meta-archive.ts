/**
 * Shared helpers for Meta-platform data exports (Instagram, Facebook).
 *
 * Meta gives users a "Download Your Information" zip that contains
 * dozens of category folders (posts, messages, your_topics, etc.) with
 * either JSON or HTML files inside. Path conventions shift between
 * Meta's export-format versions, what's `media/posts_1.json` today was
 * `posts/posts.json` two years ago. We use glob-style path matching so
 * this works across the historical layouts.
 */

import type JSZipType from "jszip";

export interface FoundFile {
  path: string;
  load: () => Promise<string>;
}

/**
 * Canonical Instagram "Posts" file patterns across every Meta export-
 * format version we've seen. Single source of truth so both
 * instagram-data-to-csv and instagram-data-to-html stay in sync.
 */
export const INSTAGRAM_POST_PATTERNS: RegExp[] = [
  /your_instagram_activity\/content\/posts_\d+\.json$/i,
  /your_instagram_activity\/posts\/posts_\d+\.json$/i,
  /your_instagram_activity\/media\/posts_\d+\.json$/i,
  /content\/posts_\d+\.json$/i,
  /media\/posts_\d+\.json$/i,
  /^posts\/posts_\d+\.json$/i,
  /content\/posts(_\d+)?\.json$/i,
  /^posts\.json$/i,
  /(^|\/)posts_\d+\.json$/i, // anywhere in the tree, last resort
];

const INSTAGRAM_HTML_POST_PATTERNS: RegExp[] = [
  /posts_\d+\.html$/i,
  /content\/posts.*\.html$/i,
];

/**
 * Find the Instagram posts JSON files in a Download-Your-Information
 * zip, or throw an actionable error explaining exactly why we couldn't
 * (HTML-format export, wrong category selected, no JSON at all). The
 * error lists the JSON files the archive DID contain so the user can
 * self-diagnose. Used by every instagram-data-to-* converter.
 */
export async function findInstagramPosts(
  input: File | Blob,
): Promise<FoundFile[]> {
  const { zip, files } = await findFilesInZip(input, INSTAGRAM_POST_PATTERNS);
  if (files.length > 0) return files;

  const allNames = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  if (allNames.some((n) => INSTAGRAM_HTML_POST_PATTERNS.some((p) => p.test(n)))) {
    throw new Error(
      "This archive is the HTML-format export — it has no machine-readable JSON. " +
        "Re-download from Instagram: Settings → Accounts Center → Your information and permissions → " +
        "Download your information → set Format to JSON (not HTML), include Posts, then convert that zip.",
    );
  }
  const jsonFiles = allNames.filter((n) => /\.json$/i.test(n));
  const shown = jsonFiles.slice(0, 12);
  const hint =
    jsonFiles.length > 0
      ? ` The archive does contain these JSON files: ${shown.join(", ")}${
          jsonFiles.length > 12 ? ", ..." : ""
        }.`
      : " The archive contains no JSON files at all.";
  throw new Error(
    'No posts data found in this Instagram archive. When requesting your data, make sure "Posts" ' +
      "is selected (Download your information → Some of your information → Posts) and Format is JSON." +
      hint,
  );
}

/** Find all files inside the zip whose path matches any of the patterns. */
export async function findFilesInZip(
  input: File | Blob,
  patterns: RegExp[],
): Promise<{ zip: JSZipType; files: FoundFile[] }> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(await input.arrayBuffer());
  const matched: FoundFile[] = [];
  for (const name of Object.keys(zip.files)) {
    const entry = zip.files[name];
    if (entry.dir) continue;
    if (patterns.some((p) => p.test(name))) {
      matched.push({
        path: name,
        load: () => entry.async("string"),
      });
    }
  }
  return { zip, files: matched };
}

/** Parse one or more JSON files and return their concatenated contents
 *  as a single array (assuming each top-level export is an array). */
export async function loadJsonArrays<T>(files: FoundFile[]): Promise<T[]> {
  const out: T[] = [];
  for (const f of files) {
    try {
      const text = await f.load();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) out.push(...parsed);
      else if (parsed && typeof parsed === "object") {
        // Some Meta exports wrap the array in a single-key object,
        // e.g. `{ "ig_other_activity": [...] }`. Take the first array.
        for (const v of Object.values(parsed)) {
          if (Array.isArray(v)) {
            out.push(...(v as T[]));
            break;
          }
        }
      }
    } catch {
      // Skip files that aren't valid JSON, Meta sometimes ships HTML in
      // the same folder as JSON depending on the export-format choice.
      continue;
    }
  }
  return out;
}

/**
 * Meta's strings are sometimes mojibake-encoded, they double-encode
 * UTF-8 as Latin-1, so "café" arrives as "cafÃ©". This normalizer
 * undoes that when it can be done safely.
 */
export function fixMetaEncoding(s: string | undefined): string {
  if (!s) return "";
  // Quick heuristic: if the string contains the telltale "Ã" multibyte
  // pair, try to decode through Latin-1 → UTF-8.
  if (!/Ã[\x80-\xBF]/.test(s)) return s;
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return s;
  }
}
