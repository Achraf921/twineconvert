import type { Converter } from "./types";

/**
 * Lazy converter registry.
 *
 * Each entry maps a tool id ("heic-to-jpg") to a function that imports the
 * converter module on demand. The dynamic `import()` lets the bundler
 * code-split each converter into its own chunk, meaning a user landing on
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
  // HEIC family, uses heic2any (decode via libheif under the hood)
  "heic-to-jpg": () =>
    import("./converters/heic-to-jpg").then((m) => m.default),
  "heic-to-png": () =>
    import("./converters/heic-to-png").then((m) => m.default),
  "heic-to-webp": () =>
    import("./converters/heic-to-webp").then((m) => m.default),

  // Canvas-based image format pairs (no extra deps, uses browser's
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

  // AVIF family, relies on browser-native AVIF decode (Chrome 85+,
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

  // GIF (first frame extraction, animated→video uses FFmpeg family later)
  "gif-to-jpg": () =>
    import("./converters/gif-to-jpg").then((m) => m.default),
  "gif-to-png": () =>
    import("./converters/gif-to-png").then((m) => m.default),

  // Vector → raster (canvas rasterizes SVG via Image src)
  "svg-to-png": () =>
    import("./converters/svg-to-png").then((m) => m.default),
  "svg-to-jpg": () =>
    import("./converters/svg-to-jpg").then((m) => m.default),

  // PDF family, pdfjs-dist for rendering, pdf-lib for assembly + manipulation
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

  // OCR family, tesseract.js (lazy-loaded; ~10MB language model on first use)
  "image-to-text": () =>
    import("./converters/image-to-text").then((m) => m.default),
  "jpg-to-text": () =>
    import("./converters/jpg-to-text").then((m) => m.default),
  "png-to-text": () =>
    import("./converters/png-to-text").then((m) => m.default),
  "pdf-to-text": () =>
    import("./converters/pdf-to-text").then((m) => m.default),

  // AVIF encoding, @jsquash/avif WASM (browser AVIF encode is unreliable)
  "jpg-to-avif": () =>
    import("./converters/jpg-to-avif").then((m) => m.default),
  "png-to-avif": () =>
    import("./converters/png-to-avif").then((m) => m.default),
  "webp-to-avif": () =>
    import("./converters/webp-to-avif").then((m) => m.default),

  // TIFF, utif (browsers don't decode TIFF natively)
  "tiff-to-jpg": () =>
    import("./converters/tiff-to-jpg").then((m) => m.default),
  "tiff-to-png": () =>
    import("./converters/tiff-to-png").then((m) => m.default),
  "tiff-to-pdf": () =>
    import("./converters/tiff-to-pdf").then((m) => m.default),

  // FFmpeg.wasm family, single-threaded core via CDN (no COOP/COEP needed,
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

  // Office documents, mammoth (DOCX), SheetJS (XLSX), Papa Parse (CSV)
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
  "json-to-xlsx": () =>
    import("./converters/json-to-xlsx").then((m) => m.default),

  // YAML/TOML/JSON cross-conversions, lossless data interchange between
  // the three configuration languages developers actually use
  "yaml-to-json": () =>
    import("./converters/yaml-to-json").then((m) => m.default),
  "json-to-yaml": () =>
    import("./converters/json-to-yaml").then((m) => m.default),
  "toml-to-json": () =>
    import("./converters/toml-to-json").then((m) => m.default),
  "json-to-toml": () =>
    import("./converters/json-to-toml").then((m) => m.default),

  // Subtitle format pair (SRT ↔ WebVTT). Captions are identical content
  // between the two; only timestamp punctuation and the WEBVTT header
  // differ. Heavy search demand from YouTubers / video editors.
  "srt-to-vtt": () =>
    import("./converters/srt-to-vtt").then((m) => m.default),
  "vtt-to-srt": () =>
    import("./converters/vtt-to-srt").then((m) => m.default),

  // CSV ↔ TSV (delimiter swap, both lossless tabular)
  "csv-to-tsv": () =>
    import("./converters/csv-to-tsv").then((m) => m.default),
  "tsv-to-csv": () =>
    import("./converters/tsv-to-csv").then((m) => m.default),

  // XML ↔ JSON via fast-xml-parser, opinionated `@`-prefix attribute
  // convention for round-trip
  "xml-to-json": () =>
    import("./converters/xml-to-json").then((m) => m.default),
  "json-to-xml": () =>
    import("./converters/json-to-xml").then((m) => m.default),

  // Markdown ↔ HTML and Markdown → PDF, the writing/blogging chain
  "markdown-to-html": () =>
    import("./converters/markdown-to-html").then((m) => m.default),
  "html-to-markdown": () =>
    import("./converters/html-to-markdown").then((m) => m.default),
  "markdown-to-pdf": () =>
    import("./converters/markdown-to-pdf").then((m) => m.default),

  // EPUB, JSZip + DOMParser (lighter than epubjs for headless extraction)
  "epub-to-text": () =>
    import("./converters/epub-to-text").then((m) => m.default),
  "epub-to-html": () =>
    import("./converters/epub-to-html").then((m) => m.default),
  "epub-to-pdf": () =>
    import("./converters/epub-to-pdf").then((m) => m.default),

  // Finance family, OFX/QFX/QBO share one parser (structurally identical
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

  // Apple Health export, streaming SAX parser, accepts export.zip directly
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

  // Kindle My Clippings.txt, text format, parsed from scratch
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

  // GEDCOM, genealogy interchange (parsed from scratch, text-hierarchical)
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

  // Bibliography, BibTeX, RIS, NBIB, EndNote XML cross-conversions
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

  // ADIF, amateur radio QSO logs
  "adif-to-csv": () =>
    import("./converters/adif-to-csv").then((m) => m.default),
  "csv-to-adif": () =>
    import("./converters/csv-to-adif").then((m) => m.default),
  "adif-to-cabrillo": () =>
    import("./converters/adif-to-cabrillo").then((m) => m.default),
  "adif-to-kml": () =>
    import("./converters/adif-to-kml").then((m) => m.default),

  // Chess PGN, uses chess.js (industry-standard parser/validator)
  "pgn-to-csv": () =>
    import("./converters/pgn-to-csv").then((m) => m.default),
  "pgn-to-fen": () =>
    import("./converters/pgn-to-fen").then((m) => m.default),
  "pgn-to-json": () =>
    import("./converters/pgn-to-json").then((m) => m.default),

  // WhatsApp chat exports, privacy is the SERP wedge here
  "whatsapp-chat-to-csv": () =>
    import("./converters/whatsapp-chat-to-csv").then((m) => m.default),
  "whatsapp-chat-to-json": () =>
    import("./converters/whatsapp-chat-to-json").then((m) => m.default),
  "whatsapp-chat-to-html": () =>
    import("./converters/whatsapp-chat-to-html").then((m) => m.default),
  "whatsapp-chat-to-pdf": () =>
    import("./converters/whatsapp-chat-to-pdf").then((m) => m.default),

  // Email .eml/.mbox, postal-mime + jsPDF render
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

  // Apple iWork, extract embedded preview.pdf from the zip wrapper
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

  // LUT (color grading), pure text formats, all cross-pairs
  "cube-to-3dl": () =>
    import("./converters/cube-to-3dl").then((m) => m.default),
  "3dl-to-cube": () =>
    import("./converters/3dl-to-cube").then((m) => m.default),
  "cube-to-csp": () =>
    import("./converters/cube-to-csp").then((m) => m.default),
  "csp-to-cube": () =>
    import("./converters/csp-to-cube").then((m) => m.default),
  "3dl-to-csp": () =>
    import("./converters/3dl-to-csp").then((m) => m.default),
  "csp-to-3dl": () =>
    import("./converters/csp-to-3dl").then((m) => m.default),

  // Color palette, Adobe ASE, Photoshop ACO, GIMP GPL, JSON, CSS, hex list
  "ase-to-gpl": () =>
    import("./converters/ase-to-gpl").then((m) => m.default),
  "gpl-to-ase": () =>
    import("./converters/gpl-to-ase").then((m) => m.default),
  "ase-to-aco": () =>
    import("./converters/ase-to-aco").then((m) => m.default),
  "aco-to-ase": () =>
    import("./converters/aco-to-ase").then((m) => m.default),
  "aco-to-gpl": () =>
    import("./converters/aco-to-gpl").then((m) => m.default),
  "gpl-to-aco": () =>
    import("./converters/gpl-to-aco").then((m) => m.default),
  "ase-to-css": () =>
    import("./converters/ase-to-css").then((m) => m.default),
  "ase-to-json": () =>
    import("./converters/ase-to-json").then((m) => m.default),
  "hex-to-ase": () =>
    import("./converters/hex-to-ase").then((m) => m.default),
  "hex-to-gpl": () =>
    import("./converters/hex-to-gpl").then((m) => m.default),
  "ase-to-hex": () =>
    import("./converters/ase-to-hex").then((m) => m.default),
  "gpl-to-hex": () =>
    import("./converters/gpl-to-hex").then((m) => m.default),
  "css-to-ase": () =>
    import("./converters/css-to-ase").then((m) => m.default),

  // 3D printing, STL/OBJ ↔ 3MF (the modern Bambu/Prusa container)
  "stl-to-3mf": () =>
    import("./converters/stl-to-3mf").then((m) => m.default),
  "3mf-to-stl": () =>
    import("./converters/3mf-to-stl").then((m) => m.default),
  "obj-to-3mf": () =>
    import("./converters/obj-to-3mf").then((m) => m.default),

  // Music notation, MIDI ↔ MusicXML and compressed MXL extraction
  "midi-to-musicxml": () =>
    import("./converters/midi-to-musicxml").then((m) => m.default),
  "musicxml-to-midi": () =>
    import("./converters/musicxml-to-midi").then((m) => m.default),
  "mxl-to-musicxml": () =>
    import("./converters/mxl-to-musicxml").then((m) => m.default),

  // ============== PROFESSIONAL / B2B beachheads ==============
  // SARIF (DevSecOps reports), pure JSON, high CPM
  "sarif-to-csv": () =>
    import("./converters/sarif-to-csv").then((m) => m.default),
  "sarif-to-html": () =>
    import("./converters/sarif-to-html").then((m) => m.default),

  // EDI (B2B logistics), text grammar
  "edi-to-csv": () =>
    import("./converters/edi-to-csv").then((m) => m.default),
  "edifact-to-csv": () =>
    import("./converters/edifact-to-csv").then((m) => m.default),

  // PACER (legal), public records, empty SERP
  "pacer-docket-to-csv": () =>
    import("./converters/pacer-docket-to-csv").then((m) => m.default),

  // IFC (BIM/AEC), uses web-ifc WASM, highest CPM lane
  "ifc-to-csv": () =>
    import("./converters/ifc-to-csv").then((m) => m.default),
  "ifc-to-gltf": () =>
    import("./converters/ifc-to-gltf").then((m) => m.default),

  // Discord chat exports, OSINT / moderation / archival
  "discord-chat-to-md": () =>
    import("./converters/discord-chat-to-md").then((m) => m.default),
  "discord-chat-to-pdf": () =>
    import("./converters/discord-chat-to-pdf").then((m) => m.default),
  "discord-chat-summary-csv": () =>
    import("./converters/discord-chat-summary-csv").then((m) => m.default),

  // Embroidery, DST/PES/JEF/EXP cross-conversions
  "dst-to-pes": () =>
    import("./converters/dst-to-pes").then((m) => m.default),
  "pes-to-dst": () =>
    import("./converters/pes-to-dst").then((m) => m.default),
  "dst-to-jef": () =>
    import("./converters/dst-to-jef").then((m) => m.default),
  "jef-to-dst": () =>
    import("./converters/jef-to-dst").then((m) => m.default),
  "pes-to-jef": () =>
    import("./converters/pes-to-jef").then((m) => m.default),
  "jef-to-pes": () =>
    import("./converters/jef-to-pes").then((m) => m.default),
  "dst-to-exp": () =>
    import("./converters/dst-to-exp").then((m) => m.default),
  "exp-to-dst": () =>
    import("./converters/exp-to-dst").then((m) => m.default),
  "pes-to-exp": () =>
    import("./converters/pes-to-exp").then((m) => m.default),
  "exp-to-pes": () =>
    import("./converters/exp-to-pes").then((m) => m.default),
  "jef-to-exp": () =>
    import("./converters/jef-to-exp").then((m) => m.default),
  "exp-to-jef": () =>
    import("./converters/exp-to-jef").then((m) => m.default),

  // ============== BIJECTIVITY: reverse-direction additions ==============
  // For every conversion X→Y where the inverse Y→X is technically possible
  // (not lossy enough to produce nonsense), we ship the reverse. The audit
  // documenting one-way-only converters lives in ENGINE-BIJECTIVITY.md.
  "jpg-to-bmp": () =>
    import("./converters/jpg-to-bmp").then((m) => m.default),
  "png-to-bmp": () =>
    import("./converters/png-to-bmp").then((m) => m.default),
  "jpg-to-gif": () =>
    import("./converters/jpg-to-gif").then((m) => m.default),
  "png-to-gif": () =>
    import("./converters/png-to-gif").then((m) => m.default),
  "ico-to-jpg": () =>
    import("./converters/ico-to-jpg").then((m) => m.default),
  "mp3-to-m4a": () =>
    import("./converters/mp3-to-m4a").then((m) => m.default),
  "mp3-to-flac": () =>
    import("./converters/mp3-to-flac").then((m) => m.default),
  "mp3-to-ogg": () =>
    import("./converters/mp3-to-ogg").then((m) => m.default),
  "mp4-to-avi": () =>
    import("./converters/mp4-to-avi").then((m) => m.default),
  "mp4-to-mkv": () =>
    import("./converters/mp4-to-mkv").then((m) => m.default),
  "mp4-to-mov": () =>
    import("./converters/mp4-to-mov").then((m) => m.default),
  "gif-to-mp4": () =>
    import("./converters/gif-to-mp4").then((m) => m.default),
  "musicxml-to-mxl": () =>
    import("./converters/musicxml-to-mxl").then((m) => m.default),
  "cabrillo-to-adif": () =>
    import("./converters/cabrillo-to-adif").then((m) => m.default),
  "3mf-to-obj": () =>
    import("./converters/3mf-to-obj").then((m) => m.default),
  "stl-to-obj": () =>
    import("./converters/stl-to-obj").then((m) => m.default),
  "obj-to-stl": () =>
    import("./converters/obj-to-stl").then((m) => m.default),
  "json-to-gedcom": () =>
    import("./converters/json-to-gedcom").then((m) => m.default),
  "eml-to-mbox": () =>
    import("./converters/eml-to-mbox").then((m) => m.default),
  "csv-to-bibtex": () =>
    import("./converters/csv-to-bibtex").then((m) => m.default),
  "csv-to-ris": () =>
    import("./converters/csv-to-ris").then((m) => m.default),
  "bibtex-to-nbib": () =>
    import("./converters/bibtex-to-nbib").then((m) => m.default),
  "ris-to-nbib": () =>
    import("./converters/ris-to-nbib").then((m) => m.default),
  "bibtex-to-endnote-xml": () =>
    import("./converters/bibtex-to-endnote-xml").then((m) => m.default),
  "ris-to-endnote-xml": () =>
    import("./converters/ris-to-endnote-xml").then((m) => m.default),
  "html-to-docx": () =>
    import("./converters/html-to-docx").then((m) => m.default),
  "txt-to-docx": () =>
    import("./converters/txt-to-docx").then((m) => m.default),

  // Color space conversions (pure math, no deps). Designers + devs.
  "hex-to-rgb": () =>
    import("./converters/hex-to-rgb").then((m) => m.default),
  "rgb-to-hex": () =>
    import("./converters/rgb-to-hex").then((m) => m.default),
  "hex-to-hsl": () =>
    import("./converters/hex-to-hsl").then((m) => m.default),
  "hsl-to-hex": () =>
    import("./converters/hsl-to-hex").then((m) => m.default),
  "rgb-to-hsl": () =>
    import("./converters/rgb-to-hsl").then((m) => m.default),
  "hsl-to-rgb": () =>
    import("./converters/hsl-to-rgb").then((m) => m.default),
  "rgb-to-cmyk": () =>
    import("./converters/rgb-to-cmyk").then((m) => m.default),
  "cmyk-to-rgb": () =>
    import("./converters/cmyk-to-rgb").then((m) => m.default),
  "hex-to-cmyk": () =>
    import("./converters/hex-to-cmyk").then((m) => m.default),
  "cmyk-to-hex": () =>
    import("./converters/cmyk-to-hex").then((m) => m.default),

  // Encoding/decoding (TextEncoder + native btoa/atob). Devs + security pros.
  "text-to-base64": () =>
    import("./converters/text-to-base64").then((m) => m.default),
  "base64-to-text": () =>
    import("./converters/base64-to-text").then((m) => m.default),
  "text-to-url-encoded": () =>
    import("./converters/text-to-url-encoded").then((m) => m.default),
  "url-encoded-to-text": () =>
    import("./converters/url-encoded-to-text").then((m) => m.default),
  "text-to-hex": () =>
    import("./converters/text-to-hex").then((m) => m.default),
  "hex-to-text": () =>
    import("./converters/hex-to-text").then((m) => m.default),

  // File checksums (crypto.subtle for SHA-*, spark-md5 for legacy MD5).
  // Single-action: integrity verification, not bidirectional.
  "file-to-md5": () =>
    import("./converters/file-to-md5").then((m) => m.default),
  "file-to-sha1": () =>
    import("./converters/file-to-sha1").then((m) => m.default),
  "file-to-sha256": () =>
    import("./converters/file-to-sha256").then((m) => m.default),
  "file-to-sha512": () =>
    import("./converters/file-to-sha512").then((m) => m.default),

  // Geographic/GIS formats (parser+emitter built on fast-xml-parser).
  // Lossy on style/extension data, content-preserving on geometry.
  "kml-to-gpx": () =>
    import("./converters/kml-to-gpx").then((m) => m.default),
  "gpx-to-kml": () =>
    import("./converters/gpx-to-kml").then((m) => m.default),
  "kml-to-geojson": () =>
    import("./converters/kml-to-geojson").then((m) => m.default),
  "geojson-to-kml": () =>
    import("./converters/geojson-to-kml").then((m) => m.default),
  "gpx-to-geojson": () =>
    import("./converters/gpx-to-geojson").then((m) => m.default),
  "geojson-to-gpx": () =>
    import("./converters/geojson-to-gpx").then((m) => m.default),

  // JSON Lines (NDJSON) — streaming JSON for data pipelines, ML pipelines.
  "jsonl-to-json": () =>
    import("./converters/jsonl-to-json").then((m) => m.default),
  "json-to-jsonl": () =>
    import("./converters/json-to-jsonl").then((m) => m.default),
  "jsonl-to-csv": () =>
    import("./converters/jsonl-to-csv").then((m) => m.default),
  "csv-to-jsonl": () =>
    import("./converters/csv-to-jsonl").then((m) => m.default),

  // Config formats: INI, .env, YAML↔TOML direct, JSON5.
  "ini-to-json": () =>
    import("./converters/ini-to-json").then((m) => m.default),
  "json-to-ini": () =>
    import("./converters/json-to-ini").then((m) => m.default),
  "env-to-json": () =>
    import("./converters/env-to-json").then((m) => m.default),
  "json-to-env": () =>
    import("./converters/json-to-env").then((m) => m.default),
  "yaml-to-toml": () =>
    import("./converters/yaml-to-toml").then((m) => m.default),
  "toml-to-yaml": () =>
    import("./converters/toml-to-yaml").then((m) => m.default),
  "json5-to-json": () =>
    import("./converters/json5-to-json").then((m) => m.default),

  // SBV subtitles (YouTube SubViewer format).
  "srt-to-sbv": () =>
    import("./converters/srt-to-sbv").then((m) => m.default),
  "sbv-to-srt": () =>
    import("./converters/sbv-to-srt").then((m) => m.default),

  // OpenDocument spreadsheets (LibreOffice / OpenOffice / Numbers fallback).
  "ods-to-csv": () =>
    import("./converters/ods-to-csv").then((m) => m.default),
  "ods-to-xlsx": () =>
    import("./converters/ods-to-xlsx").then((m) => m.default),
  "csv-to-ods": () =>
    import("./converters/csv-to-ods").then((m) => m.default),
  "xlsx-to-ods": () =>
    import("./converters/xlsx-to-ods").then((m) => m.default),

  // Web font formats via fonteditor-core.
  "ttf-to-woff": () =>
    import("./converters/ttf-to-woff").then((m) => m.default),
  "woff-to-ttf": () =>
    import("./converters/woff-to-ttf").then((m) => m.default),
  "otf-to-ttf": () =>
    import("./converters/otf-to-ttf").then((m) => m.default),

  // Tabular table conversions (CSV ↔ Markdown table ↔ HTML table).
  "csv-to-markdown-table": () =>
    import("./converters/csv-to-markdown-table").then((m) => m.default),
  "markdown-table-to-csv": () =>
    import("./converters/markdown-table-to-csv").then((m) => m.default),
  "csv-to-html-table": () =>
    import("./converters/csv-to-html-table").then((m) => m.default),
  "html-table-to-csv": () =>
    import("./converters/html-table-to-csv").then((m) => m.default),

  // SQL dump round-trip (CREATE TABLE + INSERT INTO).
  "csv-to-sql": () =>
    import("./converters/csv-to-sql").then((m) => m.default),
  "sql-to-csv": () =>
    import("./converters/sql-to-csv").then((m) => m.default),
  "json-to-sql": () =>
    import("./converters/json-to-sql").then((m) => m.default),

  // Java .properties + HCL (Terraform) configs.
  "properties-to-json": () =>
    import("./converters/properties-to-json").then((m) => m.default),
  "json-to-properties": () =>
    import("./converters/json-to-properties").then((m) => m.default),
  "hcl-to-json": () =>
    import("./converters/hcl-to-json").then((m) => m.default),

  // CSS named colors (147-color spec).
  "color-name-to-hex": () =>
    import("./converters/color-name-to-hex").then((m) => m.default),
  "hex-to-color-name": () =>
    import("./converters/hex-to-color-name").then((m) => m.default),

  // Date/time normalization (Unix ↔ ISO 8601 ↔ readable).
  "unix-to-iso": () =>
    import("./converters/unix-to-iso").then((m) => m.default),
  "iso-to-unix": () =>
    import("./converters/iso-to-unix").then((m) => m.default),
  "timestamp-to-readable": () =>
    import("./converters/timestamp-to-readable").then((m) => m.default),

  // Modern color spaces (CSS Color Module Level 4) via culori.
  "hex-to-oklch": () =>
    import("./converters/hex-to-oklch").then((m) => m.default),
  "oklch-to-hex": () =>
    import("./converters/oklch-to-hex").then((m) => m.default),
  "rgb-to-oklch": () =>
    import("./converters/rgb-to-oklch").then((m) => m.default),
  "oklch-to-rgb": () =>
    import("./converters/oklch-to-rgb").then((m) => m.default),
  "hex-to-lab": () =>
    import("./converters/hex-to-lab").then((m) => m.default),
  "lab-to-hex": () =>
    import("./converters/lab-to-hex").then((m) => m.default),

  // TSV cross-conversions (gap fill: data interchange matrix completeness).
  "tsv-to-json": () =>
    import("./converters/tsv-to-json").then((m) => m.default),
  "json-to-tsv": () =>
    import("./converters/json-to-tsv").then((m) => m.default),
  "tsv-to-xlsx": () =>
    import("./converters/tsv-to-xlsx").then((m) => m.default),
  "xlsx-to-tsv": () =>
    import("./converters/xlsx-to-tsv").then((m) => m.default),

  // CSV ↔ YAML direct (was only available via JSON pivot before).
  "csv-to-yaml": () =>
    import("./converters/csv-to-yaml").then((m) => m.default),
  "yaml-to-csv": () =>
    import("./converters/yaml-to-csv").then((m) => m.default),

  // Crypto / dev-tool: JWT decode, PEM ↔ DER cert format conversion.
  "jwt-to-json": () =>
    import("./converters/jwt-to-json").then((m) => m.default),
  "pem-to-der": () =>
    import("./converters/pem-to-der").then((m) => m.default),
  "der-to-pem": () =>
    import("./converters/der-to-pem").then((m) => m.default),
};

/** All converter IDs, useful for sitemap generation later. */
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
