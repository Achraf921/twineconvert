import type { Converter } from "./types";

/**
 * Lazy converter registry.
 *
 * Each entry maps a tool id ("heic-to-jpg") to a function that imports the
 * converter module on demand. The dynamic `import()` lets the bundler
 * code-split each converter into its own chunk — meaning a user landing on
 * /heic-to-jpg only downloads heic2any, not FFmpeg.wasm + Tesseract + libheif
 * combined.
 *
 * Adding a new converter:
 *   1. Implement it under `./converters/<id>.ts`, default-exporting a Converter
 *   2. Add a single line to the map below
 *   3. Add a tool page at app/<id>/page.tsx (separate concern)
 *
 * The id MUST match the converter's own `id` field and the URL slug exactly.
 */

type ConverterLoader = () => Promise<Converter>;

export const registry: Record<string, ConverterLoader> = {
  // HEIC family — uses heic2any (decode via libheif under the hood)
  "heic-to-jpg": () =>
    import("./converters/heic-to-jpg").then((m) => m.default),
  "heic-to-png": () =>
    import("./converters/heic-to-png").then((m) => m.default),
  "heic-to-webp": () =>
    import("./converters/heic-to-webp").then((m) => m.default),

  // Canvas-based image format pairs (no extra deps — uses browser's
  // native decode + Canvas.toBlob for re-encoding)
  "jpg-to-png": () =>
    import("./converters/jpg-to-png").then((m) => m.default),
  "jpg-to-webp": () =>
    import("./converters/jpg-to-webp").then((m) => m.default),
  "png-to-jpg": () =>
    import("./converters/png-to-jpg").then((m) => m.default),
  "png-to-webp": () =>
    import("./converters/png-to-webp").then((m) => m.default),
  "webp-to-jpg": () =>
    import("./converters/webp-to-jpg").then((m) => m.default),
  "webp-to-png": () =>
    import("./converters/webp-to-png").then((m) => m.default),

  // AVIF family — relies on browser-native AVIF decode (Chrome 85+,
  // Safari 16.4+, Firefox 113+). Older browsers will surface a clean error.
  "avif-to-jpg": () =>
    import("./converters/avif-to-jpg").then((m) => m.default),
  "avif-to-png": () =>
    import("./converters/avif-to-png").then((m) => m.default),
  "avif-to-webp": () =>
    import("./converters/avif-to-webp").then((m) => m.default),

  // Legacy raster
  "bmp-to-jpg": () =>
    import("./converters/bmp-to-jpg").then((m) => m.default),
  "bmp-to-png": () =>
    import("./converters/bmp-to-png").then((m) => m.default),

  // GIF (first frame extraction — animated→video uses FFmpeg family later)
  "gif-to-jpg": () =>
    import("./converters/gif-to-jpg").then((m) => m.default),
  "gif-to-png": () =>
    import("./converters/gif-to-png").then((m) => m.default),

  // Vector → raster (canvas rasterizes SVG via Image src)
  "svg-to-png": () =>
    import("./converters/svg-to-png").then((m) => m.default),
  "svg-to-jpg": () =>
    import("./converters/svg-to-jpg").then((m) => m.default),

  // PDF family — pdfjs-dist for rendering, pdf-lib for assembly + manipulation
  "pdf-to-jpg": () =>
    import("./converters/pdf-to-jpg").then((m) => m.default),
  "pdf-to-png": () =>
    import("./converters/pdf-to-png").then((m) => m.default),
  "jpg-to-pdf": () =>
    import("./converters/jpg-to-pdf").then((m) => m.default),
  "png-to-pdf": () =>
    import("./converters/png-to-pdf").then((m) => m.default),
  "heic-to-pdf": () =>
    import("./converters/heic-to-pdf").then((m) => m.default),
  "webp-to-pdf": () =>
    import("./converters/webp-to-pdf").then((m) => m.default),
  "compress-pdf": () =>
    import("./converters/compress-pdf").then((m) => m.default),

  // OCR family — tesseract.js (lazy-loaded; ~10MB language model on first use)
  "image-to-text": () =>
    import("./converters/image-to-text").then((m) => m.default),
  "jpg-to-text": () =>
    import("./converters/jpg-to-text").then((m) => m.default),
  "png-to-text": () =>
    import("./converters/png-to-text").then((m) => m.default),
  "pdf-to-text": () =>
    import("./converters/pdf-to-text").then((m) => m.default),

  // AVIF encoding — @jsquash/avif WASM (browser AVIF encode is unreliable)
  "jpg-to-avif": () =>
    import("./converters/jpg-to-avif").then((m) => m.default),
  "png-to-avif": () =>
    import("./converters/png-to-avif").then((m) => m.default),
  "webp-to-avif": () =>
    import("./converters/webp-to-avif").then((m) => m.default),

  // TIFF — utif (browsers don't decode TIFF natively)
  "tiff-to-jpg": () =>
    import("./converters/tiff-to-jpg").then((m) => m.default),
  "tiff-to-png": () =>
    import("./converters/tiff-to-png").then((m) => m.default),
  "tiff-to-pdf": () =>
    import("./converters/tiff-to-pdf").then((m) => m.default),

  // FFmpeg.wasm family — single-threaded core via CDN (no COOP/COEP needed,
  // keeps the SEO/ad surface free of cross-origin isolation constraints)
  "mp4-to-mp3": () =>
    import("./converters/mp4-to-mp3").then((m) => m.default),
  "mp4-to-gif": () =>
    import("./converters/mp4-to-gif").then((m) => m.default),
  "mov-to-mp4": () =>
    import("./converters/mov-to-mp4").then((m) => m.default),
  "webm-to-mp4": () =>
    import("./converters/webm-to-mp4").then((m) => m.default),
  "avi-to-mp4": () =>
    import("./converters/avi-to-mp4").then((m) => m.default),
  "mkv-to-mp4": () =>
    import("./converters/mkv-to-mp4").then((m) => m.default),
  "mp3-to-wav": () =>
    import("./converters/mp3-to-wav").then((m) => m.default),
  "wav-to-mp3": () =>
    import("./converters/wav-to-mp3").then((m) => m.default),
  "m4a-to-mp3": () =>
    import("./converters/m4a-to-mp3").then((m) => m.default),
  "flac-to-mp3": () =>
    import("./converters/flac-to-mp3").then((m) => m.default),
  "ogg-to-mp3": () =>
    import("./converters/ogg-to-mp3").then((m) => m.default),

  // Office documents — mammoth (DOCX), SheetJS (XLSX), Papa Parse (CSV)
  "docx-to-html": () =>
    import("./converters/docx-to-html").then((m) => m.default),
  "docx-to-txt": () =>
    import("./converters/docx-to-txt").then((m) => m.default),
  "docx-to-pdf": () =>
    import("./converters/docx-to-pdf").then((m) => m.default),
  "xlsx-to-csv": () =>
    import("./converters/xlsx-to-csv").then((m) => m.default),
  "xlsx-to-json": () =>
    import("./converters/xlsx-to-json").then((m) => m.default),
  "csv-to-xlsx": () =>
    import("./converters/csv-to-xlsx").then((m) => m.default),
  "csv-to-json": () =>
    import("./converters/csv-to-json").then((m) => m.default),
  "json-to-csv": () =>
    import("./converters/json-to-csv").then((m) => m.default),

  // EPUB — JSZip + DOMParser (lighter than epubjs for headless extraction)
  "epub-to-text": () =>
    import("./converters/epub-to-text").then((m) => m.default),
  "epub-to-html": () =>
    import("./converters/epub-to-html").then((m) => m.default),
  "epub-to-pdf": () =>
    import("./converters/epub-to-pdf").then((m) => m.default),

  // Finance family — OFX/QFX/QBO share one parser (structurally identical
  // formats); QIF is a separate text format. CSV is the universal bridge.
  // Beachhead niche: weak SERP competition + privacy-conscious audience.
  "ofx-to-csv": () =>
    import("./converters/ofx-to-csv").then((m) => m.default),
  "qfx-to-csv": () =>
    import("./converters/qfx-to-csv").then((m) => m.default),
  "qbo-to-csv": () =>
    import("./converters/qbo-to-csv").then((m) => m.default),
  "qif-to-csv": () =>
    import("./converters/qif-to-csv").then((m) => m.default),
  "csv-to-ofx": () =>
    import("./converters/csv-to-ofx").then((m) => m.default),
  "csv-to-qfx": () =>
    import("./converters/csv-to-qfx").then((m) => m.default),
  "csv-to-qbo": () =>
    import("./converters/csv-to-qbo").then((m) => m.default),
  "csv-to-qif": () =>
    import("./converters/csv-to-qif").then((m) => m.default),
  "ofx-to-qif": () =>
    import("./converters/ofx-to-qif").then((m) => m.default),
  "qif-to-ofx": () =>
    import("./converters/qif-to-ofx").then((m) => m.default),

  // Apple Health export — streaming SAX parser, accepts export.zip directly
  // (we extract export.xml from inside via JSZip) or the raw export.xml
  "apple-health-to-csv": () =>
    import("./converters/apple-health-to-csv").then((m) => m.default),
  "apple-health-to-json": () =>
    import("./converters/apple-health-to-json").then((m) => m.default),
  "apple-health-heart-rate-to-csv": () =>
    import("./converters/apple-health-heart-rate-to-csv").then((m) => m.default),
  "apple-health-steps-to-csv": () =>
    import("./converters/apple-health-steps-to-csv").then((m) => m.default),
  "apple-health-sleep-to-csv": () =>
    import("./converters/apple-health-sleep-to-csv").then((m) => m.default),
  "apple-health-workouts-to-csv": () =>
    import("./converters/apple-health-workouts-to-csv").then((m) => m.default),

  // Kindle My Clippings.txt — text format, parsed from scratch
  "kindle-clippings-to-csv": () =>
    import("./converters/kindle-clippings-to-csv").then((m) => m.default),
  "kindle-clippings-to-json": () =>
    import("./converters/kindle-clippings-to-json").then((m) => m.default),
  "kindle-clippings-to-markdown": () =>
    import("./converters/kindle-clippings-to-markdown").then((m) => m.default),
  "kindle-clippings-to-obsidian-md": () =>
    import("./converters/kindle-clippings-to-obsidian-md").then((m) => m.default),
  "kindle-clippings-to-notion-csv": () =>
    import("./converters/kindle-clippings-to-notion-csv").then((m) => m.default),
  "kindle-clippings-to-readwise-csv": () =>
    import("./converters/kindle-clippings-to-readwise-csv").then((m) => m.default),

  // GEDCOM — genealogy interchange (parsed from scratch, text-hierarchical)
  "gedcom-to-csv": () =>
    import("./converters/gedcom-to-csv").then((m) => m.default),
  "gedcom-to-json": () =>
    import("./converters/gedcom-to-json").then((m) => m.default),
  "gedcom-to-html": () =>
    import("./converters/gedcom-to-html").then((m) => m.default),
  "gedcom-to-pdf": () =>
    import("./converters/gedcom-to-pdf").then((m) => m.default),
  "csv-to-gedcom": () =>
    import("./converters/csv-to-gedcom").then((m) => m.default),

  // Bibliography — BibTeX, RIS, NBIB, EndNote XML cross-conversions
  // Unified Citation type bridges N parsers × M writers.
  "bibtex-to-ris": () =>
    import("./converters/bibtex-to-ris").then((m) => m.default),
  "ris-to-bibtex": () =>
    import("./converters/ris-to-bibtex").then((m) => m.default),
  "nbib-to-bibtex": () =>
    import("./converters/nbib-to-bibtex").then((m) => m.default),
  "nbib-to-ris": () =>
    import("./converters/nbib-to-ris").then((m) => m.default),
  "endnote-xml-to-bibtex": () =>
    import("./converters/endnote-xml-to-bibtex").then((m) => m.default),
  "endnote-xml-to-ris": () =>
    import("./converters/endnote-xml-to-ris").then((m) => m.default),
  "bibtex-to-csv": () =>
    import("./converters/bibtex-to-csv").then((m) => m.default),
  "ris-to-csv": () =>
    import("./converters/ris-to-csv").then((m) => m.default),

  // ADIF — amateur radio QSO logs
  "adif-to-csv": () =>
    import("./converters/adif-to-csv").then((m) => m.default),
  "csv-to-adif": () =>
    import("./converters/csv-to-adif").then((m) => m.default),
  "adif-to-cabrillo": () =>
    import("./converters/adif-to-cabrillo").then((m) => m.default),
  "adif-to-kml": () =>
    import("./converters/adif-to-kml").then((m) => m.default),

  // Chess PGN — uses chess.js (industry-standard parser/validator)
  "pgn-to-csv": () =>
    import("./converters/pgn-to-csv").then((m) => m.default),
  "pgn-to-fen": () =>
    import("./converters/pgn-to-fen").then((m) => m.default),
  "pgn-to-json": () =>
    import("./converters/pgn-to-json").then((m) => m.default),

  // WhatsApp chat exports — privacy is the SERP wedge here
  "whatsapp-chat-to-csv": () =>
    import("./converters/whatsapp-chat-to-csv").then((m) => m.default),
  "whatsapp-chat-to-json": () =>
    import("./converters/whatsapp-chat-to-json").then((m) => m.default),
  "whatsapp-chat-to-html": () =>
    import("./converters/whatsapp-chat-to-html").then((m) => m.default),
  "whatsapp-chat-to-pdf": () =>
    import("./converters/whatsapp-chat-to-pdf").then((m) => m.default),

  // Email .eml/.mbox — postal-mime + jsPDF render
  "eml-to-pdf": () =>
    import("./converters/eml-to-pdf").then((m) => m.default),
  "eml-to-html": () =>
    import("./converters/eml-to-html").then((m) => m.default),
  "eml-to-csv": () =>
    import("./converters/eml-to-csv").then((m) => m.default),
  "mbox-to-eml": () =>
    import("./converters/mbox-to-eml").then((m) => m.default),
  "mbox-to-pdf": () =>
    import("./converters/mbox-to-pdf").then((m) => m.default),

  // Apple iWork — extract embedded preview.pdf from the zip wrapper
  "pages-to-pdf": () =>
    import("./converters/pages-to-pdf").then((m) => m.default),
  "numbers-to-pdf": () =>
    import("./converters/numbers-to-pdf").then((m) => m.default),
  "keynote-to-pdf": () =>
    import("./converters/keynote-to-pdf").then((m) => m.default),

  // Mainstream high-volume "let's see what ranks" plays
  "pdf-to-docx": () =>
    import("./converters/pdf-to-docx").then((m) => m.default),
  "png-to-ico": () =>
    import("./converters/png-to-ico").then((m) => m.default),
  "jpg-to-ico": () =>
    import("./converters/jpg-to-ico").then((m) => m.default),
  "ico-to-png": () =>
    import("./converters/ico-to-png").then((m) => m.default),
  "remove-background": () =>
    import("./converters/remove-background").then((m) => m.default),

  // Social media archive viewers (post-platform-migration churn)
  "twitter-archive-to-csv": () =>
    import("./converters/twitter-archive-to-csv").then((m) => m.default),
  "twitter-archive-to-html": () =>
    import("./converters/twitter-archive-to-html").then((m) => m.default),
  "instagram-data-to-csv": () =>
    import("./converters/instagram-data-to-csv").then((m) => m.default),
  "instagram-data-to-html": () =>
    import("./converters/instagram-data-to-html").then((m) => m.default),
  "facebook-archive-to-html": () =>
    import("./converters/facebook-archive-to-html").then((m) => m.default),
};

/** All converter IDs — useful for sitemap generation later. */
export type ConverterId = keyof typeof registry;

export function isKnownConverter(id: string): id is ConverterId {
  return Object.prototype.hasOwnProperty.call(registry, id);
}

export function listConverterIds(): ConverterId[] {
  return Object.keys(registry) as ConverterId[];
}

/** Loads a converter. Cached per id so repeated calls don't re-import. */
const cache = new Map<string, Promise<Converter>>();

export function loadConverter(id: ConverterId): Promise<Converter> {
  let promise = cache.get(id);
  if (!promise) {
    promise = registry[id]();
    cache.set(id, promise);
  }
  return promise;
}
