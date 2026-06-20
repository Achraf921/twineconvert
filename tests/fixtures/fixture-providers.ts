/**
 * Fixture provider registry.
 *
 * For every converter id we have, a function that produces an input
 * File appropriate for that converter. The function may:
 *   - Return a fixture from text-fixtures.ts (text-based formats)
 *   - Build one programmatically using one of our own writers (formats
 *     where we have a writer that doubles as a fixture generator)
 *   - Return a binary fixture from a committed file (formats where we
 *     can't synthesize one in Node)
 *
 * The unified converter test iterates the registry and looks up each
 * converter's fixture provider. If a provider isn't registered, the
 * test for that converter is marked as skipped with a clear TODO.
 */

import { FIXTURES, fileFromText } from "./text-fixtures";
import {
  fileFromBytes,
  TINY_PNG_BYTES,
  TINY_JPEG_BYTES,
  makeTinyAse,
  makeTinyAco,
  makeTinyDst,
  makeTinyPes,
  makeTinyJef,
  makeTinyExp,
  makeTinyStl,
  makeTinyGlb,
  makeTinyObj,
  makeTinyDicom,
  makeTinyDocx,
  makeTinyXlsx,
  makeTinyCitationXlsx,
  makeTinyCitationOds,
  makeTinyOds,
  makeTinyEpub,
  makeTiny3mf,
  makeTinyMidi,
  makeTinyMxl,
  makeTiny3dl,
  makeTinyCsp,
  makeTinyAppleHealthZip,
  makeTinyTwitterArchiveZip,
  makeTinyInstagramZip,
  makeTinyFacebookZip,
  makeTinyIworkPages,
  makeTinyMsgpack,
  makeTinyCbor,
  makeTinyBencode,
} from "./binary-fixtures";

/** A small, valid citation CSV (real title/author/year/journal columns) for
 *  the csv-to-<style> generator fixtures, which need parseable references. */
const CITATION_CSV_FIXTURE =
  "title,authors,year,journal,volume,pages,doi\n" +
  'A Sample Paper,"Smith, John; Doe, Jane",2024,Nature,123,45-67,10.1038/sample.2024.001\n';

/** A text blob with DOIs, a labelled PMID, and an arXiv id for the extractor fixtures. */
const IDENTIFIER_TEXT_FIXTURE =
  "Smith J. A study. https://doi.org/10.1038/s41586-019-0001-2 (2024). PMID: 30000001.\n" +
  "Doe J. Another. doi:10.1/abc. Preprint arXiv:2401.01234.\n";

/** A BibTeX library containing a duplicate (same DOI) for the dedupe fixture. */
const DUP_BIBTEX_FIXTURE =
  "@article{a1,\n  title={Deep nets},\n  author={Smith, John},\n  year={2024},\n  doi={10.1/x}\n}\n" +
  "@article{a2,\n  title={Deep Nets.},\n  author={Smith, J.},\n  year={2024},\n  doi={10.1/X}\n}\n" +
  "@article{b1,\n  title={Another paper},\n  author={Doe, Jane},\n  year={2023},\n  doi={10.2/y}\n}\n";

/** A RIS library with a duplicate (same DOI) for the dedupe fixture. */
const DUP_RIS_FIXTURE =
  "TY  - JOUR\nTI  - Deep nets\nAU  - Smith, John\nPY  - 2024\nDO  - 10.1/x\nER  -\n" +
  "TY  - JOUR\nTI  - Deep Nets.\nAU  - Smith, J.\nPY  - 2024\nDO  - 10.1/X\nER  -\n" +
  "TY  - JOUR\nTI  - Another paper\nAU  - Doe, Jane\nPY  - 2023\nDO  - 10.2/y\nER  -\n";

/** A citation CSV with a duplicate (same DOI) row for the dedupe fixture. */
const DUP_CSV_FIXTURE =
  "title,authors,year,journal,doi\n" +
  "Deep nets,Smith J,2024,Nature,10.1/x\n" +
  "Deep Nets.,Smith John,2024,Nature,10.1/X\n" +
  "Another paper,Doe J,2023,Cell,10.2/y\n";

/** A CSL-JSON array with a duplicate (same DOI) for the dedupe fixture. */
const DUP_CSL_JSON_FIXTURE = JSON.stringify([
  { id: "a1", type: "article-journal", title: "Deep nets", DOI: "10.1/x", issued: { "date-parts": [[2024]] } },
  { id: "a2", type: "article-journal", title: "Deep Nets.", DOI: "10.1/X", issued: { "date-parts": [[2024]] } },
  { id: "b1", type: "article-journal", title: "Another paper", DOI: "10.2/y", issued: { "date-parts": [[2023]] } },
]);

/** An EndNote .enw library with a duplicate (same DOI) for the dedupe fixture. */
const DUP_ENW_FIXTURE =
  "%0 Journal Article\n%T Deep nets\n%A Smith, John\n%D 2024\n%R 10.1/x\n\n" +
  "%0 Journal Article\n%T Deep Nets.\n%A Smith, J.\n%D 2024\n%R 10.1/X\n\n" +
  "%0 Journal Article\n%T Another paper\n%A Doe, Jane\n%D 2023\n%R 10.2/y\n";

/** A small plain-text reference list (APA + numbered entries) for the
 *  references-to-<style> generator fixtures. */
const REFERENCE_LIST_FIXTURE =
  "Smith, J., & Doe, J. (2024). A study of deep nets. Nature Methods, 12(3), 45-67. https://doi.org/10.1038/x\n" +
  "Brown, A. (2023). A Book on Things. MIT Press.\n";

export type FixtureProvider = () => Promise<File>;

/** Whether the converter requires a real browser environment to test
 *  (Canvas, Image decode, FFmpeg.wasm Worker, web-ifc WASM, etc.).
 *  These are skipped in the Node test suite and run in the browser test
 *  suite instead. */
export type Environment = "node" | "browser";

interface FixtureSpec {
  /** Function that produces a fixture File for this converter. */
  provider: FixtureProvider;
  /** Where the test can run. Most converters work in either; some only
   *  in real browser. */
  env: Environment;
}

// ============================================================================
// Programmatic fixture builders (use our own writers, bug in writer ==
// fixture creation failure == loud CI break)
// ============================================================================

const makePngFixture = (): Promise<File> =>
  Promise.resolve(fileFromBytes("test.png", TINY_PNG_BYTES, "image/png"));

const makeJpegFixture = (): Promise<File> =>
  Promise.resolve(fileFromBytes("test.jpg", TINY_JPEG_BYTES, "image/jpeg"));

const makeAseFixture = async (): Promise<File> =>
  fileFromBytes("test.ase", makeTinyAse(), "application/octet-stream");

const makeAcoFixture = async (): Promise<File> =>
  fileFromBytes("test.aco", makeTinyAco(), "application/octet-stream");

const makeDstFixture = async (): Promise<File> =>
  fileFromBytes("test.dst", makeTinyDst(), "application/x-tajima-dst");

const makePesFixture = async (): Promise<File> =>
  fileFromBytes("test.pes", makeTinyPes(), "application/x-pes");

const makeJefFixture = async (): Promise<File> =>
  fileFromBytes("test.jef", makeTinyJef(), "application/x-jef");

const makeExpFixture = async (): Promise<File> =>
  fileFromBytes("test.exp", makeTinyExp(), "application/x-exp");

const makeStlFixture = async (): Promise<File> =>
  fileFromBytes("cube.stl", makeTinyStl(), "model/stl");

const text = (name: string, content: string, mime = "text/plain") =>
  Promise.resolve(fileFromText(name, content, mime));

const F = FIXTURES;

// A small but complete citation CSV (our own writer's column layout) used
// to drive the csv -> {csl-json, endnote-xml, nbib} citation-hub routes.
const CITATION_CSV =
  "id,type,title,authors,year,journal,volume,issue,pages,doi\n" +
  'smith2021,article,"A Study of Things","Smith, John; Doe, Jane","2021","Nature","12","3","45-67","10.1000/xyz"';

// A real-shaped EndNote ENW (Refer/tagged) export for the enw -> X routes.
const ENW_SAMPLE =
  "%0 Journal Article\n%A Smith, John\n%A Doe, Jane\n%T Vestibular function in aging adults\n" +
  "%J Journal of Neurology\n%D 2006\n%V 253\n%N 11\n%P 1499-1508\n%@ 1432-1459\n" +
  "%R 10.1007/s00415-006-0001-x\n%K balance\n%X We measured vestibular thresholds.\n%F smith2006\n";

// A real-shaped MARCXML (MARC21 slim) catalog record for marcxml -> X.
const MARC_SAMPLE =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<collection xmlns="http://www.loc.gov/MARC21/slim">\n' +
  '  <record>\n' +
  '    <leader>00000nab a2200000 a 4500</leader>\n' +
  '    <datafield tag="100" ind1="1" ind2=" "><subfield code="a">Smith, John,</subfield><subfield code="d">1970-</subfield></datafield>\n' +
  '    <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Vestibular function in aging adults /</subfield><subfield code="c">John Smith and Jane Doe.</subfield></datafield>\n' +
  '    <datafield tag="700" ind1="1" ind2=" "><subfield code="a">Doe, Jane.</subfield></datafield>\n' +
  '    <datafield tag="022" ind1=" " ind2=" "><subfield code="a">1432-1459</subfield></datafield>\n' +
  '    <datafield tag="024" ind1="7" ind2=" "><subfield code="a">10.1007/s00415-006-0001-x</subfield><subfield code="2">doi</subfield></datafield>\n' +
  '    <datafield tag="773" ind1="0" ind2=" "><subfield code="t">Journal of Neurology</subfield><subfield code="g">Vol. 253, no. 11 (2006), p. 1499-1508</subfield></datafield>\n' +
  '    <datafield tag="650" ind1=" " ind2="0"><subfield code="a">Balance</subfield></datafield>\n' +
  '  </record>\n' +
  '</collection>\n';

