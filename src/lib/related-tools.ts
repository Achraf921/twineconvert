/**
 * Auto-generated cross-link grids for per-tool pages.
 *
 * For a tool like `heic-to-jpg`, we want two link grids on the page:
 *   1. "Convert HEIC to other formats" — every other route starting with `heic-to-`
 *   2. "Convert other files to JPG" — every other route ending with `-to-jpg`
 *
 * These are SEO weapons: they create dense topic clusters and internal
 * linking that Google uses to understand how related pages connect.
 * Every per-tool page becomes an entry point into the rest of the
 * engine, which keeps users (and crawlers) on the site longer.
 */

import { listToolIds } from "./engine/registry-meta";

/** Split an id like "heic-to-jpg" into [input, output]. Returns null for non-pair routes. */
function splitPair(id: string): [string, string] | null {
  const parts = id.split("-to-");
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

/**
 * Find every other tool that converts FROM the same input format.
 * Limit defaults to 12 to avoid bloating the page; the engine has
 * up to 6-8 reverse-direction outputs for some formats and we want
 * a tight grid, not an overwhelming list.
 */
export function getOtherOutputsForInput(currentId: string, limit = 12): Array<{ id: string; output: string }> {
  const split = splitPair(currentId);
  if (!split) return [];
  const [input] = split;
  const out: Array<{ id: string; output: string }> = [];
  for (const id of listToolIds()) {
    if (id === currentId) continue;
    const s = splitPair(id);
    if (!s) continue;
    if (s[0] === input) out.push({ id, output: s[1] });
    if (out.length >= limit) break;
  }
  return out;
}

/** Find every other tool that converts TO the same output format. */
export function getOtherInputsForOutput(currentId: string, limit = 12): Array<{ id: string; input: string }> {
  const split = splitPair(currentId);
  if (!split) return [];
  const [, output] = split;
  const out: Array<{ id: string; input: string }> = [];
  for (const id of listToolIds()) {
    if (id === currentId) continue;
    const s = splitPair(id);
    if (!s) continue;
    if (s[1] === output) out.push({ id, input: s[0] });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Hand-curated "related tools" — when there's a thematic relationship
 * across format families that auto-generation can't infer (e.g. on
 * /heic-to-jpg we want to surface compress-pdf because Apple users
 * often have BOTH iPhone photos AND big PDFs to share).
 *
 * Falls back to auto-generated grids when not specified.
 */
const HAND_CURATED_RELATED: Record<string, string[]> = {
  "heic-to-jpg": ["png-to-jpg", "webp-to-jpg", "heic-to-pdf", "pdf-to-jpg"],
  "pdf-to-docx": ["docx-to-pdf", "pdf-to-text", "compress-pdf", "docx-to-html"],
  "mp4-to-mp3": ["wav-to-mp3", "m4a-to-mp3", "mp4-to-gif", "mov-to-mp4"],
};

export function getRelatedTools(currentId: string): string[] {
  return HAND_CURATED_RELATED[currentId] ?? [];
}
