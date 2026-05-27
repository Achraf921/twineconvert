/**
 * Auto-generated cross-link grids for per-tool pages.
 *
 * For a tool like `heic-to-jpg`, we want two link grids on the page:
 *   1. "Convert HEIC to other formats", every other route starting with `heic-to-`
 *   2. "Convert other files to JPG", every other route ending with `-to-jpg`
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
 * Hand-curated cross-family "related tools" links. The auto-grids above
 * cover same-input and same-output well; this map exists for
 * cross-direction-in-same-family (reverse pair) and cross-family
 * thematic clusters the auto-grid cannot infer.
 *
 * Curation principle, sourced from 2026-05-24 PostHog + GSC data:
 *   1. Top performers (bibtex-to-csv, pes-to-exp, 3dl-to-cube, etc.)
 *      get sibling links so their authority spreads through the cluster.
 *   2. Lane-3 buried pages (qbo-to-csv, qfx-to-csv) get INBOUND links
 *      from finance siblings so authority flows toward them.
 *   3. Reverse-direction is almost always included (users round-trip).
 *
 * Every id below is verified to exist in the registry. Pages that do
 * not appear here fall through to the auto-grids; no empty section
 * renders.
 */
const HAND_CURATED_RELATED: Record<string, string[]> = {
  // ===== Image / PDF cross-family =====
  "heic-to-jpg": ["png-to-jpg", "webp-to-jpg", "heic-to-pdf", "pdf-to-jpg"],
  "pdf-to-docx": ["docx-to-pdf", "pdf-to-text", "compress-pdf", "docx-to-html"],
  "mp4-to-mp3": ["wav-to-mp3", "m4a-to-mp3", "mp4-to-gif", "mov-to-mp4"],

  // ===== Bibliographic cluster (academics use multiple together) =====
  "bibtex-to-csv":    ["csv-to-bibtex", "bibtex-to-xlsx", "bibtex-to-ris", "ris-to-csv"],
  "ris-to-csv":       ["csv-to-ris", "ris-to-bibtex", "ris-to-xlsx", "bibtex-to-csv"],
  "bibtex-to-ris":    ["ris-to-bibtex", "bibtex-to-csv", "ris-to-csv", "nbib-to-ris"],
  "ris-to-bibtex":    ["bibtex-to-ris", "ris-to-csv", "bibtex-to-csv", "nbib-to-bibtex"],
  "nbib-to-ris":      ["nbib-to-bibtex", "nbib-to-xlsx", "ris-to-bibtex", "bibtex-to-ris"],
  "nbib-to-bibtex":   ["nbib-to-ris", "nbib-to-xlsx", "ris-to-bibtex", "bibtex-to-ris"],
  "nbib-to-xlsx":     ["nbib-to-bibtex", "nbib-to-ris", "ris-to-xlsx", "bibtex-to-xlsx"],
  "bibtex-to-xlsx":   ["bibtex-to-csv", "bibtex-to-ris", "ris-to-xlsx", "nbib-to-xlsx"],
  "ris-to-xlsx":      ["ris-to-csv", "ris-to-bibtex", "bibtex-to-xlsx", "nbib-to-xlsx"],
  "csv-to-bibtex":    ["bibtex-to-csv", "csv-to-ris", "bibtex-to-ris"],
  "csv-to-ris":       ["ris-to-csv", "csv-to-bibtex", "ris-to-bibtex"],

  // ===== Finance cluster (inbound boost for lane-3 buried qbo/qfx) =====
  "qbo-to-csv":  ["qfx-to-csv", "ofx-to-csv", "qif-to-csv", "csv-to-qbo"],
  "qfx-to-csv":  ["qbo-to-csv", "ofx-to-csv", "qif-to-csv", "csv-to-qfx"],
  "ofx-to-csv":  ["qbo-to-csv", "qfx-to-csv", "qif-to-csv", "csv-to-ofx"],
  "qif-to-csv":  ["qbo-to-csv", "qfx-to-csv", "ofx-to-csv", "csv-to-qif"],
  "csv-to-qbo":  ["qbo-to-csv", "csv-to-qfx", "csv-to-ofx"],
  "csv-to-qfx":  ["qfx-to-csv", "csv-to-qbo", "csv-to-ofx"],
  "csv-to-ofx":  ["ofx-to-csv", "csv-to-qbo", "csv-to-qfx"],
  "csv-to-qif":  ["qif-to-csv", "csv-to-qbo", "csv-to-qfx"],

  // ===== Embroidery cluster (top performer pes-to-exp spreads here) =====
  "pes-to-exp":  ["dst-to-exp", "jef-to-exp", "pes-to-dst", "pes-to-jef"],
  "pes-to-dst":  ["dst-to-pes", "pes-to-jef", "pes-to-exp", "jef-to-dst"],
  "pes-to-jef":  ["jef-to-pes", "pes-to-dst", "pes-to-exp", "dst-to-jef"],
  "jef-to-pes":  ["pes-to-jef", "dst-to-pes", "exp-to-pes", "jef-to-dst"],
  "dst-to-pes":  ["pes-to-dst", "jef-to-pes", "exp-to-pes", "dst-to-jef"],
  "exp-to-pes":  ["pes-to-exp", "jef-to-pes", "dst-to-pes"],
  "dst-to-jef":  ["jef-to-dst", "pes-to-jef", "dst-to-pes"],
  "jef-to-dst":  ["dst-to-jef", "jef-to-pes", "dst-to-pes"],
  "dst-to-exp":  ["pes-to-exp", "jef-to-exp", "exp-to-pes"],
  "jef-to-exp":  ["pes-to-exp", "dst-to-exp", "exp-to-jef"],

  // ===== Color LUT cluster (3dl-to-cube top performer spreads here) =====
  "3dl-to-cube": ["cube-to-3dl", "csp-to-cube", "3dl-to-csp"],
  "cube-to-3dl": ["3dl-to-cube", "cube-to-csp", "csp-to-3dl"],
  "csp-to-cube": ["cube-to-csp", "3dl-to-cube", "csp-to-3dl"],
  "cube-to-csp": ["csp-to-cube", "cube-to-3dl", "3dl-to-csp"],
  "3dl-to-csp":  ["csp-to-3dl", "3dl-to-cube", "csp-to-cube"],
  "csp-to-3dl":  ["3dl-to-csp", "cube-to-3dl", "csp-to-cube"],

  // ===== Genealogy cluster (gedcom-to-pdf has high impressions) =====
  "gedcom-to-csv":  ["gedcom-to-pdf", "gedcom-to-html", "gedcom-to-xlsx", "csv-to-gedcom"],
  "gedcom-to-pdf":  ["gedcom-to-html", "gedcom-to-csv", "gedcom-to-xlsx", "csv-to-gedcom"],
  "gedcom-to-html": ["gedcom-to-pdf", "gedcom-to-csv", "gedcom-to-xlsx", "csv-to-gedcom"],
  "gedcom-to-xlsx": ["gedcom-to-csv", "gedcom-to-pdf", "gedcom-to-html", "csv-to-gedcom"],
  "gedcom-to-json": ["gedcom-to-csv", "gedcom-to-html", "gedcom-to-xlsx", "csv-to-gedcom"],
  "csv-to-gedcom":  ["gedcom-to-csv", "gedcom-to-pdf", "gedcom-to-xlsx"],

  // ===== Contacts / calendar (newly shipped, needs authority) =====
  "vcf-to-csv":  ["csv-to-vcf", "vcf-to-json", "ics-to-csv"],
  "csv-to-vcf":  ["vcf-to-csv", "vcf-to-json", "csv-to-ics"],
  "vcf-to-json": ["vcf-to-csv", "csv-to-vcf", "ics-to-json"],
  "ics-to-csv":  ["csv-to-ics", "ics-to-json", "vcf-to-csv"],
  "csv-to-ics":  ["ics-to-csv", "ics-to-json", "csv-to-vcf"],
  "ics-to-json": ["ics-to-csv", "csv-to-ics", "vcf-to-json"],
  "vcf-to-xlsx": ["vcf-to-csv", "csv-to-vcf", "vcf-to-json"],
  "ics-to-xlsx": ["ics-to-csv", "csv-to-ics", "ics-to-json"],

  // ===== Generic data conversion (added 2026-05-27) =====
  "xml-to-csv":  ["xml-to-json", "json-to-csv", "yaml-to-csv"],
  "csv-to-html": ["csv-to-markdown-table", "html-table-to-csv", "csv-to-json"],

  // ===== Tier 1 video batch (2026-05-27) cross-direction =====
  "m4v-to-mp4":  ["mp4-to-mov", "mov-to-mp4", "mp4-to-webm"],
  "3gp-to-mp4":  ["mts-to-mp4", "flv-to-mp4", "wmv-to-mp4"],
  "flv-to-mp4":  ["wmv-to-mp4", "mts-to-mp4", "3gp-to-mp4"],
  "wmv-to-mp4":  ["flv-to-mp4", "mts-to-mp4", "3gp-to-mp4"],
  "mts-to-mp4":  ["3gp-to-mp4", "flv-to-mp4", "wmv-to-mp4"],
  "mp4-to-webm": ["webm-to-mp4", "mp4-to-mov", "mp4-to-gif"],
  "mov-to-gif":  ["mp4-to-gif", "gif-to-mp4", "mov-to-mp4"],

  // ===== Chess (fen-to-png + pgn-to-fen rank well, sibling spread) =====
  "fen-to-pgn":  ["pgn-to-fen", "fen-to-png", "pgn-to-csv", "pgn-to-json"],
  "fen-to-png":  ["fen-to-pgn", "pgn-to-fen", "pgn-to-csv"],
  "pgn-to-fen":  ["fen-to-pgn", "fen-to-png", "pgn-to-csv", "pgn-to-json"],
  "pgn-to-csv":  ["pgn-to-fen", "pgn-to-json", "fen-to-pgn"],
  "pgn-to-json": ["pgn-to-csv", "pgn-to-fen", "fen-to-pgn"],
};

export function getRelatedTools(currentId: string): string[] {
  return HAND_CURATED_RELATED[currentId] ?? [];
}
