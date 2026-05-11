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
  makeTinyDocx,
  makeTinyXlsx,
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
} from "./binary-fixtures";

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
  "mp3-to-wav":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-m4a":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-flac": { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "mp3-to-ogg":  { provider: () => Promise.reject(new Error("mp3 fixture pending")), env: "browser" },
  "wav-to-mp3":  { provider: () => Promise.reject(new Error("wav fixture pending")), env: "browser" },
  "m4a-to-mp3":  { provider: () => Promise.reject(new Error("m4a fixture pending")), env: "browser" },
  "flac-to-mp3": { provider: () => Promise.reject(new Error("flac fixture pending")), env: "browser" },
  "ogg-to-mp3":  { provider: () => Promise.reject(new Error("ogg fixture pending")), env: "browser" },

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
  "json-to-xlsx":  { provider: () => text("test.json", F.jsonArray, "application/json"), env: "node" },
  "json-to-gedcom":{ provider: () => text("test.json", `{"individuals":[{"id":"I1","name":"John /Smith/","sex":"M","familyAsSpouse":[]}]}`, "application/json"), env: "node" },
  "xlsx-to-csv":   { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "xlsx-to-json":  { provider: async () => fileFromBytes("test.xlsx", await makeTinyXlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), env: "node" },
  "docx-to-html":  { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "node" },
  "docx-to-txt":   { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "node" },
  "docx-to-pdf":   { provider: async () => fileFromBytes("test.docx", await makeTinyDocx(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), env: "browser" },
  "html-to-docx":  { provider: () => text("test.html", "<html><body><h1>Hi</h1><p>Hello world.</p></body></html>", "text/html"), env: "node" },
  "txt-to-docx":   { provider: () => text("test.txt", "Line one\nLine two\nLine three", "text/plain"), env: "node" },

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
  "gedcom-to-json": { provider: () => text("test.ged", F.gedcom), env: "node" },
  "gedcom-to-html": { provider: () => text("test.ged", F.gedcom), env: "node" },
  "gedcom-to-pdf":  { provider: () => text("test.ged", F.gedcom), env: "browser" },

  "bibtex-to-ris":         { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-csv":         { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-nbib":        { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "bibtex-to-endnote-xml": { provider: () => text("test.bib", F.bibtex, "application/x-bibtex"), env: "node" },
  "ris-to-bibtex":         { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-csv":            { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-nbib":           { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "ris-to-endnote-xml":    { provider: () => text("test.ris", F.ris, "application/x-research-info-systems"), env: "node" },
  "nbib-to-bibtex":        { provider: () => text("test.nbib", F.nbib, "application/x-research-info-systems"), env: "node" },
  "nbib-to-ris":           { provider: () => text("test.nbib", F.nbib, "application/x-research-info-systems"), env: "node" },
  "endnote-xml-to-bibtex": { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },
  "endnote-xml-to-ris":    { provider: () => text("test.xml", F.endnoteXml, "application/xml"), env: "node" },

  "adif-to-csv":      { provider: () => text("test.adi", F.adif, "application/x-adif"), env: "node" },
  "adif-to-cabrillo": { provider: () => text("test.adi", F.adif, "application/x-adif"), env: "node" },
  "adif-to-kml":      { provider: () => text("test.adi", F.adif, "application/x-adif"), env: "node" },
  "cabrillo-to-adif": { provider: () => text("test.log", F.cabrillo, "text/plain"), env: "node" },

  "pgn-to-csv":  { provider: () => text("test.pgn", `[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0\n`, "application/x-chess-pgn"), env: "node" },
  "pgn-to-fen":  { provider: () => text("test.pgn", `[Event "Test"]\n[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 e5 1-0\n`, "application/x-chess-pgn"), env: "node" },
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
