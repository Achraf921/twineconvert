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

  // ===== Exotic batch 1 (2026-05-27): PSD + MSG =====
  "psd-to-png": ["psd-to-jpg", "png-to-jpg", "heic-to-png"],
  "psd-to-jpg": ["psd-to-png", "png-to-jpg", "heic-to-jpg"],
  "msg-to-eml": ["msg-to-csv", "msg-to-pdf", "eml-to-pdf"],
  "msg-to-csv": ["msg-to-eml", "msg-to-pdf", "mbox-to-csv"],
  "msg-to-pdf": ["msg-to-eml", "msg-to-csv", "eml-to-pdf"],

  // ===== Exotic batch 2 (2026-05-27): MPEG video =====
  "mpg-to-mp4":  ["mpeg-to-mp4", "vob-to-mp4", "flv-to-mp4"],
  "mpeg-to-mp4": ["mpg-to-mp4", "vob-to-mp4", "wmv-to-mp4"],
  "vob-to-mp4":  ["mpg-to-mp4", "mpeg-to-mp4", "mts-to-mp4"],

  // ===== Industry batch (2026-05-27): lyrics + DICOM =====
  "lrc-to-srt": ["lrc-to-vtt", "srt-to-lrc", "srt-to-vtt"],
  "lrc-to-vtt": ["lrc-to-srt", "srt-to-vtt", "vtt-to-srt"],
  "srt-to-lrc": ["lrc-to-srt", "vtt-to-srt", "srt-to-vtt"],
  "dicom-to-jpg": ["dicom-to-png", "dicom-to-pdf", "dicom-to-json"],
  "dicom-to-pdf": ["dicom-to-png", "dicom-to-jpg", "dicom-to-json"],

  // ===== Music sheet batch (2026-05-28) =====
  "musicxml-to-svg": ["musicxml-to-pdf", "musicxml-to-midi", "mxl-to-svg"],
  "musicxml-to-pdf": ["musicxml-to-svg", "musicxml-to-midi", "mxl-to-svg"],
  "mxl-to-svg":      ["mxl-to-musicxml", "musicxml-to-svg", "musicxml-to-pdf"],

  // ===== GIS WKT / WKB <-> GeoJSON (PostGIS / spatial DB interop) =====
  "wkt-to-geojson":  ["geojson-to-wkt", "wkb-to-geojson", "kml-to-geojson"],
  "geojson-to-wkt":  ["wkt-to-geojson", "geojson-to-wkb", "geojson-to-kml"],
  "wkb-to-geojson":  ["geojson-to-wkb", "wkt-to-geojson", "kml-to-geojson"],
  "geojson-to-wkb":  ["wkb-to-geojson", "geojson-to-wkt", "geojson-to-kml"],

  // ===== Binary serialization (MessagePack + CBOR) =====
  "msgpack-to-json": ["json-to-msgpack", "cbor-to-json", "json-to-yaml"],
  "json-to-msgpack": ["msgpack-to-json", "json-to-cbor", "yaml-to-json"],
  "cbor-to-json":    ["json-to-cbor", "msgpack-to-json", "json-to-yaml"],
  "json-to-cbor":    ["cbor-to-json", "json-to-msgpack", "yaml-to-json"],

  // ===== Bioinformatics (FASTA / FASTQ) =====
  "fasta-to-json": ["json-to-fasta", "fastq-to-json", "csv-to-json"],
  "json-to-fasta": ["fasta-to-json", "json-to-fastq", "json-to-csv"],
  "fastq-to-json": ["json-to-fastq", "fasta-to-json", "csv-to-json"],
  "json-to-fastq": ["fastq-to-json", "json-to-fasta", "json-to-csv"],

  // ===== BitTorrent (Bencode) =====
  "bencode-to-json": ["json-to-bencode", "json-to-msgpack", "cbor-to-json"],
  "json-to-bencode": ["bencode-to-json", "msgpack-to-json", "json-to-cbor"],

  // ===== PubMed / MEDLINE export parsing =====
  "pubmed-to-ris":    ["pubmed-to-bibtex", "pubmed-to-csv", "pubmed-to-enw"],
  "pubmed-to-bibtex": ["pubmed-to-ris", "pubmed-to-csv", "pubmed-to-endnote-xml"],
  "pubmed-to-csv":    ["pubmed-to-ris", "pubmed-to-bibtex", "pubmed-to-csl-json"],
  "pubmed-to-csl-json":   ["pubmed-to-ris", "pubmed-to-enw", "pubmed-to-bibtex"],
  "pubmed-to-enw":        ["pubmed-to-endnote-xml", "pubmed-to-ris", "pubmed-to-csl-json"],
  "pubmed-to-endnote-xml": ["pubmed-to-enw", "pubmed-to-ris", "pubmed-to-nbib"],
  "pubmed-to-nbib":       ["pubmed-to-ris", "pubmed-to-bibtex", "nbib-to-bibtex"],
  "pubmed-to-xlsx":       ["pubmed-to-csv", "pubmed-to-ris", "pubmed-to-bibtex"],

  // ===== Reference-list parsing (pasted bibliography -> citation formats) =====
  "references-to-ris":      ["references-to-bibtex", "references-to-csl-json", "csv-to-ris"],
  "references-to-bibtex":   ["references-to-ris", "references-to-csl-json", "csv-to-bibtex"],
  "references-to-csl-json": ["references-to-ris", "references-to-bibtex", "references-to-enw"],
  "references-to-enw":         ["references-to-endnote-xml", "references-to-ris", "references-to-csl-json"],
  "references-to-endnote-xml": ["references-to-enw", "references-to-ris", "references-to-bibtex"],
  "references-to-nbib":        ["references-to-ris", "references-to-bibtex", "nbib-to-ris"],
  "references-to-csv":         ["references-to-xlsx", "references-to-ris", "references-to-bibtex"],
  "references-to-xlsx":        ["references-to-csv", "references-to-ris", "pubmed-to-xlsx"],

  // ===== Office + table conversions (RTF / XLSX / HTML table / CSV) =====
  "rtf-to-docx":     ["rtf-to-html", "rtf-to-markdown", "rtf-to-txt"],
  "rtf-to-markdown": ["rtf-to-html", "rtf-to-docx", "html-to-markdown"],
  "xlsx-to-html":    ["html-to-xlsx", "xlsx-to-csv", "csv-to-html"],
  "html-to-xlsx":    ["xlsx-to-html", "html-to-csv", "csv-to-xlsx"],
  "html-to-csv":     ["csv-to-html", "html-to-xlsx", "html-to-markdown"],

  // ===== Document conversions (Markdown / DOCX / HTML / text) =====
  "markdown-to-docx": ["docx-to-markdown", "markdown-to-pdf", "markdown-to-html"],
  "docx-to-markdown": ["markdown-to-docx", "docx-to-html", "docx-to-txt"],
  "markdown-to-txt":  ["markdown-to-html", "markdown-to-docx", "html-to-txt"],
  "html-to-txt":      ["txt-to-html", "html-to-markdown", "html-to-docx"],
  "txt-to-html":      ["html-to-txt", "txt-to-docx", "markdown-to-html"],

  // ===== Technical docs + diagrams =====
  "asciidoc-to-html": ["markdown-to-html", "html-to-markdown", "rtf-to-html"],
  "dot-to-svg":      ["dot-to-png", "musicxml-to-svg", "dxf-to-svg"],
  "dot-to-png":      ["dot-to-svg", "fen-to-png", "musicxml-to-svg"],

  // ===== HTTP archive (HAR) <-> curl =====
  "har-to-curl": ["curl-to-har", "json-to-yaml", "yaml-to-json"],
  "curl-to-har": ["har-to-curl", "json-to-yaml", "yaml-to-json"],

  // ===== Citation hub completion (CSL-JSON / EndNote XML / NBIB) =====
  "csl-json-to-ris": ["ris-to-csl-json","csl-json-to-bibtex","csl-json-to-csv"],
  "ris-to-csl-json": ["csl-json-to-ris","ris-to-bibtex","ris-to-csv"],
  "csl-json-to-csv": ["csv-to-csl-json","csl-json-to-ris","csl-json-to-xlsx"],
  "csv-to-csl-json": ["csl-json-to-csv","csv-to-ris","csv-to-bibtex"],
  "csl-json-to-nbib": ["nbib-to-csl-json","csl-json-to-ris","csl-json-to-bibtex"],
  "nbib-to-csl-json": ["csl-json-to-nbib","nbib-to-ris","nbib-to-bibtex"],
  "csl-json-to-endnote-xml": ["endnote-xml-to-csl-json","csl-json-to-ris","csl-json-to-bibtex"],
  "endnote-xml-to-csl-json": ["csl-json-to-endnote-xml","endnote-xml-to-ris","endnote-xml-to-bibtex"],
  "endnote-xml-to-csv": ["csv-to-endnote-xml","endnote-xml-to-xlsx","endnote-xml-to-ris"],
  "csv-to-endnote-xml": ["endnote-xml-to-csv","csv-to-ris","csv-to-bibtex"],
  "endnote-xml-to-nbib": ["nbib-to-endnote-xml","endnote-xml-to-ris","endnote-xml-to-csv"],
  "nbib-to-endnote-xml": ["endnote-xml-to-nbib","nbib-to-ris","nbib-to-bibtex"],
  "nbib-to-csv": ["csv-to-nbib","nbib-to-ris","nbib-to-bibtex"],
  "csv-to-nbib": ["nbib-to-csv","csv-to-ris","csv-to-bibtex"],
  "endnote-xml-to-xlsx": ["endnote-xml-to-csv","ris-to-xlsx","bibtex-to-xlsx"],
  "csl-json-to-xlsx": ["csl-json-to-csv","ris-to-xlsx","bibtex-to-xlsx"],

  // ===== Citation bibliography renders (markdown / html / yaml) =====
  "ris-to-markdown": ["ris-to-html","ris-to-yaml","ris-to-bibtex"],
  "ris-to-html": ["ris-to-markdown","ris-to-yaml","ris-to-bibtex"],
  "ris-to-yaml": ["ris-to-markdown","ris-to-html","ris-to-bibtex"],
  "nbib-to-markdown": ["nbib-to-html","nbib-to-yaml","nbib-to-bibtex"],
  "nbib-to-html": ["nbib-to-markdown","nbib-to-yaml","nbib-to-bibtex"],
  "nbib-to-yaml": ["nbib-to-markdown","nbib-to-html","nbib-to-bibtex"],
  "csl-json-to-markdown": ["csl-json-to-html","csl-json-to-yaml","csl-json-to-bibtex"],
  "csl-json-to-html": ["csl-json-to-markdown","csl-json-to-yaml","csl-json-to-bibtex"],
  "csl-json-to-yaml": ["csl-json-to-markdown","csl-json-to-html","csl-json-to-bibtex"],
  "endnote-xml-to-markdown": ["endnote-xml-to-html","endnote-xml-to-yaml","endnote-xml-to-bibtex"],
  "endnote-xml-to-html": ["endnote-xml-to-markdown","endnote-xml-to-yaml","endnote-xml-to-bibtex"],
  "endnote-xml-to-yaml": ["endnote-xml-to-markdown","endnote-xml-to-html","endnote-xml-to-bibtex"],

  // ===== EndNote ENW (Refer/tagged) =====
  "enw-to-bibtex": ["bibtex-to-enw","enw-to-ris","enw-to-csv"],
  "enw-to-ris": ["ris-to-enw","enw-to-bibtex","enw-to-csv"],
  "enw-to-nbib": ["nbib-to-enw","enw-to-ris","enw-to-bibtex"],
  "enw-to-endnote-xml": ["endnote-xml-to-enw","enw-to-ris","enw-to-bibtex"],
  "enw-to-csl-json": ["csl-json-to-enw","enw-to-ris","enw-to-bibtex"],
  "enw-to-csv": ["csv-to-enw","enw-to-bibtex","enw-to-xlsx"],
  "enw-to-xlsx": ["enw-to-csv","enw-to-bibtex","ris-to-xlsx"],
  "enw-to-markdown": ["enw-to-html","enw-to-yaml","enw-to-bibtex"],
  "enw-to-html": ["enw-to-markdown","enw-to-yaml","enw-to-bibtex"],
  "enw-to-yaml": ["enw-to-markdown","enw-to-html","enw-to-bibtex"],
  "bibtex-to-enw": ["enw-to-bibtex","bibtex-to-ris","bibtex-to-csv"],
  "ris-to-enw": ["enw-to-ris","ris-to-bibtex","ris-to-csv"],
  "nbib-to-enw": ["enw-to-nbib","nbib-to-bibtex","nbib-to-ris"],
  "endnote-xml-to-enw": ["enw-to-endnote-xml","endnote-xml-to-bibtex","endnote-xml-to-ris"],
  "csl-json-to-enw": ["enw-to-csl-json","csl-json-to-bibtex","csl-json-to-ris"],
  "csv-to-enw": ["enw-to-csv","csv-to-bibtex","csv-to-ris"],

  // ===== Web of Science / ISI tagged export (import-only) =====
  "wos-to-bibtex": ["wos-to-ris","wos-to-csv","wos-to-endnote-xml"],
  "wos-to-ris": ["wos-to-bibtex","wos-to-csv","wos-to-endnote-xml"],
  "wos-to-nbib": ["wos-to-ris","wos-to-bibtex","wos-to-csv"],
  "wos-to-endnote-xml": ["wos-to-ris","wos-to-bibtex","wos-to-csv"],
  "wos-to-csl-json": ["wos-to-ris","wos-to-bibtex","wos-to-csv"],
  "wos-to-csv": ["wos-to-xlsx","wos-to-bibtex","wos-to-ris"],
  "wos-to-xlsx": ["wos-to-csv","wos-to-bibtex","wos-to-ris"],
  "wos-to-markdown": ["wos-to-html","wos-to-yaml","wos-to-bibtex"],
  "wos-to-html": ["wos-to-markdown","wos-to-yaml","wos-to-bibtex"],
  "wos-to-yaml": ["wos-to-markdown","wos-to-html","wos-to-bibtex"],

  // ===== RefWorks tagged format =====
  "refworks-to-bibtex": ["bibtex-to-refworks","refworks-to-ris","refworks-to-csv"],
  "refworks-to-ris": ["ris-to-refworks","refworks-to-bibtex","refworks-to-csv"],
  "refworks-to-nbib": ["nbib-to-refworks","refworks-to-ris","refworks-to-bibtex"],
  "refworks-to-endnote-xml": ["endnote-xml-to-refworks","refworks-to-ris","refworks-to-bibtex"],
  "refworks-to-csl-json": ["csl-json-to-refworks","refworks-to-ris","refworks-to-bibtex"],
  "refworks-to-csv": ["csv-to-refworks","refworks-to-bibtex","refworks-to-xlsx"],
  "refworks-to-xlsx": ["refworks-to-csv","refworks-to-bibtex","ris-to-xlsx"],
  "refworks-to-markdown": ["refworks-to-html","refworks-to-yaml","refworks-to-bibtex"],
  "refworks-to-html": ["refworks-to-markdown","refworks-to-yaml","refworks-to-bibtex"],
  "refworks-to-yaml": ["refworks-to-markdown","refworks-to-html","refworks-to-bibtex"],
  "bibtex-to-refworks": ["refworks-to-bibtex","bibtex-to-ris","bibtex-to-csv"],
  "ris-to-refworks": ["refworks-to-ris","ris-to-bibtex","ris-to-csv"],
  "nbib-to-refworks": ["refworks-to-nbib","nbib-to-bibtex","nbib-to-ris"],
  "endnote-xml-to-refworks": ["refworks-to-endnote-xml","endnote-xml-to-bibtex","endnote-xml-to-ris"],
  "csl-json-to-refworks": ["refworks-to-csl-json","csl-json-to-bibtex","csl-json-to-ris"],
  "csv-to-refworks": ["refworks-to-csv","csv-to-bibtex","csv-to-ris"],

  // ===== MODS XML (Library of Congress) =====
  "mods-to-bibtex": ["bibtex-to-mods","mods-to-ris","mods-to-csv"],
  "mods-to-ris": ["ris-to-mods","mods-to-bibtex","mods-to-csv"],
  "mods-to-nbib": ["nbib-to-mods","mods-to-ris","mods-to-bibtex"],
  "mods-to-endnote-xml": ["endnote-xml-to-mods","mods-to-ris","mods-to-bibtex"],
  "mods-to-csl-json": ["csl-json-to-mods","mods-to-ris","mods-to-bibtex"],
  "mods-to-csv": ["csv-to-mods","mods-to-bibtex","mods-to-xlsx"],
  "mods-to-xlsx": ["mods-to-csv","mods-to-bibtex","ris-to-xlsx"],
  "mods-to-markdown": ["mods-to-html","mods-to-yaml","mods-to-bibtex"],
  "mods-to-html": ["mods-to-markdown","mods-to-yaml","mods-to-bibtex"],
  "mods-to-yaml": ["mods-to-markdown","mods-to-html","mods-to-bibtex"],
  "bibtex-to-mods": ["mods-to-bibtex","bibtex-to-ris","bibtex-to-csv"],
  "ris-to-mods": ["mods-to-ris","ris-to-bibtex","ris-to-csv"],
  "nbib-to-mods": ["mods-to-nbib","nbib-to-bibtex","nbib-to-ris"],
  "endnote-xml-to-mods": ["mods-to-endnote-xml","endnote-xml-to-bibtex","endnote-xml-to-ris"],
  "csl-json-to-mods": ["mods-to-csl-json","csl-json-to-bibtex","csl-json-to-ris"],
  "csv-to-mods": ["mods-to-csv","csv-to-bibtex","csv-to-ris"],

  // ===== MARCXML (MARC21 slim, library catalogs; import-only) =====
  "marcxml-to-bibtex": ["marcxml-to-ris","marcxml-to-csv","marcxml-to-endnote-xml"],
  "marcxml-to-ris": ["marcxml-to-bibtex","marcxml-to-csv","marcxml-to-endnote-xml"],
  "marcxml-to-nbib": ["marcxml-to-ris","marcxml-to-bibtex","marcxml-to-csv"],
  "marcxml-to-endnote-xml": ["marcxml-to-ris","marcxml-to-bibtex","marcxml-to-csv"],
  "marcxml-to-csl-json": ["marcxml-to-ris","marcxml-to-bibtex","marcxml-to-csv"],
  "marcxml-to-csv": ["marcxml-to-xlsx","marcxml-to-bibtex","marcxml-to-ris"],
  "marcxml-to-xlsx": ["marcxml-to-csv","marcxml-to-bibtex","marcxml-to-ris"],
  "marcxml-to-markdown": ["marcxml-to-html","marcxml-to-yaml","marcxml-to-bibtex"],
  "marcxml-to-html": ["marcxml-to-markdown","marcxml-to-yaml","marcxml-to-bibtex"],
  "marcxml-to-yaml": ["marcxml-to-markdown","marcxml-to-html","marcxml-to-bibtex"],

  // ===== Image format matrix gap fills =====
  "svg-to-webp": ["svg-to-png","svg-to-jpg","png-to-webp"],
  "gif-to-webp": ["gif-to-png","gif-to-jpg","gif-to-bmp"],
  "bmp-to-webp": ["bmp-to-png","bmp-to-jpg","bmp-to-gif"],
  "ico-to-webp": ["ico-to-png","ico-to-jpg","png-to-ico"],
  "webp-to-gif": ["webp-to-png","webp-to-jpg","webp-to-bmp"],
  "avif-to-gif": ["avif-to-png","avif-to-jpg","avif-to-bmp"],
  "bmp-to-gif": ["bmp-to-png","bmp-to-webp","bmp-to-jpg"],
  "webp-to-bmp": ["webp-to-png","webp-to-gif","webp-to-jpg"],
  "gif-to-bmp": ["gif-to-png","gif-to-webp","gif-to-jpg"],
  "avif-to-bmp": ["avif-to-png","avif-to-gif","avif-to-jpg"],
  "gif-to-avif": ["gif-to-webp","gif-to-png","avif-to-gif"],
  "bmp-to-avif": ["bmp-to-webp","bmp-to-png","avif-to-bmp"],
  "svg-to-avif": ["svg-to-webp","svg-to-png","svg-to-gif"],
  "ico-to-avif": ["ico-to-webp","ico-to-png","ico-to-gif"],
  "svg-to-gif": ["svg-to-png","svg-to-webp","svg-to-bmp"],
  "ico-to-gif": ["ico-to-png","ico-to-webp","ico-to-bmp"],
  "svg-to-bmp": ["svg-to-png","svg-to-webp","svg-to-gif"],
  "ico-to-bmp": ["ico-to-png","ico-to-webp","ico-to-gif"],
  "tiff-to-webp": ["tiff-to-png","tiff-to-jpg","tiff-to-pdf"],

  // ===== Tabular hub gap fills =====
  "markdown-table-to-html-table": ["html-table-to-markdown-table","markdown-table-to-csv","markdown-table-to-json"],
  "html-table-to-markdown-table": ["markdown-table-to-html-table","html-table-to-csv","html-table-to-json"],
  "markdown-table-to-json": ["json-to-markdown-table","markdown-table-to-csv","markdown-table-to-xlsx"],
  "json-to-markdown-table": ["markdown-table-to-json","json-to-csv","json-to-html-table"],
  "html-table-to-json": ["json-to-html-table","html-table-to-csv","html-table-to-xlsx"],
  "json-to-html-table": ["html-table-to-json","json-to-csv","json-to-markdown-table"],
  "markdown-table-to-xlsx": ["markdown-table-to-csv","markdown-table-to-json","xlsx-to-markdown-table"],
  "html-table-to-xlsx": ["html-table-to-csv","html-table-to-json","xlsx-to-html-table"],
  "xlsx-to-markdown-table": ["xlsx-to-csv","xlsx-to-json","markdown-table-to-xlsx"],
  "xlsx-to-html-table": ["xlsx-to-csv","xlsx-to-json","html-table-to-xlsx"],

  // ===== Spreadsheet -> citation bridge =====
  "xlsx-to-ris": ["xlsx-to-bibtex","csv-to-ris","ods-to-ris"],
  "xlsx-to-bibtex": ["xlsx-to-ris","csv-to-bibtex","ods-to-bibtex"],
  "xlsx-to-csl-json": ["xlsx-to-ris","xlsx-to-bibtex","csv-to-ris"],
  "xlsx-to-endnote-xml": ["xlsx-to-ris","xlsx-to-bibtex","csv-to-ris"],
  "xlsx-to-nbib": ["xlsx-to-ris","xlsx-to-bibtex","nbib-to-ris"],
  "ods-to-ris": ["ods-to-bibtex","xlsx-to-ris","csv-to-ris"],
  "ods-to-bibtex": ["ods-to-ris","xlsx-to-bibtex","csv-to-bibtex"],
  "ods-to-csl-json": ["ods-to-ris","ods-to-bibtex","xlsx-to-csl-json"],
  "ods-to-endnote-xml": ["ods-to-ris","ods-to-bibtex","xlsx-to-endnote-xml"],
  "ods-to-nbib": ["ods-to-ris","ods-to-bibtex","xlsx-to-nbib"],

  // ===== Config serialization cross-matrix =====
  "yaml-to-xml": ["xml-to-yaml","yaml-to-json","yaml-to-toml"],
  "xml-to-yaml": ["yaml-to-xml","xml-to-json","xml-to-toml"],
  "toml-to-xml": ["xml-to-toml","toml-to-json","toml-to-yaml"],
  "xml-to-toml": ["toml-to-xml","xml-to-json","xml-to-yaml"],
  "json5-to-yaml": ["json5-to-json","json5-to-xml","json5-to-toml"],
  "json5-to-xml": ["json5-to-json","json5-to-yaml","json5-to-toml"],
  "json5-to-toml": ["json5-to-json","json5-to-yaml","json5-to-xml"],
  "ini-to-yaml": ["ini-to-json","ini-to-xml","ini-to-toml"],
  "ini-to-xml": ["ini-to-json","ini-to-yaml","ini-to-toml"],
  "ini-to-toml": ["ini-to-json","ini-to-yaml","ini-to-xml"],

  // ===== Subtitle transcripts + matrix gaps =====
  "srt-to-txt": ["vtt-to-txt", "srt-to-vtt", "srt-to-ass"],
  "vtt-to-txt": ["srt-to-txt", "vtt-to-srt", "vtt-to-ass"],
  "ass-to-txt": ["ass-to-srt", "ass-to-vtt", "srt-to-txt"],
  "sbv-to-txt": ["sbv-to-srt", "sbv-to-vtt", "srt-to-txt"],
  "lrc-to-txt": ["lrc-to-srt", "lrc-to-vtt", "srt-to-txt"],
  "vtt-to-sbv": ["sbv-to-vtt", "vtt-to-srt", "vtt-to-ass"],
  "ass-to-sbv": ["sbv-to-ass", "ass-to-srt", "ass-to-vtt"],
  "sbv-to-vtt": ["vtt-to-sbv", "sbv-to-srt", "sbv-to-ass"],
  "sbv-to-ass": ["ass-to-sbv", "sbv-to-srt", "sbv-to-vtt"],

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
