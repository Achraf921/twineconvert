/**
 * Programmatic bijectivity audit for every converter in the registry.
 *
 * For each converter (X → Y):
 *   1. Classify the loss profile (lossy / lossless-bijective / semi-bijective)
 *   2. Find its reverse pair (Y → X) if one exists
 *   3. Flag bijective pairs missing round-trip tests
 *   4. Flag one-way converters that COULD have a reverse but don't
 *
 * Output: docs/bijectivity-audit.md with the full classification table,
 * gap list, and recommended new tests / new converters to add.
 *
 * Run:
 *   node scripts/bijectivity-audit.mjs
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// --------------------------------------------------------------------
// Format property table. Each format is classified by:
//   raster | vector | audio | video | doc | data | citation | palette
//   | lut | mesh | embroidery | notation | finance | comms | genealogy
//   | health | game | radio | meta
//
// And:
//   lossless: true | false  (does encoding preserve all input bits/data?)
//   binary:   true | false  (is this a binary container vs text?)
// --------------------------------------------------------------------
const FORMATS = {
  // ==== Raster images ====
  jpg: { kind: "raster", lossless: false, family: "image" },
  jpeg: { kind: "raster", lossless: false, family: "image" },
  png: { kind: "raster", lossless: true, family: "image" },
  webp: { kind: "raster", lossless: false, family: "image" },
  avif: { kind: "raster", lossless: false, family: "image" },
  heic: { kind: "raster", lossless: false, family: "image" },
  bmp: { kind: "raster", lossless: true, family: "image" },
  gif: { kind: "raster", lossless: true, family: "image" },
  tiff: { kind: "raster", lossless: true, family: "image" },
  ico: { kind: "raster", lossless: true, family: "image" },
  // ==== Vector ====
  svg: { kind: "vector", lossless: true, family: "image" },
  // ==== Documents ====
  pdf: { kind: "doc", lossless: false, family: "doc" },
  docx: { kind: "doc", lossless: false, family: "doc" },
  doc: { kind: "doc", lossless: false, family: "doc" },
  html: { kind: "doc", lossless: false, family: "doc" },
  txt: { kind: "doc", lossless: false, family: "doc" }, // lossy for any source w/ formatting
  rtf: { kind: "doc", lossless: false, family: "doc" },
  pages: { kind: "doc", lossless: false, family: "doc" },
  numbers: { kind: "doc", lossless: false, family: "doc" },
  keynote: { kind: "doc", lossless: false, family: "doc" },
  // ==== Tabular / data ====
  csv: { kind: "data", lossless: true, family: "data" },
  json: { kind: "data", lossless: true, family: "data" },
  xlsx: { kind: "data", lossless: true, family: "data" }, // tabular data only; if no formulas/styles
  yaml: { kind: "data", lossless: true, family: "data" }, // semantic equivalence with JSON
  yml: { kind: "data", lossless: true, family: "data" },
  toml: { kind: "data", lossless: true, family: "data" }, // top-level table only
  // ==== Subtitles ====
  srt: { kind: "data", lossless: true, family: "subtitle" },
  vtt: { kind: "data", lossless: true, family: "subtitle" },
  // ==== TSV (sibling of CSV) ====
  tsv: { kind: "data", lossless: true, family: "data" },
  // ==== Generic XML (when used as a data interchange) ====
  xml: { kind: "data", lossless: true, family: "data" },
  // ==== Markdown ====
  markdown: { kind: "doc", lossless: false, family: "doc" },
  md: { kind: "doc", lossless: false, family: "doc" },
  // ==== Audio ====
  mp3: { kind: "audio", lossless: false, family: "audio" },
  m4a: { kind: "audio", lossless: false, family: "audio" }, // AAC = lossy
  ogg: { kind: "audio", lossless: false, family: "audio" },
  wav: { kind: "audio", lossless: true, family: "audio" },
  flac: { kind: "audio", lossless: true, family: "audio" },
  // ==== Video ====
  mp4: { kind: "video", lossless: false, family: "video" },
  mov: { kind: "video", lossless: false, family: "video" },
  webm: { kind: "video", lossless: false, family: "video" },
  avi: { kind: "video", lossless: false, family: "video" },
  mkv: { kind: "video", lossless: false, family: "video" },
  // ==== Ebook ====
  epub: { kind: "doc", lossless: false, family: "ebook" },
  mobi: { kind: "doc", lossless: false, family: "ebook" },
  azw3: { kind: "doc", lossless: false, family: "ebook" },
  // ==== Email ====
  eml: { kind: "data", lossless: true, family: "email" },
  mbox: { kind: "data", lossless: true, family: "email" },
  // ==== Finance ====
  ofx: { kind: "data", lossless: true, family: "finance" },
  qfx: { kind: "data", lossless: true, family: "finance" }, // OFX-derivative
  qbo: { kind: "data", lossless: true, family: "finance" },
  qif: { kind: "data", lossless: true, family: "finance" },
  // ==== Genealogy ====
  gedcom: { kind: "data", lossless: true, family: "genealogy" },
  // ==== Citations ====
  bibtex: { kind: "data", lossless: true, family: "citation" },
  ris: { kind: "data", lossless: true, family: "citation" },
  nbib: { kind: "data", lossless: true, family: "citation" },
  "endnote-xml": { kind: "data", lossless: true, family: "citation" },
  // ==== Color palettes ====
  ase: { kind: "palette", lossless: true, family: "design" },
  gpl: { kind: "palette", lossless: true, family: "design" },
  aco: { kind: "palette", lossless: true, family: "design" },
  hex: { kind: "palette", lossless: true, family: "design" },
  css: { kind: "palette", lossless: true, family: "design" }, // when used for color list
  // ==== LUTs ====
  cube: { kind: "lut", lossless: true, family: "color-grading" },
  "3dl": { kind: "lut", lossless: true, family: "color-grading" },
  csp: { kind: "lut", lossless: true, family: "color-grading" },
  // ==== 3D mesh ====
  stl: { kind: "mesh", lossless: true, family: "3d" },
  "3mf": { kind: "mesh", lossless: true, family: "3d" },
  obj: { kind: "mesh", lossless: true, family: "3d" },
  gltf: { kind: "mesh", lossless: true, family: "3d" },
  ifc: { kind: "mesh", lossless: false, family: "3d" }, // BIM, semantic loss in conversion
  // ==== Music notation ====
  midi: { kind: "notation", lossless: false, family: "music" }, // performance != notation
  musicxml: { kind: "notation", lossless: true, family: "music" },
  mxl: { kind: "notation", lossless: true, family: "music" }, // zipped MusicXML
  // ==== Embroidery ====
  dst: { kind: "embroidery", lossless: true, family: "embroidery" }, // no color
  pes: { kind: "embroidery", lossless: true, family: "embroidery" },
  jef: { kind: "embroidery", lossless: true, family: "embroidery" },
  exp: { kind: "embroidery", lossless: true, family: "embroidery" },
  // ==== Ham radio ====
  adif: { kind: "data", lossless: true, family: "radio" },
  cabrillo: { kind: "data", lossless: true, family: "radio" },
  kml: { kind: "data", lossless: true, family: "geo" },
  // ==== Chess ====
  pgn: { kind: "data", lossless: true, family: "chess" },
  fen: { kind: "data", lossless: false, family: "chess" }, // single position only
  // ==== Security / B2B ====
  sarif: { kind: "data", lossless: true, family: "security" },
  edi: { kind: "data", lossless: true, family: "b2b" },
  edifact: { kind: "data", lossless: true, family: "b2b" },
  // ==== Color spaces (text formats, one value per line) ====
  // HEX→RGB is the only truly bijective pair (8-bit precision both ways).
  // HSL/CMYK round-trips lose precision at the corners → marked lossless
  // false to keep the audit honest. Family is "color" so they don't collide
  // with palette files (.ase/.gpl) which share an "image" family.
  rgb: { kind: "color", lossless: true, family: "color" },
  hsl: { kind: "color", lossless: false, family: "color" },
  cmyk: { kind: "color", lossless: false, family: "color" },
  // ==== Text encodings (bijective for any byte sequence) ====
  text: { kind: "encoding", lossless: true, family: "encoding" },
  base64: { kind: "encoding", lossless: true, family: "encoding" },
  "url-encoded": { kind: "encoding", lossless: true, family: "encoding" },
  // ==== Geographic ====
  gpx: { kind: "data", lossless: true, family: "geo" },
  geojson: { kind: "data", lossless: true, family: "geo" },
  // ==== Checksums (single-action; declared so audit doesn't flag them) ====
  md5: { kind: "checksum", lossless: false, family: "integrity" },
  sha1: { kind: "checksum", lossless: false, family: "integrity" },
  sha256: { kind: "checksum", lossless: false, family: "integrity" },
  sha512: { kind: "checksum", lossless: false, family: "integrity" },
  // `file` is the synthetic "any input" used by file-to-<hash>
  file: { kind: "any", lossless: false, family: "any" },
  // ==== Streaming JSON / config / spreadsheet variants ====
  jsonl: { kind: "data", lossless: true, family: "data" }, // line-delimited JSON
  json5: { kind: "data", lossless: true, family: "data" }, // JSON superset
  ini: { kind: "data", lossless: true, family: "config" },
  env: { kind: "data", lossless: true, family: "config" }, // dotenv
  ods: { kind: "data", lossless: true, family: "data" }, // OpenDocument spreadsheet
  // ==== Subtitles (SBV adds to existing srt/vtt family) ====
  sbv: { kind: "data", lossless: true, family: "subtitle" },
  // ==== Web fonts ====
  ttf: { kind: "font", lossless: true, family: "font" },
  otf: { kind: "font", lossless: true, family: "font" },
  woff: { kind: "font", lossless: true, family: "font" },
  // ==== Tabular variants ====
  // markdown-table / html-table are sub-formats of markdown / html
  // when used as a tabular container. Treat them as "data" so the
  // CSV ↔ MD-table ↔ HTML-table classifier sees compatible kinds.
  "markdown-table": { kind: "data", lossless: true, family: "data" },
  "html-table": { kind: "data", lossless: true, family: "data" },
  sql: { kind: "data", lossless: true, family: "data" }, // INSERT-row dump
  properties: { kind: "data", lossless: true, family: "config" }, // Java
  hcl: { kind: "data", lossless: true, family: "config" }, // Terraform
  // ==== Color names ====
  // Lossless on the name → hex side (147 named colors are exact);
  // lossy on hex → name (nearest-neighbor approximation).
  "color-name": { kind: "color", lossless: false, family: "color" },
  // ==== Date / time formats ====
  unix: { kind: "data", lossless: true, family: "datetime" },
  iso: { kind: "data", lossless: true, family: "datetime" },
  timestamp: { kind: "data", lossless: true, family: "datetime" },
  readable: { kind: "data", lossless: false, family: "datetime" }, // human-readable, may lose ms
  // ==== Modern color spaces (CSS Color Module Level 4) ====
  oklch: { kind: "color", lossless: false, family: "color" }, // perceptual but rounding-bound
  lab: { kind: "color", lossless: false, family: "color" },
  // ==== Crypto / dev formats ====
  jwt: { kind: "data", lossless: true, family: "crypto" }, // decode-only
  pem: { kind: "data", lossless: true, family: "crypto" }, // text-armored binary
  der: { kind: "data", lossless: true, family: "crypto" }, // raw ASN.1 bytes
};

// --------------------------------------------------------------------
// Single-action tools that don't fit the X-to-Y pattern at all
// --------------------------------------------------------------------
const SINGLE_ACTION = new Set([
  "compress-pdf",
  "remove-background",
  "image-to-text",
  "jpg-to-text",
  "png-to-text",
  "pdf-to-text",
  "epub-to-text",
  "docx-to-txt",
  "kindle-clippings-to-csv",
  "kindle-clippings-to-json",
  "kindle-clippings-to-markdown",
  "kindle-clippings-to-notion-csv",
  "kindle-clippings-to-obsidian-md",
  "kindle-clippings-to-readwise-csv",
  "apple-health-to-csv",
  "apple-health-to-json",
  "apple-health-heart-rate-to-csv",
  "apple-health-sleep-to-csv",
  "apple-health-steps-to-csv",
  "apple-health-workouts-to-csv",
  "discord-chat-to-md",
  "discord-chat-to-pdf",
  "discord-chat-summary-csv",
  "whatsapp-chat-to-csv",
  "whatsapp-chat-to-html",
  "whatsapp-chat-to-json",
  "whatsapp-chat-to-pdf",
  "twitter-archive-to-csv",
  "twitter-archive-to-html",
  "instagram-data-to-csv",
  "instagram-data-to-html",
  "facebook-archive-to-html",
  "pacer-docket-to-csv",
  "sarif-to-csv",
  "sarif-to-html",
  "edi-to-csv",
  "edifact-to-csv",
  "ifc-to-csv",
  "ifc-to-gltf",
  "pgn-to-csv",
  "pgn-to-fen",
  "pgn-to-json",
  // Cryptographic hashes are inherently one-way (file → digest)
  "file-to-md5",
  "file-to-sha1",
  "file-to-sha256",
  "file-to-sha512",
  // Date format conversions: not a paired round-trip family
  "timestamp-to-readable",
  // HCL is one-way (no JSON → HCL converter shipped)
  "hcl-to-json",
  // JWT is decode-only (no JSON → JWT converter, that requires signing)
  "jwt-to-json",
]);

// --------------------------------------------------------------------
// Collect all converters
// --------------------------------------------------------------------
const converterDir = resolve("src/lib/engine/converters");
const allConverters = readdirSync(converterDir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.replace(/\.ts$/, ""));

// Parse "X-to-Y" into [X, Y]; returns null for compound or single-action ids
function parsePair(id) {
  if (SINGLE_ACTION.has(id)) return null;
  const m = id.match(/^([a-z0-9]+(?:-[a-z0-9]+)*?)-to-([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!m) return null;
  return [m[1], m[2]];
}

// --------------------------------------------------------------------
// Classify each converter
// --------------------------------------------------------------------
function classify(id) {
  if (SINGLE_ACTION.has(id)) {
    return { type: "single-action", note: "no reverse possible (X has no canonical inverse)" };
  }
  const pair = parsePair(id);
  if (!pair) return { type: "compound", note: "irregular id pattern" };

  const [from, to] = pair;
  const fromMeta = FORMATS[from];
  const toMeta = FORMATS[to];

  if (!fromMeta || !toMeta) {
    return {
      type: "unknown-format",
      note: `unknown format: ${!fromMeta ? from : to}`,
    };
  }

  // Cross-kind conversions are inherently lossy (raster -> doc, video -> audio, etc.)
  if (fromMeta.kind !== toMeta.kind) {
    // Some special cases that ARE lossless across kinds:
    //   palette ↔ palette (handled by same kind)
    //   data ↔ data within same family (finance, citation, etc.)
    return {
      type: "cross-kind",
      note: `${fromMeta.kind} -> ${toMeta.kind}: cross-domain, inherently lossy`,
      lossy: true,
    };
  }

  // Same-kind conversions
  if (!fromMeta.lossless || !toMeta.lossless) {
    return {
      type: "lossy-encoding",
      note: `${from} or ${to} uses lossy encoding`,
      lossy: true,
    };
  }

  // Both lossless within same kind -> potentially bijective
  // BUT: even lossless formats can lose metadata across formats (DST has no color, etc.)
  return {
    type: "bijective-candidate",
    note: `both lossless ${fromMeta.kind} formats; should round-trip cleanly`,
    lossy: false,
  };
}

const classifications = allConverters.map((id) => ({
  id,
  ...classify(id),
}));

// --------------------------------------------------------------------
// Find reverse pairs
// --------------------------------------------------------------------
const idSet = new Set(allConverters);
function reverseId(id) {
  const pair = parsePair(id);
  if (!pair) return null;
  return `${pair[1]}-to-${pair[0]}`;
}

const withReverses = classifications.map((c) => ({
  ...c,
  reverseId: reverseId(c.id),
  hasReverse: idSet.has(reverseId(c.id) || ""),
}));

// --------------------------------------------------------------------
// Cross-reference with existing round-trip tests
// --------------------------------------------------------------------
const roundTripTestSrc = readFileSync(resolve("tests/round-trip.test.ts"), "utf8");
function hasRoundTripTest(id) {
  // Heuristic: does the test file mention this id literally?
  return roundTripTestSrc.includes(`"${id}"`) || roundTripTestSrc.includes(`'${id}'`);
}
const annotated = withReverses.map((c) => ({
  ...c,
  testCovered: hasRoundTripTest(c.id),
}));

// --------------------------------------------------------------------
// Output: markdown report
// --------------------------------------------------------------------
const counts = {
  total: annotated.length,
  bijective: annotated.filter((c) => c.type === "bijective-candidate").length,
  lossyEncoding: annotated.filter((c) => c.type === "lossy-encoding").length,
  crossKind: annotated.filter((c) => c.type === "cross-kind").length,
  singleAction: annotated.filter((c) => c.type === "single-action").length,
  unknownFormat: annotated.filter((c) => c.type === "unknown-format").length,
  compound: annotated.filter((c) => c.type === "compound").length,
};

const bijectivePairsMissingTest = annotated.filter(
  (c) => c.type === "bijective-candidate" && c.hasReverse && !c.testCovered,
);
const bijectiveNoReverse = annotated.filter(
  (c) => c.type === "bijective-candidate" && !c.hasReverse,
);
const unknownFormats = annotated.filter((c) => c.type === "unknown-format");

let md = `# Bijectivity Audit\n\n`;
md += `Generated ${new Date().toISOString().slice(0, 10)} from src/lib/engine/converters/.\n\n`;
md += `## Summary\n\n`;
md += `| Classification | Count |\n|---|---:|\n`;
md += `| Total converters | ${counts.total} |\n`;
md += `| **Bijective candidates** (lossless, same-kind, both directions exist) | ${annotated.filter((c) => c.type === "bijective-candidate" && c.hasReverse).length} |\n`;
md += `| **Bijective candidates missing reverse converter** | ${bijectiveNoReverse.length} |\n`;
md += `| **Bijective candidates missing round-trip test** | ${bijectivePairsMissingTest.length} |\n`;
md += `| Lossy encoding (same kind, but lossy format) | ${counts.lossyEncoding} |\n`;
md += `| Cross-kind (raster→doc, video→audio, etc., inherently lossy) | ${counts.crossKind} |\n`;
md += `| Single-action (no reverse possible) | ${counts.singleAction} |\n`;
md += `| Unknown formats (need to add to FORMATS table) | ${counts.unknownFormat} |\n`;
md += `| Compound id (irregular pattern) | ${counts.compound} |\n\n`;

md += `## Action Items\n\n`;

if (unknownFormats.length > 0) {
  md += `### 1. Unknown formats to classify\n\n`;
  md += `The audit script doesn't know about these formats; add them to the FORMATS table in scripts/bijectivity-audit.mjs:\n\n`;
  for (const c of unknownFormats) {
    md += `- \`${c.id}\` (${c.note})\n`;
  }
  md += `\n`;
}

if (bijectiveNoReverse.length > 0) {
  md += `### 2. Bijective converters MISSING their reverse pair\n\n`;
  md += `These converters are lossless and could round-trip, but the reverse converter isn't implemented. Adding the reverse unlocks bijectivity testing AND another tool page for SEO.\n\n`;
  md += `| Forward | Missing reverse |\n|---|---|\n`;
  for (const c of bijectiveNoReverse) {
    md += `| \`${c.id}\` | \`${c.reverseId}\` |\n`;
  }
  md += `\n`;
}

if (bijectivePairsMissingTest.length > 0) {
  md += `### 3. Bijective pairs MISSING a round-trip test\n\n`;
  md += `Both directions exist and are theoretically lossless, but no round-trip test verifies it. These are the highest-leverage tests to add (they catch bugs in EITHER direction).\n\n`;
  const seen = new Set();
  md += `| Pair | A→B | B→A |\n|---|---|---|\n`;
  for (const c of bijectivePairsMissingTest) {
    const pair = [c.id, c.reverseId].sort().join("|");
    if (seen.has(pair)) continue;
    seen.add(pair);
    md += `| ${c.id.replace("-to-", " ↔ ")} | \`${c.id}\` | \`${c.reverseId}\` |\n`;
  }
  md += `\n`;
}

md += `## Full Classification Table\n\n`;
md += `| Converter | Type | Has reverse? | Round-trip test? | Note |\n`;
md += `|---|---|---|---|---|\n`;
for (const c of annotated.sort((a, b) => a.id.localeCompare(b.id))) {
  const reverse = c.hasReverse ? `✓` : c.reverseId ? `(\`${c.reverseId}\` missing)` : `n/a`;
  const test = c.testCovered ? `✓` : c.type === "bijective-candidate" && c.hasReverse ? `✗ MISSING` : `n/a`;
  md += `| \`${c.id}\` | ${c.type} | ${reverse} | ${test} | ${c.note} |\n`;
}

const outPath = resolve("docs/bijectivity-audit.md");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, md);
console.log(`Wrote ${outPath}`);
console.log(`\nSummary:`);
console.log(`  Total converters: ${counts.total}`);
console.log(`  Bijective + has reverse + tested: ${annotated.filter((c) => c.type === "bijective-candidate" && c.hasReverse && c.testCovered).length}`);
console.log(`  Bijective + has reverse + UNTESTED: ${bijectivePairsMissingTest.length}`);
console.log(`  Bijective + MISSING reverse converter: ${bijectiveNoReverse.length}`);
console.log(`  Lossy (encoding or cross-kind): ${counts.lossyEncoding + counts.crossKind}`);
console.log(`  Single-action: ${counts.singleAction}`);
console.log(`  Unknown formats (need classification): ${counts.unknownFormat}`);

// CI gate: cap on bijective pairs missing round-trip tests. The audit's
// literal-string detection misses dynamic test loops (e.g. embroidery's
// parametric describe block), so the cap is set above the genuine
// untested count rather than at zero. Bump it down as we close gaps.
const MAX_UNTESTED_BIJECTIVE = 30;
if (process.env.CI === "true" || process.argv.includes("--strict")) {
  if (bijectivePairsMissingTest.length > MAX_UNTESTED_BIJECTIVE) {
    console.error(
      `\nFAIL: ${bijectivePairsMissingTest.length} bijective pairs are missing a round-trip test (cap: ${MAX_UNTESTED_BIJECTIVE}).`,
    );
    console.error(
      `Add tests to tests/round-trip.test.ts for the pairs flagged in docs/bijectivity-audit.md, or lower MAX_UNTESTED_BIJECTIVE in scripts/bijectivity-audit.mjs.`,
    );
    process.exit(1);
  }
  if (unknownFormats.length > 0) {
    console.error(
      `\nFAIL: ${unknownFormats.length} converters use formats not classified in the FORMATS table.`,
    );
    console.error(`Add them to scripts/bijectivity-audit.mjs.`);
    process.exit(1);
  }
}