// A real-shaped MODS XML (Library of Congress) document for mods -> X.
const MODS_SAMPLE =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<modsCollection xmlns="http://www.loc.gov/mods/v3">\n' +
  '  <mods version="3.7">\n' +
  '    <titleInfo><title>Vestibular function in aging adults</title></titleInfo>\n' +
  '    <name type="personal"><namePart type="family">Smith</namePart><namePart type="given">John</namePart>' +
  '<role><roleTerm type="text">author</roleTerm></role></name>\n' +
  '    <name type="personal"><namePart type="family">Doe</namePart><namePart type="given">Jane</namePart></name>\n' +
  '    <genre>journal article</genre>\n' +
  '    <originInfo><publisher>Springer</publisher><dateIssued>2006</dateIssued></originInfo>\n' +
  '    <relatedItem type="host"><titleInfo><title>Journal of Neurology</title></titleInfo>' +
  '<part><detail type="volume"><number>253</number></detail><detail type="issue"><number>11</number></detail>' +
  '<extent unit="pages"><start>1499</start><end>1508</end></extent></part></relatedItem>\n' +
  '    <identifier type="doi">10.1007/s00415-006-0001-x</identifier>\n' +
  '    <identifier type="issn">1432-1459</identifier>\n' +
  '    <subject><topic>balance</topic></subject>\n' +
  '    <abstract>We measured vestibular thresholds.</abstract>\n' +
  '  </mods>\n' +
  '</modsCollection>\n';

// A real-shaped RefWorks Tagged Format export for the refworks -> X routes.
const RWS_SAMPLE =
  "RT Journal Article\nA1 Smith, John\nA1 Doe, Jane\nT1 Vestibular function in aging adults\n" +
  "JF Journal of Neurology\nYR 2006\nVO 253\nIS 11\nSP 1499\nOP 1508\n" +
  "DO 10.1007/s00415-006-0001-x\nK1 balance\nK1 aging\nAB We measured vestibular thresholds.\n" +
  "SN 1432-1459\nPB Springer\nID smith2006\n";

// A real-shaped Web of Science / ISI tagged export for the wos -> X routes.
const WOS_SAMPLE =
  "FN Clarivate Analytics Web of Science\nVR 1.0\nPT J\n" +
  "AU Smith, J\n   Doe, J\nAF Smith, John\n   Doe, Jane\n" +
  "TI Vestibular function in aging adults\nSO JOURNAL OF NEUROLOGY\nPY 2006\n" +
  "VL 253\nIS 11\nBP 1499\nEP 1508\nDI 10.1007/s00415-006-0001-x\n" +
  "DE balance; aging\nAB We measured vestibular thresholds.\nSN 1432-1459\n" +
  "UT WOS:000241500100001\nER\n\nEF\n";

// ============================================================================
// Registry: converter id → fixture spec
//
// Whenever a new converter is added to the engine, add a fixture entry
// here. Missing entries mean the converter is untested in CI.
// ============================================================================

export const FIXTURE_PROVIDERS: Record<string, FixtureSpec> = {
  // ===== Image format pairs (need browser for Canvas/Image decode) =====
  "heic-to-jpg":  { provider: () => Promise.reject(new Error("heic fixture missing")), env: "browser" },
  "heic-to-png":  { provider: () => Promise.reject(new Error("heic fixture missing")), env: "browser" },
  "heic-to-webp": { provider: () => Promise.reject(new Error("heic fixture missing")), env: "browser" },
  "heic-to-pdf":  { provider: () => Promise.reject(new Error("heic fixture missing")), env: "browser" },

  "jpg-to-png":  { provider: makeJpegFixture, env: "browser" },
  "jpg-to-webp": { provider: makeJpegFixture, env: "browser" },
  "jpg-to-bmp":  { provider: makeJpegFixture, env: "browser" },
  "jpg-to-gif":  { provider: makeJpegFixture, env: "browser" },
  "jpg-to-pdf":  { provider: makeJpegFixture, env: "browser" },
  "jpg-to-ico":  { provider: makeJpegFixture, env: "browser" },
  "jpg-to-avif": { provider: makeJpegFixture, env: "browser" },
  "jpg-to-text": { provider: makeJpegFixture, env: "browser" },

  "png-to-jpg":  { provider: makePngFixture, env: "browser" },
  "png-to-webp": { provider: makePngFixture, env: "browser" },
  "png-to-bmp":  { provider: makePngFixture, env: "browser" },
  "png-to-gif":  { provider: makePngFixture, env: "browser" },
  "png-to-pdf":  { provider: makePngFixture, env: "browser" },
  "png-to-ico":  { provider: makePngFixture, env: "browser" },
  "png-to-avif": { provider: makePngFixture, env: "browser" },
  "png-to-text": { provider: makePngFixture, env: "browser" },

  // WebP/AVIF/BMP/GIF/SVG/TIFF/ICO inputs need real browser decoders;
  // committed binary fixtures get added in stage 2.
  "webp-to-jpg":  { provider: () => Promise.reject(new Error("webp fixture pending")), env: "browser" },
  "webp-to-png":  { provider: () => Promise.reject(new Error("webp fixture pending")), env: "browser" },
  "webp-to-pdf":  { provider: () => Promise.reject(new Error("webp fixture pending")), env: "browser" },
  "webp-to-avif": { provider: () => Promise.reject(new Error("webp fixture pending")), env: "browser" },

  "avif-to-jpg":  { provider: () => Promise.reject(new Error("avif fixture pending")), env: "browser" },
  "avif-to-png":  { provider: () => Promise.reject(new Error("avif fixture pending")), env: "browser" },
  "avif-to-webp": { provider: () => Promise.reject(new Error("avif fixture pending")), env: "browser" },

  "bmp-to-jpg": { provider: () => Promise.reject(new Error("bmp fixture pending")), env: "browser" },
  "bmp-to-png": { provider: () => Promise.reject(new Error("bmp fixture pending")), env: "browser" },

  "gif-to-jpg": { provider: () => Promise.reject(new Error("gif fixture pending")), env: "browser" },
  "gif-to-png": { provider: () => Promise.reject(new Error("gif fixture pending")), env: "browser" },
  "gif-to-mp4": { provider: () => Promise.reject(new Error("gif fixture pending")), env: "browser" },

  "svg-to-png": { provider: () => Promise.reject(new Error("svg fixture pending")), env: "browser" },
  "svg-to-jpg": { provider: () => Promise.reject(new Error("svg fixture pending")), env: "browser" },

  // Image format matrix gap fills (verified in tests/browser/canvas-conversions)
  "svg-to-webp": { provider: () => Promise.reject(new Error("svg fixture in browser suite")), env: "browser" },
  "gif-to-webp": { provider: () => Promise.reject(new Error("gif fixture in browser suite")), env: "browser" },
  "bmp-to-webp": { provider: () => Promise.reject(new Error("bmp fixture in browser suite")), env: "browser" },
  "ico-to-webp": { provider: () => Promise.reject(new Error("ico fixture in browser suite")), env: "browser" },
  "webp-to-gif": { provider: () => Promise.reject(new Error("webp fixture in browser suite")), env: "browser" },
  "avif-to-gif": { provider: () => Promise.reject(new Error("avif fixture in browser suite")), env: "browser" },
  "bmp-to-gif": { provider: () => Promise.reject(new Error("bmp fixture in browser suite")), env: "browser" },
  "webp-to-bmp": { provider: () => Promise.reject(new Error("webp fixture in browser suite")), env: "browser" },
  "gif-to-bmp": { provider: () => Promise.reject(new Error("gif fixture in browser suite")), env: "browser" },
  "avif-to-bmp": { provider: () => Promise.reject(new Error("avif fixture in browser suite")), env: "browser" },
  "gif-to-avif": { provider: () => Promise.reject(new Error("gif fixture in browser suite")), env: "browser" },
  "bmp-to-avif": { provider: () => Promise.reject(new Error("bmp fixture in browser suite")), env: "browser" },
  "svg-to-avif": { provider: () => Promise.reject(new Error("svg fixture in browser suite")), env: "browser" },
  "ico-to-avif": { provider: () => Promise.reject(new Error("ico fixture in browser suite")), env: "browser" },
  "svg-to-gif": { provider: () => Promise.reject(new Error("svg fixture in browser suite")), env: "browser" },
  "ico-to-gif": { provider: () => Promise.reject(new Error("ico fixture in browser suite")), env: "browser" },
  "svg-to-bmp": { provider: () => Promise.reject(new Error("svg fixture in browser suite")), env: "browser" },
  "ico-to-bmp": { provider: () => Promise.reject(new Error("ico fixture in browser suite")), env: "browser" },
  "tiff-to-webp": { provider: () => Promise.reject(new Error("tiff fixture in browser suite")), env: "browser" },

  "tiff-to-jpg": { provider: () => Promise.reject(new Error("tiff fixture pending")), env: "browser" },
  "tiff-to-png": { provider: () => Promise.reject(new Error("tiff fixture pending")), env: "browser" },
  "tiff-to-pdf": { provider: () => Promise.reject(new Error("tiff fixture pending")), env: "browser" },

  "ico-to-png": { provider: () => Promise.reject(new Error("ico fixture pending")), env: "browser" },
  "ico-to-jpg": { provider: () => Promise.reject(new Error("ico fixture pending")), env: "browser" },

  "remove-background": { provider: makePngFixture, env: "browser" },
  "image-to-text":     { provider: makePngFixture, env: "browser" },

  // ===== PDF family, need real PDF fixtures for input =====
  "pdf-to-jpg":  { provider: () => Promise.reject(new Error("pdf fixture pending")), env: "browser" },
  "pdf-to-png":  { provider: () => Promise.reject(new Error("pdf fixture pending")), env: "browser" },
  "pdf-to-text": { provider: () => Promise.reject(new Error("pdf fixture pending")), env: "browser" },
  "pdf-to-docx": { provider: () => Promise.reject(new Error("pdf fixture pending")), env: "browser" },
  "compress-pdf":{ provider: () => Promise.reject(new Error("pdf fixture pending")), env: "browser" },

  // ===== FFmpeg, need browser for FFmpeg.wasm Worker =====
  "mp4-to-mp3":  { provider: () => Promise.reject(new Error("mp4 fixture pending")), env: "browser" },
  "mp4-to-gif":  { provider: () => Promise.reject(new Error("mp4 fixture pending")), env: "browser" },
  "mp4-to-mov":  { provider: () => Promise.reject(new Error("mp4 fixture pending")), env: "browser" },
  "mp4-to-avi":  { provider: () => Promise.reject(new Error("mp4 fixture pending")), env: "browser" },
  "mp4-to-mkv":  { provider: () => Promise.reject(new Error("mp4 fixture pending")), env: "browser" },
  "mov-to-mp4":  { provider: () => Promise.reject(new Error("mov fixture pending")), env: "browser" },
  "webm-to-mp4": { provider: () => Promise.reject(new Error("webm fixture pending")), env: "browser" },
  "avi-to-mp4":  { provider: () => Promise.reject(new Error("avi fixture pending")), env: "browser" },
  "mkv-to-mp4":  { provider: () => Promise.reject(new Error("mkv fixture pending")), env: "browser" },
  "m4v-to-mp4":  { provider: () => Promise.reject(new Error("m4v fixture pending")), env: "browser" },
  "3gp-to-mp4":  { provider: () => Promise.reject(new Error("3gp fixture pending")), env: "browser" },
  "flv-to-mp4":  { provider: () => Promise.reject(new Error("flv fixture pending")), env: "browser" },
  "wmv-to-mp4":  { provider: () => Promise.reject(new Error("wmv fixture pending")), env: "browser" },
  "mts-to-mp4":  { provider: () => Promise.reject(new Error("mts fixture pending")), env: "browser" },
  "mp4-to-webm": { provider: () => Promise.reject(new Error("mp4 fixture pending")), env: "browser" },
  "mov-to-gif":  { provider: () => Promise.reject(new Error("mov fixture pending")), env: "browser" },
  "mpg-to-mp4":  { provider: () => Promise.reject(new Error("mpg fixture pending")), env: "browser" },
  "mpeg-to-mp4": { provider: () => Promise.reject(new Error("mpeg fixture pending")), env: "browser" },
  "vob-to-mp4":  { provider: () => Promise.reject(new Error("vob fixture pending")), env: "browser" },

  // Industry batch: lyrics + DICOM extensions
  "lrc-to-srt":  { provider: () => text("test.lrc", "[ti:Demo]\n[00:01.00]First\n[00:05.00]Second\n", "text/plain"), env: "node" },
  "lrc-to-vtt":  { provider: () => text("test.lrc", "[ti:Demo]\n[00:01.00]First\n[00:05.00]Second\n", "text/plain"), env: "node" },
  "srt-to-lrc":  { provider: () => text("test.srt", F.srt, "application/x-subrip"), env: "node" },
  "dicom-to-jpg": { provider: () => Promise.reject(new Error("dicom fixture pending")), env: "browser" },
  "dicom-to-pdf": { provider: () => Promise.reject(new Error("dicom fixture pending")), env: "browser" },

  // Music sheet rendering via Verovio
  "musicxml-to-svg": { provider: () => text("test.musicxml", F.musicXml, "application/vnd.recordare.musicxml+xml"), env: "node" },
  "musicxml-to-pdf": { provider: () => text("test.musicxml", F.musicXml, "application/vnd.recordare.musicxml+xml"), env: "browser" },
  "mxl-to-svg":      { provider: () => Promise.reject(new Error("mxl fixture pending")), env: "browser" },

  // GIS: WKT / WKB <-> GeoJSON
  "wkt-to-geojson":  { provider: () => text("test.wkt", "POINT(30 10)", "text/plain"), env: "node" },
  "geojson-to-wkt":  { provider: () => text("test.geojson", F.geojson, "application/geo+json"), env: "node" },
  "wkb-to-geojson":  { provider: () => text("test.wkb", "0101000000000000000000f03f0000000000000040", "text/plain"), env: "node" },
  "geojson-to-wkb":  { provider: () => text("test.geojson", F.geojson, "application/geo+json"), env: "node" },

  // Binary serialization: MessagePack + CBOR <-> JSON
  "json-to-msgpack": { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "msgpack-to-json": { provider: async () => fileFromBytes("test.msgpack", await makeTinyMsgpack(), "application/msgpack"), env: "node" },
  "json-to-cbor":    { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "cbor-to-json":    { provider: async () => fileFromBytes("test.cbor", await makeTinyCbor(), "application/cbor"), env: "node" },

  // Bioinformatics + BitTorrent
  "fasta-to-json":   { provider: () => text("test.fasta", ">seq1 hemoglobin\nMVHLTPEEKSAVTALWGKVNVD\n>seq2\nGGTAACAGTC\n", "text/x-fasta"), env: "node" },
  "json-to-fasta":   { provider: () => text("test.json", JSON.stringify([{id:"seq1",description:"demo",sequence:"ACGTACGT"}]), "application/json"), env: "node" },
  "fastq-to-json":   { provider: () => text("test.fastq", "@read1\nACGT\n+\n!!!!\n@read2\nTTGC\n+\nIIII\n", "text/plain"), env: "node" },
  "json-to-fastq":   { provider: () => text("test.json", JSON.stringify([{id:"r1",description:"",sequence:"ACGT",quality:"!!!!"}]), "application/json"), env: "node" },
  "bencode-to-json": { provider: async () => fileFromBytes("test.torrent", await makeTinyBencode(), "application/x-bittorrent"), env: "node" },
  "json-to-bencode": { provider: () => text("test.json", JSON.stringify({announce:"http://t.example.com/announce", info:{name:"x", "piece length":16384, length:1024}}), "application/json"), env: "node" },

  // Technical docs + diagrams
  "asciidoc-to-html": { provider: () => text("test.adoc", "= Hello\n\nThis is *AsciiDoc*.\n", "text/x-asciidoc"), env: "browser" },
  "dot-to-svg":       { provider: () => text("test.dot", "digraph G { a -> b -> c; }", "text/vnd.graphviz"), env: "node" },
  "dot-to-png":       { provider: () => text("test.dot", "digraph G { a -> b; }", "text/vnd.graphviz"), env: "browser" },

  // HAR <-> curl
  "har-to-curl": { provider: () => text("test.har", JSON.stringify({log:{version:"1.2",entries:[{request:{method:"GET",url:"https://api.example.com/x",headers:[{name:"Accept",value:"application/json"}]}}]}}), "application/har+json"), env: "node" },
  "curl-to-har": { provider: () => text("test.sh", "curl https://api.example.com/users\ncurl -X POST 'https://api.example.com/x' -H 'Content-Type: application/json' -d '{\"a\":1}'\n", "text/plain"), env: "node" },

  // Citation hub completion (CSL-JSON / EndNote XML / NBIB cross-pairs)
  "csl-json-to-ris": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "ris-to-csl-json": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-csv": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-csl-json": { provider: () => text("test.csv", CITATION_CSV, "text/csv"), env: "node" },
  "csl-json-to-nbib": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "nbib-to-csl-json": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-endnote-xml": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "endnote-xml-to-csl-json": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "endnote-xml-to-csv": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "csv-to-endnote-xml": { provider: () => text("test.csv", CITATION_CSV, "text/csv"), env: "node" },
  "endnote-xml-to-nbib": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "nbib-to-endnote-xml": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "nbib-to-csv": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csv-to-nbib": { provider: () => text("test.csv", CITATION_CSV, "text/csv"), env: "node" },
  "endnote-xml-to-xlsx": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "csl-json-to-xlsx": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },

  // Citation bibliography renders (markdown / html / yaml)
  "ris-to-markdown": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-html": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-yaml": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-markdown": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "nbib-to-html": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "nbib-to-yaml": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-markdown": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "csl-json-to-html": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "csl-json-to-yaml": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "endnote-xml-to-markdown": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "endnote-xml-to-html": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "endnote-xml-to-yaml": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },

  // EndNote ENW (Refer/tagged) <-> citation hub
  "enw-to-bibtex": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-ris": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-nbib": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-endnote-xml": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-csl-json": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-csv": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-xlsx": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-markdown": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-html": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-yaml": { provider: () => text("test.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "bibtex-to-enw": { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-enw": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-enw": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "endnote-xml-to-enw": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "csl-json-to-enw": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-enw": { provider: () => text("test.csv", CITATION_CSV, "text/csv"), env: "node" },

  // Web of Science / ISI tagged export (import-only)
  "wos-to-bibtex": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-ris": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-nbib": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-endnote-xml": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-csl-json": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-csv": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-xlsx": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-markdown": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-html": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-yaml": { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },

  // RefWorks tagged format <-> citation hub
  "refworks-to-bibtex": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-ris": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-nbib": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-endnote-xml": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-csl-json": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-csv": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-xlsx": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-markdown": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-html": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-yaml": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "bibtex-to-refworks": { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-refworks": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-refworks": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "endnote-xml-to-refworks": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "csl-json-to-refworks": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-refworks": { provider: () => text("test.csv", CITATION_CSV, "text/csv"), env: "node" },

  // MODS XML (Library of Congress) <-> citation hub
  "mods-to-bibtex": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-ris": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-nbib": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-endnote-xml": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-csl-json": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-csv": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-xlsx": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-markdown": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-html": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-yaml": { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "bibtex-to-mods": { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-mods": { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-mods": { provider: () => text("test.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "endnote-xml-to-mods": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "csl-json-to-mods": { provider: () => text("test.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-mods": { provider: () => text("test.csv", CITATION_CSV, "text/csv"), env: "node" },

  // MARCXML (MARC21 slim, library catalogs; import-only)
  "marcxml-to-bibtex": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-ris": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-nbib": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-endnote-xml": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-csl-json": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-csv": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-xlsx": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-markdown": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-html": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-yaml": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "mp3-to-wav":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-m4a":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-flac": { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-ogg":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "wav-to-mp3":  { provider: () => Promise.reject(new Error("wav fixture pending")), env: "browser" },
  "m4a-to-mp3":  { provider: () => Promise.reject(new Error("m4a fixture pending")), env: "browser" },
  "flac-to-mp3": { provider: () => Promise.reject(new Error("flac fixture pending")), env: "browser" },
  "ogg-to-mp3":  { provider: () => Promise.reject(new Error("ogg fixture pending")), env: "browser" },
  "aac-to-mp3":  { provider: () => Promise.reject(new Error("aac fixture pending")), env: "browser" },
  "opus-to-mp3": { provider: () => Promise.reject(new Error("opus fixture pending")), env: "browser" },
  "wma-to-mp3":  { provider: () => Promise.reject(new Error("wma fixture pending")), env: "browser" },
  "aiff-to-mp3": { provider: () => Promise.reject(new Error("aiff fixture pending")), env: "browser" },
  "amr-to-mp3":  { provider: () => Promise.reject(new Error("amr fixture pending")), env: "browser" },
  "mp3-to-aac":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-m4r":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },

  // ===== Office docs (text-based for our fixtures) =====
  "csv-to-xlsx": { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-json": { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "csv-to-bibtex": { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-ris":    { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-ofx":    { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-qfx":    { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-qbo":    { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-qif":    { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "csv-to-gedcom": { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "csv-to-adif":   { provider: () => text("test.csv", F.bankCsv, "text/csv"), env: "node" },
  "json-to-csv":   { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },

  // Contacts / calendar / RTF
  "vcf-to-csv":  { provider: () => text("test.vcf", F.vcard, "text/vcard"), env: "node" },
  "vcf-to-json": { provider: () => text("test.vcf", F.vcard, "text/vcard"), env: "node" },
  "csv-to-vcf":  { provider: () => text("test.csv", "fullName,firstName,lastName,email,phone\nJohn Smith,John,Smith,john@x.com,+15550101\n", "text/csv"), env: "node" },
  "ics-to-csv":  { provider: () => text("test.ics", F.ics, "text/calendar"), env: "node" },
  "ics-to-json": { provider: () => text("test.ics", F.ics, "text/calendar"), env: "node" },
  "csv-to-ics":  { provider: () => text("test.csv", "summary,start,end,location\nKickoff,2024-01-15 13:00:00,2024-01-15 14:00:00,Room 4B\n", "text/csv"), env: "node" },
  "rtf-to-txt":  { provider: () => text("test.rtf", F.rtf, "application/rtf"), env: "node" },
  "rtf-to-html": { provider: () => text("test.rtf", F.rtf, "application/rtf"), env: "node" },

  // Tier 1 data batch
  "vcf-to-xlsx": { provider: () => text("test.vcf", F.vcard, "text/vcard"), env: "node" },
  "ics-to-xlsx": { provider: () => text("test.ics", F.ics, "text/calendar"), env: "node" },
  "xml-to-csv":  { provider: () => text("test.xml", "<orders><order><id>1</id><total>9.99</total></order><order><id>2</id><total>19.50</total></order></orders>", "application/xml"), env: "node" },
  "csv-to-html": { provider: () => text("test.csv", "id,name\n1,Alice\n2,Bob\n", "text/csv"), env: "node" },

  // PSD + MSG (external research batch)
  "psd-to-png":  { provider: () => Promise.reject(new Error("psd fixture pending")), env: "browser" },
  "psd-to-jpg":  { provider: () => Promise.reject(new Error("psd fixture pending")), env: "browser" },
  "msg-to-eml":  { provider: () => Promise.reject(new Error("msg fixture pending")), env: "browser" },
  "msg-to-csv":  { provider: () => Promise.reject(new Error("msg fixture pending")), env: "browser" },
  "msg-to-pdf":  { provider: () => Promise.reject(new Error("msg fixture pending")), env: "browser" },
  "json-to-xlsx":  { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },

  // YAML/TOML cross-conversions with the JSON pivot in both directions
  "yaml-to-json":  { provider: () => text("test.yaml", F.yaml, "application/x-yaml"), env: "node" },
  "json-to-yaml":  { provider: () => text("test.json", `{"name":"Alice","age":30,"roles":["admin","editor"]}`, "application/json"), env: "node" },
  "toml-to-json":  { provider: () => text("test.toml", F.toml, "application/toml"), env: "node" },
  "json-to-toml":  { provider: () => text("test.json", `{"name":"Alice","age":30,"roles":["admin","editor"]}`, "application/json"), env: "node" },

  // Subtitle pair
  "srt-to-vtt":    { provider: () => text("test.srt", F.srt, "application/x-subrip"), env: "node" },
  "vtt-to-srt":    { provider: () => text("test.vtt", F.vtt, "text/vtt"), env: "node" },

  // CSV ↔ TSV, XML ↔ JSON, Markdown chain
  "csv-to-tsv":      { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "tsv-to-csv":      { provider: () => text("test.tsv", F.tsv, "text/tab-separated-values"), env: "node" },
  "xml-to-json":     { provider: () => text("test.xml", F.xml, "application/xml"), env: "node" },
  "json-to-xml":     { provider: () => text("test.json", `{"library":{"book":{"@id":"1","title":"Foo","author":"Bar"}}}`, "application/json"), env: "node" },
  // marked + turndown both need real browser DOM (happy-dom in node tests
  // doesn't carry the full DOMParser surface turndown walks). Marking
  // as browser env so they run via tests/browser/* instead.
  "markdown-to-html":{ provider: () => text("test.md", F.markdown, "text/markdown"), env: "browser" },
  "html-to-markdown":{ provider: () => text("test.html", "<h1>Hello</h1><p>World <strong>test</strong></p>", "text/html"), env: "browser" },
  "markdown-to-pdf": { provider: () => text("test.md", F.markdown, "text/markdown"), env: "browser" },
  "json-to-gedcom":{ provider: () => text("test.json", `{"individuals":[{"id":"I1","name":"John /Smith/","sex":"M","familyAsSpouse":[]}]}`, "application/json"), env: "node" },
  "xlsx-to-csv":   { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-json":  { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "docx-to-html":  { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "node" },
  "docx-to-txt":   { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "node" },
  "docx-to-pdf":   { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "browser" },
  "html-to-docx":  { provider: () => text("test.html", "<html><body><h1>Hi</h1><p>Hello world.</p></body></html>", "text/html"), env: "node" },
  "txt-to-docx":   { provider: () => text("test.txt", "Line one\nLine two\nLine three", "text/plain"), env: "node" },
  "markdown-to-docx": { provider: () => text("test.md", "# Title\n\nHello **world** with *emphasis*.\n\n- one\n- two\n", "text/markdown"), env: "node" },
  "docx-to-markdown": { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "node" },
  "markdown-to-txt": { provider: () => text("test.md", "# Title\n\nHello **world** with a [link](https://example.com).\n", "text/markdown"), env: "node" },
  "html-to-txt":   { provider: () => text("test.html", "<html><body><h1>Title</h1><p>Hello world.</p><p>Second.</p></body></html>", "text/html"), env: "node" },
  "txt-to-html":   { provider: () => text("test.txt", "First paragraph here.\n\nSecond paragraph here.", "text/plain"), env: "node" },
  "rtf-to-docx":   { provider: () => text("test.rtf", "{\\rtf1\\ansi\\deff0 {\\b Title}\\par Hello world paragraph.\\par}", "application/rtf"), env: "node" },
  "rtf-to-markdown": { provider: () => text("test.rtf", "{\\rtf1\\ansi\\deff0 {\\b Title}\\par Hello world paragraph.\\par}", "application/rtf"), env: "node" },
  "xlsx-to-html":  { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "html-to-xlsx":  { provider: () => text("test.html", "<table><tr><th>City</th><th>Pop</th></tr><tr><td>Paris</td><td>2161000</td></tr></table>", "text/html"), env: "node" },
  "html-to-csv":   { provider: () => text("test.html", "<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>", "text/html"), env: "node" },
  "references-to-ris":      { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "references-to-bibtex":   { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "references-to-csl-json": { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "pubmed-to-ris":    { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "pubmed-to-bibtex": { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "pubmed-to-csv":    { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "pubmed-to-csl-json":   { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "pubmed-to-enw":        { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "pubmed-to-endnote-xml": { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "pubmed-to-nbib":       { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },
  "references-to-enw":         { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "references-to-endnote-xml": { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "references-to-nbib":        { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "references-to-csv":         { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "references-to-xlsx":        { provider: () => text("refs.txt", "[1] L. Tan and T. Zrnic, \"Valid Inference with Synthetic Data,\" JMLR, vol. 25, 2024.\n[2] K. Brown, \"A Study,\" Nature, 2019.", "text/plain"), env: "node" },
  "pubmed-to-xlsx":           { provider: () => text("pubmed.txt", "PMID- 30429114\nTI  - Vestibular function in older adults.\nAU  - Smith JK\nDP  - 2019\nJT  - J Vestib Res\nAID - 10.3233/VES-190001 [doi]\n", "text/plain"), env: "node" },

  // ===== EPUB =====
  "epub-to-text": { provider: async () => fileFromBytes("test.epub", await makeTinyEpub(), "application/epub+zip"), env: "node" },
  "epub-to-html": { provider: async () => fileFromBytes("test.epub", await makeTinyEpub(), "application/epub+zip"), env: "node" },
  "epub-to-pdf":  { provider: async () => fileFromBytes("test.epub", await makeTinyEpub(), "application/epub+zip"), env: "browser" },

  // ===== Kindle =====
  "kindle-clippings-to-csv":           { provider: () => text("My Clippings.txt", F.kindleClippings), env: "node" },
  "kindle-clippings-to-json":          { provider: () => text("My Clippings.txt", F.kindleClippings), env: "node" },
  "kindle-clippings-to-markdown":      { provider: () => text("My Clippings.txt", F.kindleClippings), env: "node" },
  "kindle-clippings-to-obsidian-md":   { provider: () => text("My Clippings.txt", F.kindleClippings), env: "node" },
  "kindle-clippings-to-notion-csv":    { provider: () => text("My Clippings.txt", F.kindleClippings), env: "node" },
  "kindle-clippings-to-readwise-csv":  { provider: () => text("My Clippings.txt", F.kindleClippings), env: "node" },

  // ===== Personal data exports =====
  "apple-health-to-csv":               { provider: async () => fileFromBytes("export.zip", await makeTinyAppleHealthZip(), "application/zip"), env: "node" },
  "apple-health-to-json":              { provider: async () => fileFromBytes("export.zip", await makeTinyAppleHealthZip(), "application/zip"), env: "node" },
  "apple-health-heart-rate-to-csv":    { provider: async () => fileFromBytes("export.zip", await makeTinyAppleHealthZip(), "application/zip"), env: "node" },
  "apple-health-steps-to-csv":         { provider: async () => fileFromBytes("export.zip", await makeTinyAppleHealthZip(), "application/zip"), env: "node" },
  "apple-health-sleep-to-csv":         { provider: async () => fileFromBytes("export.zip", await makeTinyAppleHealthZip(), "application/zip"), env: "node" },
  "apple-health-workouts-to-csv":      { provider: async () => fileFromBytes("export.zip", await makeTinyAppleHealthZip(), "application/zip"), env: "node" },

  "whatsapp-chat-to-csv":  { provider: () => text("_chat.txt", F.whatsappChat), env: "node" },
  "whatsapp-chat-to-json": { provider: () => text("_chat.txt", F.whatsappChat), env: "node" },
  "whatsapp-chat-to-html": { provider: () => text("_chat.txt", F.whatsappChat), env: "node" },
  "whatsapp-chat-to-pdf":  { provider: () => text("_chat.txt", F.whatsappChat), env: "browser" },

  "discord-chat-to-md":          { provider: () => text("export.json", F.discordChat, "application/json"), env: "node" },
  "discord-chat-to-pdf":         { provider: () => text("export.json", F.discordChat, "application/json"), env: "browser" },
  "discord-chat-summary-csv":    { provider: () => text("export.json", F.discordChat, "application/json"), env: "node" },

  "twitter-archive-to-csv":   { provider: async () => fileFromBytes("twitter.zip", await makeTinyTwitterArchiveZip(), "application/zip"), env: "node" },
  "twitter-archive-to-html":  { provider: async () => fileFromBytes("twitter.zip", await makeTinyTwitterArchiveZip(), "application/zip"), env: "node" },
  "instagram-data-to-csv":    { provider: async () => fileFromBytes("instagram.zip", await makeTinyInstagramZip(), "application/zip"), env: "node" },
  "instagram-data-to-html":   { provider: async () => fileFromBytes("instagram.zip", await makeTinyInstagramZip(), "application/zip"), env: "node" },
  "facebook-archive-to-html": { provider: async () => fileFromBytes("facebook.zip", await makeTinyFacebookZip(), "application/zip"), env: "node" },

  // ===== Email =====
  "eml-to-pdf":  { provider: () => text("test.eml", F.eml, "message/rfc822"), env: "browser" },
  "eml-to-html": { provider: () => text("test.eml", F.eml, "message/rfc822"), env: "node" },
  "eml-to-csv":  { provider: () => text("test.eml", F.eml, "message/rfc822"), env: "node" },
  "eml-to-mbox": { provider: () => text("test.eml", F.eml, "message/rfc822"), env: "node" },
  "mbox-to-eml": { provider: () => text("test.mbox", `From alice@example.com Mon Jan 1 12:00:00 2024\n${F.eml}\n`, "application/mbox"), env: "node" },
  "mbox-to-pdf": { provider: () => text("test.mbox", `From alice@example.com Mon Jan 1 12:00:00 2024\n${F.eml}\n`, "application/mbox"), env: "browser" },
  "mbox-to-csv": { provider: () => text("test.mbox", F.mbox, "application/mbox"), env: "node" },

  // ===== Finance =====
  "ofx-to-csv":  { provider: () => text("test.ofx", F.ofx, "application/x-ofx"), env: "node" },
  "qfx-to-csv":  { provider: () => text("test.qfx", F.ofx, "application/vnd.intu.qfx"), env: "node" },
  "qbo-to-csv":  { provider: () => text("test.qbo", F.ofx, "application/vnd.intu.qbo"), env: "node" },
  "qif-to-csv":  { provider: () => text("test.qif", F.qif, "application/qif"), env: "node" },
  "ofx-to-qif":  { provider: () => text("test.ofx", F.ofx, "application/x-ofx"), env: "node" },
  "qif-to-ofx":  { provider: () => text("test.qif", F.qif, "application/qif"), env: "node" },

  // ===== iWork (zip with preview.pdf) =====
  "pages-to-pdf":   { provider: async () => fileFromBytes("doc.pages", await makeTinyIworkPages(), "application/zip"), env: "node" },
  "numbers-to-pdf": { provider: async () => fileFromBytes("sheet.numbers", await makeTinyIworkPages(), "application/zip"), env: "node" },
  "keynote-to-pdf": { provider: async () => fileFromBytes("deck.keynote", await makeTinyIworkPages(), "application/zip"), env: "node" },

  // ===== Genealogy / bibliography / ham radio / chess =====
  "gedcom-to-csv":  { provider: () => text("test.ged", F.gedcom), env: "node" },
  "gedcom-to-xlsx": { provider: () => text("test.ged", F.gedcom), env: "node" },
  "gedcom-to-json": { provider: () => text("test.ged", F.gedcom), env: "node" },
  "gedcom-to-html": { provider: () => text("test.ged", F.gedcom), env: "node" },
  "gedcom-to-pdf":  { provider: () => text("test.ged", F.gedcom), env: "browser" },

  "bibtex-to-ris":         { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-csv":         { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-nbib":        { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-endnote-xml": { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-xlsx":        { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-bibtex":         { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-csv":            { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-nbib":           { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-endnote-xml":    { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-xlsx":           { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-bibtex":        { provider: () => text("test.nbib", F.nbib, "application/x-research-info-systems"), env: "node" },
  "nbib-to-ris":           { provider: () => text("test.nbib", F.nbib, "application/x-research-info-systems"), env: "node" },
  "nbib-to-xlsx":          { provider: () => text("test.nbib", F.nbib, "application/x-research-info-systems"), env: "node" },
  "endnote-xml-to-bibtex": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "endnote-xml-to-ris":    { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },

  "adif-to-csv":      { provider: () => text("test.adi", F.adif, "application/x-adif"), env: "node" },
  "adif-to-cabrillo": { provider: () => text("test.adi", F.adif, "application/x-adif"), env: "node" },
  "adif-to-kml":      { provider: () => text("test.adi", F.adif, "application/x-adif"), env: "node" },
  "cabrillo-to-adif": { provider: () => text("test.log", F.cabrillo, "text/plain"), env: "node" },

  "pgn-to-csv":  { provider: () => text("test.pgn", `[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0\n`, "application/x-chess-pgn"), env: "node" },
  "pgn-to-fen":  { provider: () => text("test.pgn", `[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0\n`, "application/x-chess-pgn"), env: "node" },
  "fen-to-pgn":  { provider: () => text("test.fen", F.fen, "application/x-fen"), env: "node" },
  "fen-to-png":  { provider: () => text("test.fen", F.fen, "application/x-fen"), env: "browser" },
  "pgn-to-json": { provider: () => text("test.pgn", `[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0\n`, "application/x-chess-pgn"), env: "node" },

  // ===== Design / palette / LUT / 3D / music notation =====
  "ase-to-gpl":  { provider: makeAseFixture, env: "node" },
  "ase-to-aco":  { provider: makeAseFixture, env: "node" },
  "ase-to-css":  { provider: makeAseFixture, env: "node" },
  "ase-to-json": { provider: makeAseFixture, env: "node" },
  "aco-to-ase":  { provider: makeAcoFixture, env: "node" },
  "aco-to-gpl":  { provider: makeAcoFixture, env: "node" },
  "gpl-to-ase":  { provider: () => text("test.gpl", F.gpl), env: "node" },
  "gpl-to-aco":  { provider: () => text("test.gpl", F.gpl), env: "node" },
  "hex-to-ase":  { provider: () => text("test.txt", F.hexList), env: "node" },
  "hex-to-gpl":  { provider: () => text("test.txt", F.hexList), env: "node" },
  "ase-to-hex":  { provider: makeAseFixture, env: "node" },
  "gpl-to-hex":  { provider: () => text("test.gpl", F.gpl), env: "node" },
  "css-to-ase":  { provider: () => text("test.css", ":root {\n  --primary: #ff0000;\n  --secondary: #00ff00;\n  --tertiary: #0000ff;\n}\n", "text/css"), env: "node" },

  "cube-to-3dl": { provider: () => text("test.cube", F.cubeLut), env: "node" },
  "cube-to-csp": { provider: () => text("test.cube", F.cubeLut), env: "node" },
  "3dl-to-cube": { provider: () => text("test.3dl", makeTiny3dl(), "text/plain"), env: "node" },
  "3dl-to-csp":  { provider: () => text("test.3dl", makeTiny3dl(), "text/plain"), env: "node" },
  "csp-to-cube": { provider: () => text("test.csp", makeTinyCsp(), "text/plain"), env: "node" },
  "csp-to-3dl":  { provider: () => text("test.csp", makeTinyCsp(), "text/plain"), env: "node" },

  "stl-to-3mf": { provider: makeStlFixture, env: "node" },
  "stl-to-obj": { provider: makeStlFixture, env: "node" },
  "obj-to-3mf": { provider: () => text("test.obj", `# OBJ test\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n`, "model/obj"), env: "node" },
  "obj-to-stl": { provider: () => text("test.obj", `# OBJ test\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n`, "model/obj"), env: "node" },
  "3mf-to-stl": { provider: async () => fileFromBytes("cube.3mf", await makeTiny3mf(), "model/3mf"), env: "node" },
  "3mf-to-obj": { provider: async () => fileFromBytes("cube.3mf", await makeTiny3mf(), "model/3mf"), env: "node" },

  "midi-to-musicxml":  { provider: async () => fileFromBytes("test.mid", await makeTinyMidi(), "audio/midi"), env: "node" },
  "musicxml-to-midi":  { provider: () => text("test.musicxml", F.musicXml, "application/vnd.recordare.musicxml+xml"), env: "node" },
  "mxl-to-musicxml":   { provider: async () => fileFromBytes("test.mxl", await makeTinyMxl(), "application/vnd.recordare.musicxml"), env: "node" },
  "musicxml-to-mxl":   { provider: () => text("test.musicxml", F.musicXml, "application/vnd.recordare.musicxml+xml"), env: "node" },

  "dst-to-pes": { provider: makeDstFixture, env: "node" },
  "dst-to-jef": { provider: makeDstFixture, env: "node" },
  "dst-to-exp": { provider: makeDstFixture, env: "node" },
  "pes-to-dst": { provider: makePesFixture, env: "node" },
  "pes-to-jef": { provider: makePesFixture, env: "node" },
  "pes-to-exp": { provider: makePesFixture, env: "node" },
  "jef-to-dst": { provider: makeJefFixture, env: "node" },
  "jef-to-pes": { provider: makeJefFixture, env: "node" },
  "jef-to-exp": { provider: makeJefFixture, env: "node" },
  "exp-to-dst": { provider: makeExpFixture, env: "node" },
  "exp-to-pes": { provider: makeExpFixture, env: "node" },
  "exp-to-jef": { provider: makeExpFixture, env: "node" },

  // ===== Architecture / legal / security / B2B =====
  "ifc-to-csv":  { provider: () => Promise.reject(new Error("ifc fixture pending")), env: "browser" },
  "ifc-to-gltf": { provider: () => Promise.reject(new Error("ifc fixture pending")), env: "browser" },

  "pacer-docket-to-csv": { provider: () => text("docket.html", F.pacerDocket, "text/html"), env: "node" },

  "sarif-to-csv":  { provider: () => text("scan.sarif", F.sarif, "application/sarif+json"), env: "node" },
  "sarif-to-html": { provider: () => text("scan.sarif", F.sarif, "application/sarif+json"), env: "node" },

  "edi-to-csv":     { provider: () => text("test.edi", F.ediX12, "application/edi-x12"), env: "node" },
  "edifact-to-csv": { provider: () => text("test.edi", F.edifact, "application/edifact"), env: "node" },

  // ===== Color converters (pure text in/out, no deps) =====
  "hex-to-rgb":  { provider: () => text("colors.txt", F.hexList), env: "node" },
  "rgb-to-hex":  { provider: () => text("colors.txt", F.rgbList), env: "node" },
  "hex-to-hsl":  { provider: () => text("colors.txt", F.hexList), env: "node" },
  "hsl-to-hex":  { provider: () => text("colors.txt", F.hslList), env: "node" },
  "rgb-to-hsl":  { provider: () => text("colors.txt", F.rgbList), env: "node" },
  "hsl-to-rgb":  { provider: () => text("colors.txt", F.hslList), env: "node" },
  "rgb-to-cmyk": { provider: () => text("colors.txt", F.rgbList), env: "node" },
  "cmyk-to-rgb": { provider: () => text("colors.txt", F.cmykList), env: "node" },
  "hex-to-cmyk": { provider: () => text("colors.txt", F.hexList), env: "node" },
  "cmyk-to-hex": { provider: () => text("colors.txt", F.cmykList), env: "node" },

  // ===== Encoding/decoding (browser-native btoa/atob + TextEncoder) =====
  "text-to-base64":      { provider: () => text("input.txt", F.encodingPlain), env: "node" },
  "base64-to-text":      { provider: () => text("input.txt", F.base64Sample), env: "node" },
  "text-to-url-encoded": { provider: () => text("input.txt", F.encodingPlain), env: "node" },
  "url-encoded-to-text": { provider: () => text("input.txt", F.urlEncodedSample), env: "node" },
  "text-to-hex":         { provider: () => text("input.txt", F.encodingPlain), env: "node" },
  "hex-to-text":         { provider: () => text("input.txt", F.hexSample), env: "node" },

  // ===== File checksums (any binary works; reuse PNG fixture) =====
  "file-to-md5":    { provider: makePngFixture, env: "node" },
  "file-to-sha1":   { provider: makePngFixture, env: "node" },
  "file-to-sha256": { provider: makePngFixture, env: "node" },
  "file-to-sha512": { provider: makePngFixture, env: "node" },

  // ===== Geographic (KML/GPX/GeoJSON, fast-xml-parser based) =====
  "kml-to-gpx":     { provider: () => text("test.kml", F.kml, "application/vnd.google-earth.kml+xml"), env: "node" },
  "gpx-to-kml":     { provider: () => text("test.gpx", F.gpx, "application/gpx+xml"), env: "node" },
  "kml-to-geojson": { provider: () => text("test.kml", F.kml, "application/vnd.google-earth.kml+xml"), env: "node" },
  "geojson-to-kml": { provider: () => text("test.geojson", F.geojson, "application/geo+json"), env: "node" },
  "gpx-to-geojson": { provider: () => text("test.gpx", F.gpx, "application/gpx+xml"), env: "node" },
  "geojson-to-gpx": { provider: () => text("test.geojson", F.geojson, "application/geo+json"), env: "node" },

  // ===== JSONL (NDJSON) family =====
  "jsonl-to-json": { provider: () => text("test.jsonl", F.jsonl, "application/jsonl"), env: "node" },
  "json-to-jsonl": { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "jsonl-to-csv":  { provider: () => text("test.jsonl", F.jsonl, "application/jsonl"), env: "node" },
  "csv-to-jsonl":  { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },

  // ===== Config formats: INI, .env, YAML↔TOML direct, JSON5 =====
  "ini-to-json":   { provider: () => text("config.ini", F.ini, "application/x-ini"), env: "node" },

  // Config serialization cross-matrix (yaml/toml/json5/ini <-> xml + to yaml/toml)
  "yaml-to-xml":   { provider: () => text("test.yaml", F.yaml, "application/x-yaml"), env: "node" },
  "xml-to-yaml":   { provider: () => text("test.xml", F.xml, "application/xml"), env: "node" },
  "toml-to-xml":   { provider: () => text("test.toml", F.toml, "application/toml"), env: "node" },
  "xml-to-toml":   { provider: () => text("test.xml", F.xml, "application/xml"), env: "node" },
  "json5-to-yaml": { provider: () => text("config.json5", F.json5, "application/json5"), env: "node" },
  "json5-to-xml":  { provider: () => text("config.json5", F.json5, "application/json5"), env: "node" },
  "json5-to-toml": { provider: () => text("config.json5", F.json5, "application/json5"), env: "node" },
  "ini-to-yaml":   { provider: () => text("config.ini", F.ini, "application/x-ini"), env: "node" },
  "ini-to-xml":    { provider: () => text("config.ini", F.ini, "application/x-ini"), env: "node" },
  "ini-to-toml":   { provider: () => text("config.ini", F.ini, "application/x-ini"), env: "node" },
  "json-to-ini":   { provider: () => text("config.json", `{"database":{"host":"localhost","port":5432},"server":{"port":8080}}`, "application/json"), env: "node" },
  "env-to-json":   { provider: () => text(".env", F.env, "text/plain"), env: "node" },
  "json-to-env":   { provider: () => text("config.json", `{"DATABASE_URL":"postgres://localhost:5432/db","API_KEY":"sk_test_abc","NODE_ENV":"production"}`, "application/json"), env: "node" },
  "yaml-to-toml":  { provider: () => text("config.yaml", F.yaml, "application/x-yaml"), env: "node" },
  "toml-to-yaml":  { provider: () => text("config.toml", F.toml, "application/toml"), env: "node" },
  "json5-to-json": { provider: () => text("config.json5", F.json5, "application/json5"), env: "node" },

  // ===== SBV subtitles =====
  "srt-to-sbv": { provider: () => text("test.srt", F.srt, "application/x-subrip"), env: "node" },
  "sbv-to-srt": { provider: () => text("test.sbv", F.sbv, "text/sbv"), env: "node" },

  // ===== ODS spreadsheets (SheetJS handles ODS read/write natively) =====
  "ods-to-csv":  { provider: async () => fileFromBytes("test.ods", await makeTinyOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-xlsx": { provider: async () => fileFromBytes("test.ods", await makeTinyOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "csv-to-ods":  { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "xlsx-to-ods": { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },

  // ===== Web fonts (need committed real-font fixtures; skip in CI for now) =====
  // fonteditor-core needs an actual font file to round-trip — generating a
  // valid SFNT from scratch is non-trivial. These get tested manually until
  // we commit a tiny CC0 font fixture.
  "ttf-to-woff": { provider: () => Promise.reject(new Error("ttf fixture pending")), env: "browser" },
  "woff-to-ttf": { provider: () => Promise.reject(new Error("woff fixture pending")), env: "browser" },
  "otf-to-ttf":  { provider: () => Promise.reject(new Error("otf fixture pending")), env: "browser" },

  // ===== Tabular table conversions =====
  "csv-to-markdown-table":  { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "markdown-table-to-csv":  { provider: () => text("table.md", F.markdownTable, "text/markdown"), env: "node" },
  "csv-to-html-table":      { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "html-table-to-csv":      { provider: () => text("table.html", F.htmlTable, "text/html"), env: "node" },

  // Tabular hub gap fills (markdown-table / html-table / json / xlsx)
  "markdown-table-to-html-table": { provider: () => text("table.md", F.markdownTable, "text/markdown"), env: "node" },
  "html-table-to-markdown-table": { provider: () => text("table.html", F.htmlTable, "text/html"), env: "node" },
  "markdown-table-to-json": { provider: () => text("table.md", F.markdownTable, "text/markdown"), env: "node" },
  "json-to-markdown-table": { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "html-table-to-json": { provider: () => text("table.html", F.htmlTable, "text/html"), env: "node" },
  "json-to-html-table": { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "markdown-table-to-xlsx": { provider: () => text("table.md", F.markdownTable, "text/markdown"), env: "node" },
  "html-table-to-xlsx": { provider: () => text("table.html", F.htmlTable, "text/html"), env: "node" },
  "xlsx-to-markdown-table": { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-html-table": { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },

  // Spreadsheet -> citation bridge (citation-shaped sheets)
  "xlsx-to-ris": { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-bibtex": { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-csl-json": { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-endnote-xml": { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-nbib": { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "ods-to-ris": { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-bibtex": { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-csl-json": { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-endnote-xml": { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-nbib": { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },

  // ===== SQL =====
  "csv-to-sql":  { provider: () => text("users.csv", F.genericCsv, "text/csv"), env: "node" },
  "sql-to-csv":  { provider: () => text("dump.sql", F.sqlDump, "application/sql"), env: "node" },
  "json-to-sql": { provider: () => text("users.json", F.jsonArray, "application/json"), env: "node" },

  // ===== Java .properties + HCL =====
  "properties-to-json": { provider: () => text("app.properties", F.javaProperties, "text/x-java-properties"), env: "node" },
  "json-to-properties": { provider: () => text("config.json", `{"server.port":"8080","spring.datasource.url":"jdbc:postgresql://localhost:5432/mydb"}`, "application/json"), env: "node" },
  "hcl-to-json":        { provider: () => text("main.tf", F.hclTerraform, "text/x-hcl"), env: "node" },

  // ===== Gettext PO (localization) =====
  // CSV/JSON inputs for csv-to-po and json-to-po use the canonical
  // columns/keys our writers emit so the round-trip path is exercised.
  "po-to-csv":  { provider: () => text("messages.po", F.poGettext, "text/x-gettext-translation"), env: "node" },
  "po-to-json": { provider: () => text("messages.po", F.poGettext, "text/x-gettext-translation"), env: "node" },
  "csv-to-po":  { provider: () => text("messages.csv", `msgctxt,msgid,msgid_plural,msgstr,msgstr_plurals,comments,extracted,references,flags\n,Hello,,Bonjour,,,,,\nnoun,Order,,Pedido,,,,,\nverb,Order,,Ordenar,,,,,\n`, "text/csv"), env: "node" },
  "json-to-po": { provider: () => text("messages.json", `[{"msgid":"Hello","msgstr":"Bonjour"},{"msgid":"%d apple","msgid_plural":"%d apples","msgstr":["%d pomme","%d pommes"]}]`, "application/json"), env: "node" },

  // ===== ASS / SSA styled subtitles =====
  "srt-to-ass": { provider: () => text("captions.srt", F.srt, "application/x-subrip"), env: "node" },
  "vtt-to-ass": { provider: () => text("captions.vtt", F.vtt, "text/vtt"), env: "node" },
  "ass-to-srt": { provider: () => text("captions.ass", F.ass, "text/x-ssa"), env: "node" },
  "ass-to-vtt": { provider: () => text("captions.ass", F.ass, "text/x-ssa"), env: "node" },

  // Subtitle transcripts (plain-text) + matrix gap fills
  "srt-to-txt": { provider: () => text("captions.srt", F.srt, "application/x-subrip"), env: "node" },
  "vtt-to-txt": { provider: () => text("captions.vtt", F.vtt, "text/vtt"), env: "node" },
  "ass-to-txt": { provider: () => text("captions.ass", F.ass, "text/x-ssa"), env: "node" },
  "sbv-to-txt": { provider: () => text("captions.sbv", F.sbv, "text/sbv"), env: "node" },
  "lrc-to-txt": { provider: () => text("song.lrc", "[ti:Demo]\n[00:01.00]First line\n[00:05.00]Second line\n", "text/plain"), env: "node" },
  "vtt-to-sbv": { provider: () => text("captions.vtt", F.vtt, "text/vtt"), env: "node" },
  "ass-to-sbv": { provider: () => text("captions.ass", F.ass, "text/x-ssa"), env: "node" },
  "sbv-to-vtt": { provider: () => text("captions.sbv", F.sbv, "text/sbv"), env: "node" },
  "sbv-to-ass": { provider: () => text("captions.sbv", F.sbv, "text/sbv"), env: "node" },

  // ===== CAD (DXF) =====
  "dxf-to-svg":  { provider: () => text("drawing.dxf", F.dxf, "image/vnd.dxf"), env: "node" },
  "dxf-to-json": { provider: () => text("drawing.dxf", F.dxf, "image/vnd.dxf"), env: "node" },

  // ===== Medical imaging (DICOM) =====
  // dicom-to-json runs in Node (no canvas needed); dicom-to-png needs
  // canvas so it's flagged as browser env.
  "dicom-to-json": { provider: () => Promise.resolve(fileFromBytes("test.dcm", makeTinyDicom(), "application/dicom")), env: "node" },
  "dicom-to-png":  { provider: () => Promise.resolve(fileFromBytes("test.dcm", makeTinyDicom(), "application/dicom")), env: "browser" },

  // ===== 3D model interchange (GLB / glTF binary) =====
  "stl-to-glb": { provider: () => Promise.resolve(fileFromBytes("cube.stl", makeTinyStl(), "model/stl")), env: "node" },
  "glb-to-stl": { provider: () => Promise.resolve(fileFromBytes("cube.glb", makeTinyGlb(), "model/gltf-binary")), env: "node" },
  "obj-to-glb": { provider: () => text("cube.obj", makeTinyObj(), "model/obj"), env: "node" },
  "glb-to-obj": { provider: () => Promise.resolve(fileFromBytes("cube.glb", makeTinyGlb(), "model/gltf-binary")), env: "node" },

  // ===== CSS named colors =====
  "color-name-to-hex": { provider: () => text("colors.txt", F.colorNames, "text/plain"), env: "node" },
  "hex-to-color-name": { provider: () => text("colors.txt", F.hexList, "text/plain"), env: "node" },

  // ===== Date/time =====
  "unix-to-iso":           { provider: () => text("timestamps.txt", F.unixTimestamps, "text/plain"), env: "node" },
  "iso-to-unix":           { provider: () => text("dates.txt", F.isoDates, "text/plain"), env: "node" },
  "timestamp-to-readable": { provider: () => text("timestamps.txt", F.unixTimestamps, "text/plain"), env: "node" },

  // ===== Modern color spaces (CSS Color Level 4) =====
  "hex-to-oklch":  { provider: () => text("colors.txt", F.hexList, "text/plain"), env: "node" },
  "oklch-to-hex":  { provider: () => text("colors.txt", F.oklchList, "text/plain"), env: "node" },
  "rgb-to-oklch":  { provider: () => text("colors.txt", F.rgbList, "text/plain"), env: "node" },
  "oklch-to-rgb":  { provider: () => text("colors.txt", F.oklchList, "text/plain"), env: "node" },
  "hex-to-lab":    { provider: () => text("colors.txt", F.hexList, "text/plain"), env: "node" },
  "lab-to-hex":    { provider: () => text("colors.txt", F.labList, "text/plain"), env: "node" },

  // ===== TSV cross-conversions =====
  "tsv-to-json":   { provider: () => text("test.tsv", F.tsv, "text/tab-separated-values"), env: "node" },
  "json-to-tsv":   { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "tsv-to-xlsx":   { provider: () => text("test.tsv", F.tsv, "text/tab-separated-values"), env: "node" },
  "xlsx-to-tsv":   { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },

  // ===== CSV ↔ YAML direct =====
  "csv-to-yaml":   { provider: () => text("test.csv", F.genericCsv, "text/csv"), env: "node" },
  "yaml-to-csv":   { provider: () => text("test.yaml", `- name: Alice\n  age: 30\n- name: Bob\n  age: 25\n`, "application/x-yaml"), env: "node" },

  // ===== Crypto / dev =====
  "jwt-to-json":   { provider: () => text("token.jwt", F.jwtSample, "application/jwt"), env: "node" },
  "pem-to-der":    { provider: () => text("cert.pem", F.pemSample, "application/x-pem-file"), env: "node" },
  "der-to-pem":    { provider: async () => {
    // Round-trip our own PEM fixture through pem-to-der to get a real DER blob
    const pem = F.pemSample;
    const match = pem.match(/-----BEGIN [^-]+-----([\s\S]+?)-----END [^-]+-----/);
    if (!match) throw new Error("test fixture is not valid PEM");
    const b64 = match[1].replace(/\s+/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return fileFromBytes("cert.der", bytes, "application/pkix-cert");
  }, env: "node" },

  // ===== Medical: HL7 v2.x =====
  "hl7-to-csv":  { provider: () => text("test.hl7", F.hl7v2, "application/hl7-v2"), env: "node" },
  "hl7-to-json": { provider: () => text("test.hl7", F.hl7v2, "application/hl7-v2"), env: "node" },
  "json-to-hl7": { provider: () => text("test.json", `{"MSH":[{"MSH.1":"|","MSH.2":"^~\\\\&","MSH.3":"EPIC","MSH.4":"REGIONAL","MSH.7":"20240101120000","MSH.9":"ADT^A01","MSH.10":"MSG00001","MSH.11":"P","MSH.12":"2.5"}],"PID":[{"PID.1":"1","PID.3":"10001234^^^MRN","PID.5":"DOE^JOHN^A","PID.7":"19800515","PID.8":"M"}]}`, "application/json"), env: "node" },

  // ===== Medical: FHIR =====
  "fhir-bundle-to-csv": { provider: () => text("bundle.json", F.fhirBundle, "application/fhir+json"), env: "node" },
  "csv-to-fhir-bundle": { provider: () => text("patients.csv", `resourceType,id,active,birthDate\nPatient,p1,true,1980-05-15\nPatient,p2,true,1985-08-22\n`, "text/csv"), env: "node" },

  // ===== Medical: C-CDA =====
  "ccda-to-html": { provider: () => text("ccd.xml", F.ccda, "application/cda+xml"), env: "node" },
  "ccda-to-json": { provider: () => text("ccd.xml", F.ccda, "application/cda+xml"), env: "node" },

  // ===== Legal: Concordance DAT/OPT =====
  "dat-to-csv":  { provider: () => text("production.dat", F.datLoadFile, "application/vnd.concordance-dat"), env: "node" },
  "csv-to-dat":  { provider: () => text("production.csv", `BegBates,EndBates,Date,From,To,Subject\nABC0000001,ABC0000003,2024-01-15,alice@example.com,bob@example.com,Q4 review\n`, "text/csv"), env: "node" },
  "opt-to-csv":  { provider: () => text("images.opt", F.optLoadFile, "application/vnd.concordance-opt"), env: "node" },

  // ===== Academic: BibTeX expanded family =====
  "bibtex-to-csl-json":  { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "csl-json-to-bibtex":  { provider: () => text("refs.json", F.cslJson, "application/vnd.citationstyles.csl+json"), env: "node" },
  "bibtex-to-yaml":      { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "yaml-to-bibtex":      { provider: () => text("refs.yaml", F.cslYaml, "application/x-yaml"), env: "node" },
  "bibtex-to-markdown":  { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-html":      { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-apa":       { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-apa":          { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-apa":         { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-apa":     { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "bibtex-to-mla":       { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-mla":          { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-mla":         { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-mla":     { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "bibtex-to-chicago":   { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-chicago":      { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-chicago":     { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-chicago": { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-apa":          { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "csv-to-mla":          { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "csv-to-chicago":      { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-apa":         { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-mla":         { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-chicago":     { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "bibtex-to-harvard":   { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-harvard":      { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-harvard":     { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-harvard": { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-harvard":      { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-harvard":     { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "bibtex-to-ieee":      { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-ieee":         { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-ieee":        { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-ieee":    { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-ieee":         { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-ieee":        { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "references-to-apa":     { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-mla":     { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-chicago": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-harvard": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-ieee":    { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "bibtex-to-ama":         { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-ama":            { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-ama":           { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-ama":       { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-ama":            { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-ama":           { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "references-to-ama":     { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "bibtex-to-nature":      { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-nature":         { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-nature":        { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-nature":    { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-nature":         { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-nature":        { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "references-to-nature":  { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "bibtex-to-acs":         { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-acs":            { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-acs":           { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-acs":       { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-acs":            { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-acs":           { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "references-to-acs":     { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "bibtex-to-asa":         { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-asa":            { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-asa":           { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-asa":       { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-asa":            { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-asa":           { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "references-to-asa":     { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "bibtex-to-vancouver":   { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-vancouver":      { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-vancouver":     { provider: () => text("refs.nbib", F.nbibRealPubMed, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-vancouver": { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csv-to-vancouver":      { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "xlsx-to-vancouver":     { provider: async () => fileFromBytes("refs.xlsx", await makeTinyCitationXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "references-to-vancouver": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "enw-to-apa":       { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-mla":       { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-chicago":   { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-harvard":   { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-ieee":      { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-ama":       { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-nature":    { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-acs":       { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-asa":       { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "enw-to-vancouver": { provider: () => text("refs.enw", ENW_SAMPLE, "application/x-endnote-refer"), env: "node" },
  "ods-to-apa":        { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-mla":        { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-chicago":    { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-harvard":    { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-ieee":       { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-ama":        { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-nature":     { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-acs":        { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-asa":        { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "ods-to-vancouver":  { provider: async () => fileFromBytes("refs.ods", await makeTinyCitationOds(), "application/vnd.oasis.opendocument.spreadsheet"), env: "node" },
  "refworks-to-apa":     { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-mla":     { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-chicago": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-harvard": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-ieee":    { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-ama":     { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-nature":  { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-acs":     { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-asa":     { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "refworks-to-vancouver": { provider: () => text("refs.txt", RWS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-apa":          { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-mla":          { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-chicago":      { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-harvard":      { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-ieee":         { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-ama":          { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-nature":       { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-acs":          { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-asa":          { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "wos-to-vancouver":    { provider: () => text("savedrecs.txt", WOS_SAMPLE, "text/plain"), env: "node" },
  "mods-to-apa":         { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-mla":         { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-chicago":     { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-harvard":     { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-ieee":        { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-ama":         { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-nature":      { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-acs":         { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-asa":         { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "mods-to-vancouver":   { provider: () => text("test.mods.xml", MODS_SAMPLE, "application/mods+xml"), env: "node" },
  "marcxml-to-apa":      { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-mla":      { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-chicago":  { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-harvard":  { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-ieee":     { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-ama":      { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-nature":   { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-acs":      { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-asa":      { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "marcxml-to-vancouver": { provider: () => text("catalog.marcxml", MARC_SAMPLE, "application/marcxml+xml"), env: "node" },
  "bibtex-dedupe": { provider: () => text("lib.bib", DUP_BIBTEX_FIXTURE, "application/x-bibtex"), env: "node" },
  "ris-dedupe": { provider: () => text("lib.ris", DUP_RIS_FIXTURE, "application/x-research-info-systems"), env: "node" },
  "csv-dedupe": { provider: () => text("lib.csv", DUP_CSV_FIXTURE, "text/csv"), env: "node" },
  "nbib-dedupe": { provider: () => text("lib.nbib", DUP_RIS_FIXTURE, "application/x-research-info-systems"), env: "node" },
  "csl-json-dedupe": { provider: () => text("lib.json", DUP_CSL_JSON_FIXTURE, "application/json"), env: "node" },
  "enw-dedupe": { provider: () => text("lib.enw", DUP_ENW_FIXTURE, "application/x-endnote-refer"), env: "node" },
  "bibtex-to-apa-intext":      { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-mla-intext":      { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-chicago-intext":  { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-harvard-intext":  { provider: () => text("refs.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-apa-intext":         { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-mla-intext":         { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-chicago-intext":     { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-harvard-intext":     { provider: () => text("refs.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "csl-json-to-apa-intext":    { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csl-json-to-mla-intext":    { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csl-json-to-chicago-intext": { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "csl-json-to-harvard-intext": { provider: () => text("refs.json", F.cslJson, "application/json"), env: "node" },
  "text-to-dois": { provider: () => text("refs.txt", IDENTIFIER_TEXT_FIXTURE, "text/plain"), env: "node" },
  "text-to-pmids": { provider: () => text("refs.txt", IDENTIFIER_TEXT_FIXTURE, "text/plain"), env: "node" },
  "text-to-arxiv-ids": { provider: () => text("refs.txt", IDENTIFIER_TEXT_FIXTURE, "text/plain"), env: "node" },
  "text-to-isbns": { provider: () => text("refs.txt", "Book ISBN 978-0-13-468599-1 and ISBN-10: 0-306-40615-2.", "text/plain"), env: "node" },
  "bibtex-validate": { provider: () => text("lib.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-validate": { provider: () => text("lib.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "references-to-apa-intext": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-mla-intext": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-chicago-intext": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "references-to-harvard-intext": { provider: () => text("refs.txt", REFERENCE_LIST_FIXTURE, "text/plain"), env: "node" },
  "csv-to-apa-intext": { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "csv-to-mla-intext": { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "csv-to-chicago-intext": { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
  "csv-to-harvard-intext": { provider: () => text("refs.csv", CITATION_CSV_FIXTURE, "text/csv"), env: "node" },
};

/** True if we have any fixture for this id (even if it requires browser). */
export function hasFixture(id: string): boolean {
  return id in FIXTURE_PROVIDERS;
}

/** True if the converter can run in our Node test environment. */
export function isNodeTestable(id: string): boolean {
  return FIXTURE_PROVIDERS[id]?.env === "node";
}

/** True if the converter requires a real browser environment. */
export function requiresBrowser(id: string): boolean {
  return FIXTURE_PROVIDERS[id]?.env === "browser";
}
