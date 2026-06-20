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

  // Image format matrix gap fills (canvas decode + webp/gif/bmp encode)
  "svg-to-webp": () => import("./converters/svg-to-webp").then((m) => m.default),
  "gif-to-webp": () => import("./converters/gif-to-webp").then((m) => m.default),
  "bmp-to-webp": () => import("./converters/bmp-to-webp").then((m) => m.default),
  "ico-to-webp": () => import("./converters/ico-to-webp").then((m) => m.default),
  "webp-to-gif": () => import("./converters/webp-to-gif").then((m) => m.default),
  "avif-to-gif": () => import("./converters/avif-to-gif").then((m) => m.default),
  "bmp-to-gif": () => import("./converters/bmp-to-gif").then((m) => m.default),
  "webp-to-bmp": () => import("./converters/webp-to-bmp").then((m) => m.default),
  "gif-to-bmp": () => import("./converters/gif-to-bmp").then((m) => m.default),
  "avif-to-bmp": () => import("./converters/avif-to-bmp").then((m) => m.default),
  "gif-to-avif": () => import("./converters/gif-to-avif").then((m) => m.default),
  "bmp-to-avif": () => import("./converters/bmp-to-avif").then((m) => m.default),
  "svg-to-avif": () => import("./converters/svg-to-avif").then((m) => m.default),
  "ico-to-avif": () => import("./converters/ico-to-avif").then((m) => m.default),
  "svg-to-gif": () => import("./converters/svg-to-gif").then((m) => m.default),
  "ico-to-gif": () => import("./converters/ico-to-gif").then((m) => m.default),
  "svg-to-bmp": () => import("./converters/svg-to-bmp").then((m) => m.default),
  "ico-to-bmp": () => import("./converters/ico-to-bmp").then((m) => m.default),
  "tiff-to-webp": () => import("./converters/tiff-to-webp").then((m) => m.default),

  // Tabular hub gap fills (markdown-table / html-table / json / xlsx)
  "markdown-table-to-html-table": () =>
    import("./converters/markdown-table-to-html-table").then((m) => m.default),
  "html-table-to-markdown-table": () =>
    import("./converters/html-table-to-markdown-table").then((m) => m.default),
  "markdown-table-to-json": () =>
    import("./converters/markdown-table-to-json").then((m) => m.default),
  "json-to-markdown-table": () =>
    import("./converters/json-to-markdown-table").then((m) => m.default),
  "html-table-to-json": () =>
    import("./converters/html-table-to-json").then((m) => m.default),
  "json-to-html-table": () =>
    import("./converters/json-to-html-table").then((m) => m.default),
  "markdown-table-to-xlsx": () =>
    import("./converters/markdown-table-to-xlsx").then((m) => m.default),
  "html-table-to-xlsx": () =>
    import("./converters/html-table-to-xlsx").then((m) => m.default),
  "xlsx-to-markdown-table": () =>
    import("./converters/xlsx-to-markdown-table").then((m) => m.default),
  "xlsx-to-html-table": () =>
    import("./converters/xlsx-to-html-table").then((m) => m.default),

  // Spreadsheet -> citation bridge (researcher reference sheets -> RIS/BibTeX/...)
  "xlsx-to-ris": () => import("./converters/xlsx-to-ris").then((m) => m.default),
  "xlsx-to-bibtex": () => import("./converters/xlsx-to-bibtex").then((m) => m.default),
  "xlsx-to-csl-json": () => import("./converters/xlsx-to-csl-json").then((m) => m.default),
  "xlsx-to-endnote-xml": () => import("./converters/xlsx-to-endnote-xml").then((m) => m.default),
  "xlsx-to-nbib": () => import("./converters/xlsx-to-nbib").then((m) => m.default),
  "ods-to-ris": () => import("./converters/ods-to-ris").then((m) => m.default),
  "ods-to-bibtex": () => import("./converters/ods-to-bibtex").then((m) => m.default),
  "ods-to-csl-json": () => import("./converters/ods-to-csl-json").then((m) => m.default),
  "ods-to-endnote-xml": () => import("./converters/ods-to-endnote-xml").then((m) => m.default),
  "ods-to-nbib": () => import("./converters/ods-to-nbib").then((m) => m.default),

  // Config serialization cross-matrix (yaml/toml/json5/ini <-> xml + to yaml/toml)
  "yaml-to-xml": () => import("./converters/yaml-to-xml").then((m) => m.default),
  "xml-to-yaml": () => import("./converters/xml-to-yaml").then((m) => m.default),
  "toml-to-xml": () => import("./converters/toml-to-xml").then((m) => m.default),
  "xml-to-toml": () => import("./converters/xml-to-toml").then((m) => m.default),
  "json5-to-yaml": () => import("./converters/json5-to-yaml").then((m) => m.default),
  "json5-to-xml": () => import("./converters/json5-to-xml").then((m) => m.default),
  "json5-to-toml": () => import("./converters/json5-to-toml").then((m) => m.default),
  "ini-to-yaml": () => import("./converters/ini-to-yaml").then((m) => m.default),
  "ini-to-xml": () => import("./converters/ini-to-xml").then((m) => m.default),
  "ini-to-toml": () => import("./converters/ini-to-toml").then((m) => m.default),

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
  "m4v-to-mp4": () =>
    import("./converters/m4v-to-mp4").then((m) => m.default),
  "3gp-to-mp4": () =>
    import("./converters/3gp-to-mp4").then((m) => m.default),
  "flv-to-mp4": () =>
    import("./converters/flv-to-mp4").then((m) => m.default),
  "wmv-to-mp4": () =>
    import("./converters/wmv-to-mp4").then((m) => m.default),
  "mts-to-mp4": () =>
    import("./converters/mts-to-mp4").then((m) => m.default),
  "mp4-to-webm": () =>
    import("./converters/mp4-to-webm").then((m) => m.default),
  "mov-to-gif": () =>
    import("./converters/mov-to-gif").then((m) => m.default),
  "mpg-to-mp4": () =>
    import("./converters/mpg-to-mp4").then((m) => m.default),
  "mpeg-to-mp4": () =>
    import("./converters/mpeg-to-mp4").then((m) => m.default),
  "vob-to-mp4": () =>
    import("./converters/vob-to-mp4").then((m) => m.default),

  // Industry batch: lyrics + DICOM extensions
  "lrc-to-srt": () =>
    import("./converters/lrc-to-srt").then((m) => m.default),
  "lrc-to-vtt": () =>
    import("./converters/lrc-to-vtt").then((m) => m.default),
  "srt-to-lrc": () =>
    import("./converters/srt-to-lrc").then((m) => m.default),
  "dicom-to-jpg": () =>
    import("./converters/dicom-to-jpg").then((m) => m.default),
  "dicom-to-pdf": () =>
    import("./converters/dicom-to-pdf").then((m) => m.default),

  // Music sheet rendering via Verovio
  "musicxml-to-svg": () =>
    import("./converters/musicxml-to-svg").then((m) => m.default),
  "musicxml-to-pdf": () =>
    import("./converters/musicxml-to-pdf").then((m) => m.default),
  "mxl-to-svg": () =>
    import("./converters/mxl-to-svg").then((m) => m.default),

  // GIS: WKT / WKB <-> GeoJSON (PostGIS / Mapbox interop)
  "wkt-to-geojson": () =>
    import("./converters/wkt-to-geojson").then((m) => m.default),
  "geojson-to-wkt": () =>
    import("./converters/geojson-to-wkt").then((m) => m.default),
  "wkb-to-geojson": () =>
    import("./converters/wkb-to-geojson").then((m) => m.default),
  "geojson-to-wkb": () =>
    import("./converters/geojson-to-wkb").then((m) => m.default),

  // Binary serialization: MessagePack + CBOR <-> JSON
  "msgpack-to-json": () =>
    import("./converters/msgpack-to-json").then((m) => m.default),
  "json-to-msgpack": () =>
    import("./converters/json-to-msgpack").then((m) => m.default),
  "cbor-to-json": () =>
    import("./converters/cbor-to-json").then((m) => m.default),
  "json-to-cbor": () =>
    import("./converters/json-to-cbor").then((m) => m.default),

  // Bioinformatics: FASTA / FASTQ <-> JSON
  "fasta-to-json": () =>
    import("./converters/fasta-to-json").then((m) => m.default),
  "json-to-fasta": () =>
    import("./converters/json-to-fasta").then((m) => m.default),
  "fastq-to-json": () =>
    import("./converters/fastq-to-json").then((m) => m.default),
  "json-to-fastq": () =>
    import("./converters/json-to-fastq").then((m) => m.default),

  // BitTorrent: Bencode <-> JSON
  "bencode-to-json": () =>
    import("./converters/bencode-to-json").then((m) => m.default),
  "json-to-bencode": () =>
    import("./converters/json-to-bencode").then((m) => m.default),

  // Technical docs + diagrams
  "asciidoc-to-html": () =>
    import("./converters/asciidoc-to-html").then((m) => m.default),
  "dot-to-svg": () =>
    import("./converters/dot-to-svg").then((m) => m.default),
  "dot-to-png": () =>
    import("./converters/dot-to-png").then((m) => m.default),

  // HTTP archive (HAR) <-> curl
  "har-to-curl": () =>
    import("./converters/har-to-curl").then((m) => m.default),
  "curl-to-har": () =>
    import("./converters/curl-to-har").then((m) => m.default),

  // Citation hub completion: CSL-JSON / EndNote XML / NBIB cross-pairs
  "csl-json-to-ris": () =>
    import("./converters/csl-json-to-ris").then((m) => m.default),
  "ris-to-csl-json": () =>
    import("./converters/ris-to-csl-json").then((m) => m.default),
  "csl-json-to-csv": () =>
    import("./converters/csl-json-to-csv").then((m) => m.default),
  "csv-to-csl-json": () =>
    import("./converters/csv-to-csl-json").then((m) => m.default),
  "csl-json-to-nbib": () =>
    import("./converters/csl-json-to-nbib").then((m) => m.default),
  "nbib-to-csl-json": () =>
    import("./converters/nbib-to-csl-json").then((m) => m.default),
  "csl-json-to-endnote-xml": () =>
    import("./converters/csl-json-to-endnote-xml").then((m) => m.default),
  "endnote-xml-to-csl-json": () =>
    import("./converters/endnote-xml-to-csl-json").then((m) => m.default),
  "endnote-xml-to-csv": () =>
    import("./converters/endnote-xml-to-csv").then((m) => m.default),
  "csv-to-endnote-xml": () =>
    import("./converters/csv-to-endnote-xml").then((m) => m.default),
  "endnote-xml-to-nbib": () =>
    import("./converters/endnote-xml-to-nbib").then((m) => m.default),
  "nbib-to-endnote-xml": () =>
    import("./converters/nbib-to-endnote-xml").then((m) => m.default),
  "nbib-to-csv": () =>
    import("./converters/nbib-to-csv").then((m) => m.default),
  "csv-to-nbib": () =>
    import("./converters/csv-to-nbib").then((m) => m.default),
  "endnote-xml-to-xlsx": () =>
    import("./converters/endnote-xml-to-xlsx").then((m) => m.default),
  "csl-json-to-xlsx": () =>
    import("./converters/csl-json-to-xlsx").then((m) => m.default),

  // Citation bibliography renders: {ris,nbib,csl-json,endnote-xml} -> {markdown,html,yaml}
  "ris-to-markdown": () =>
    import("./converters/ris-to-markdown").then((m) => m.default),
  "ris-to-html": () =>
    import("./converters/ris-to-html").then((m) => m.default),
  "ris-to-yaml": () =>
    import("./converters/ris-to-yaml").then((m) => m.default),
  "nbib-to-markdown": () =>
    import("./converters/nbib-to-markdown").then((m) => m.default),
  "nbib-to-html": () =>
    import("./converters/nbib-to-html").then((m) => m.default),
  "nbib-to-yaml": () =>
    import("./converters/nbib-to-yaml").then((m) => m.default),
  "csl-json-to-markdown": () =>
    import("./converters/csl-json-to-markdown").then((m) => m.default),
  "csl-json-to-html": () =>
    import("./converters/csl-json-to-html").then((m) => m.default),
  "csl-json-to-yaml": () =>
    import("./converters/csl-json-to-yaml").then((m) => m.default),
  "endnote-xml-to-markdown": () =>
    import("./converters/endnote-xml-to-markdown").then((m) => m.default),
  "endnote-xml-to-html": () =>
    import("./converters/endnote-xml-to-html").then((m) => m.default),
  "endnote-xml-to-yaml": () =>
    import("./converters/endnote-xml-to-yaml").then((m) => m.default),

  // EndNote ENW (Refer/tagged) <-> citation hub
  "enw-to-bibtex": () =>
    import("./converters/enw-to-bibtex").then((m) => m.default),
  "enw-to-ris": () =>
    import("./converters/enw-to-ris").then((m) => m.default),
  "enw-to-nbib": () =>
    import("./converters/enw-to-nbib").then((m) => m.default),
  "enw-to-endnote-xml": () =>
    import("./converters/enw-to-endnote-xml").then((m) => m.default),
  "enw-to-csl-json": () =>
    import("./converters/enw-to-csl-json").then((m) => m.default),
  "enw-to-csv": () =>
    import("./converters/enw-to-csv").then((m) => m.default),
  "enw-to-xlsx": () =>
    import("./converters/enw-to-xlsx").then((m) => m.default),
  "enw-to-markdown": () =>
    import("./converters/enw-to-markdown").then((m) => m.default),
  "enw-to-html": () =>
    import("./converters/enw-to-html").then((m) => m.default),
  "enw-to-yaml": () =>
    import("./converters/enw-to-yaml").then((m) => m.default),
  "bibtex-to-enw": () =>
    import("./converters/bibtex-to-enw").then((m) => m.default),
  "ris-to-enw": () =>
    import("./converters/ris-to-enw").then((m) => m.default),
  "nbib-to-enw": () =>
    import("./converters/nbib-to-enw").then((m) => m.default),
  "endnote-xml-to-enw": () =>
    import("./converters/endnote-xml-to-enw").then((m) => m.default),
  "csl-json-to-enw": () =>
    import("./converters/csl-json-to-enw").then((m) => m.default),
  "csv-to-enw": () =>
    import("./converters/csv-to-enw").then((m) => m.default),

  // Web of Science / ISI tagged export (import-only) -> citation hub
  "wos-to-bibtex": () =>
    import("./converters/wos-to-bibtex").then((m) => m.default),
  "wos-to-ris": () =>
    import("./converters/wos-to-ris").then((m) => m.default),
  "wos-to-nbib": () =>
    import("./converters/wos-to-nbib").then((m) => m.default),
  "wos-to-endnote-xml": () =>
    import("./converters/wos-to-endnote-xml").then((m) => m.default),
  "wos-to-csl-json": () =>
    import("./converters/wos-to-csl-json").then((m) => m.default),
  "wos-to-csv": () =>
    import("./converters/wos-to-csv").then((m) => m.default),
  "wos-to-xlsx": () =>
    import("./converters/wos-to-xlsx").then((m) => m.default),
  "wos-to-markdown": () =>
    import("./converters/wos-to-markdown").then((m) => m.default),
  "wos-to-html": () =>
    import("./converters/wos-to-html").then((m) => m.default),
  "wos-to-yaml": () =>
    import("./converters/wos-to-yaml").then((m) => m.default),

  // RefWorks tagged format <-> citation hub
  "refworks-to-bibtex": () =>
    import("./converters/refworks-to-bibtex").then((m) => m.default),
  "refworks-to-ris": () =>
    import("./converters/refworks-to-ris").then((m) => m.default),
  "refworks-to-nbib": () =>
    import("./converters/refworks-to-nbib").then((m) => m.default),
  "refworks-to-endnote-xml": () =>
    import("./converters/refworks-to-endnote-xml").then((m) => m.default),
  "refworks-to-csl-json": () =>
    import("./converters/refworks-to-csl-json").then((m) => m.default),
  "refworks-to-csv": () =>
    import("./converters/refworks-to-csv").then((m) => m.default),
  "refworks-to-xlsx": () =>
    import("./converters/refworks-to-xlsx").then((m) => m.default),
  "refworks-to-markdown": () =>
    import("./converters/refworks-to-markdown").then((m) => m.default),
  "refworks-to-html": () =>
    import("./converters/refworks-to-html").then((m) => m.default),
  "refworks-to-yaml": () =>
    import("./converters/refworks-to-yaml").then((m) => m.default),
  "bibtex-to-refworks": () =>
    import("./converters/bibtex-to-refworks").then((m) => m.default),
  "ris-to-refworks": () =>
    import("./converters/ris-to-refworks").then((m) => m.default),
  "nbib-to-refworks": () =>
    import("./converters/nbib-to-refworks").then((m) => m.default),
  "endnote-xml-to-refworks": () =>
    import("./converters/endnote-xml-to-refworks").then((m) => m.default),
  "csl-json-to-refworks": () =>
    import("./converters/csl-json-to-refworks").then((m) => m.default),
  "csv-to-refworks": () =>
    import("./converters/csv-to-refworks").then((m) => m.default),

  // MODS XML (Library of Congress) <-> citation hub
  "mods-to-bibtex": () =>
    import("./converters/mods-to-bibtex").then((m) => m.default),
  "mods-to-ris": () =>
    import("./converters/mods-to-ris").then((m) => m.default),
  "mods-to-nbib": () =>
    import("./converters/mods-to-nbib").then((m) => m.default),
  "mods-to-endnote-xml": () =>
    import("./converters/mods-to-endnote-xml").then((m) => m.default),
  "mods-to-csl-json": () =>
    import("./converters/mods-to-csl-json").then((m) => m.default),
  "mods-to-csv": () =>
    import("./converters/mods-to-csv").then((m) => m.default),
  "mods-to-xlsx": () =>
    import("./converters/mods-to-xlsx").then((m) => m.default),
  "mods-to-markdown": () =>
    import("./converters/mods-to-markdown").then((m) => m.default),
  "mods-to-html": () =>
    import("./converters/mods-to-html").then((m) => m.default),
  "mods-to-yaml": () =>
    import("./converters/mods-to-yaml").then((m) => m.default),
  "bibtex-to-mods": () =>
    import("./converters/bibtex-to-mods").then((m) => m.default),
  "ris-to-mods": () =>
    import("./converters/ris-to-mods").then((m) => m.default),
  "nbib-to-mods": () =>
    import("./converters/nbib-to-mods").then((m) => m.default),
  "endnote-xml-to-mods": () =>
    import("./converters/endnote-xml-to-mods").then((m) => m.default),
  "csl-json-to-mods": () =>
    import("./converters/csl-json-to-mods").then((m) => m.default),
  "csv-to-mods": () =>
    import("./converters/csv-to-mods").then((m) => m.default),

  // MARCXML (MARC21 slim, library catalogs; import-only) -> citation hub
  "marcxml-to-bibtex": () =>
    import("./converters/marcxml-to-bibtex").then((m) => m.default),
  "marcxml-to-ris": () =>
    import("./converters/marcxml-to-ris").then((m) => m.default),
  "marcxml-to-nbib": () =>
    import("./converters/marcxml-to-nbib").then((m) => m.default),
  "marcxml-to-endnote-xml": () =>
    import("./converters/marcxml-to-endnote-xml").then((m) => m.default),
  "marcxml-to-csl-json": () =>
    import("./converters/marcxml-to-csl-json").then((m) => m.default),
  "marcxml-to-csv": () =>
    import("./converters/marcxml-to-csv").then((m) => m.default),
  "marcxml-to-xlsx": () =>
    import("./converters/marcxml-to-xlsx").then((m) => m.default),
  "marcxml-to-markdown": () =>
    import("./converters/marcxml-to-markdown").then((m) => m.default),
  "marcxml-to-html": () =>
    import("./converters/marcxml-to-html").then((m) => m.default),
  "marcxml-to-yaml": () =>
    import("./converters/marcxml-to-yaml").then((m) => m.default),

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
  "aac-to-mp3": () =>
    import("./converters/aac-to-mp3").then((m) => m.default),
  "opus-to-mp3": () =>
    import("./converters/opus-to-mp3").then((m) => m.default),
  "wma-to-mp3": () =>
    import("./converters/wma-to-mp3").then((m) => m.default),
  "aiff-to-mp3": () =>
    import("./converters/aiff-to-mp3").then((m) => m.default),
  "amr-to-mp3": () =>
    import("./converters/amr-to-mp3").then((m) => m.default),
  "mp3-to-aac": () =>
    import("./converters/mp3-to-aac").then((m) => m.default),
  "mp3-to-m4r": () =>
    import("./converters/mp3-to-m4r").then((m) => m.default),

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

  // Contacts (vCard) + calendar (iCalendar) + RTF text extraction
  "vcf-to-csv": () =>
    import("./converters/vcf-to-csv").then((m) => m.default),
  "csv-to-vcf": () =>
    import("./converters/csv-to-vcf").then((m) => m.default),
  "vcf-to-json": () =>
    import("./converters/vcf-to-json").then((m) => m.default),
  "ics-to-csv": () =>
    import("./converters/ics-to-csv").then((m) => m.default),
  "csv-to-ics": () =>
    import("./converters/csv-to-ics").then((m) => m.default),
  "ics-to-json": () =>
    import("./converters/ics-to-json").then((m) => m.default),
  "rtf-to-txt": () =>
    import("./converters/rtf-to-txt").then((m) => m.default),
  "rtf-to-html": () =>
    import("./converters/rtf-to-html").then((m) => m.default),
  "rtf-to-docx": () =>
    import("./converters/rtf-to-docx").then((m) => m.default),
  "rtf-to-markdown": () =>
    import("./converters/rtf-to-markdown").then((m) => m.default),
  "xlsx-to-html": () =>
    import("./converters/xlsx-to-html").then((m) => m.default),
  "html-to-xlsx": () =>
    import("./converters/html-to-xlsx").then((m) => m.default),
  "html-to-csv": () =>
    import("./converters/html-to-csv").then((m) => m.default),
  "vcf-to-xlsx": () =>
    import("./converters/vcf-to-xlsx").then((m) => m.default),
  "ics-to-xlsx": () =>
    import("./converters/ics-to-xlsx").then((m) => m.default),
  "xml-to-csv": () =>
    import("./converters/xml-to-csv").then((m) => m.default),
  "csv-to-html": () =>
    import("./converters/csv-to-html").then((m) => m.default),

  // PSD + MSG (external research batch)
  "psd-to-png": () =>
    import("./converters/psd-to-png").then((m) => m.default),
  "psd-to-jpg": () =>
    import("./converters/psd-to-jpg").then((m) => m.default),
  "msg-to-eml": () =>
    import("./converters/msg-to-eml").then((m) => m.default),
  "msg-to-csv": () =>
    import("./converters/msg-to-csv").then((m) => m.default),
  "msg-to-pdf": () =>
    import("./converters/msg-to-pdf").then((m) => m.default),
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
  "markdown-to-docx": () =>
    import("./converters/markdown-to-docx").then((m) => m.default),
  "docx-to-markdown": () =>
    import("./converters/docx-to-markdown").then((m) => m.default),
  "markdown-to-txt": () =>
    import("./converters/markdown-to-txt").then((m) => m.default),
  "html-to-txt": () =>
    import("./converters/html-to-txt").then((m) => m.default),
  "txt-to-html": () =>
    import("./converters/txt-to-html").then((m) => m.default),

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
  "gedcom-to-xlsx": () =>
    import("./converters/gedcom-to-xlsx").then((m) => m.default),
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
  "bibtex-to-apa": () =>
    import("./converters/bibtex-to-apa").then((m) => m.default),
  "ris-to-apa": () =>
    import("./converters/ris-to-apa").then((m) => m.default),
  "nbib-to-apa": () =>
    import("./converters/nbib-to-apa").then((m) => m.default),
  "csl-json-to-apa": () =>
    import("./converters/csl-json-to-apa").then((m) => m.default),
  "bibtex-to-mla": () =>
    import("./converters/bibtex-to-mla").then((m) => m.default),
  "ris-to-mla": () =>
    import("./converters/ris-to-mla").then((m) => m.default),
  "nbib-to-mla": () =>
    import("./converters/nbib-to-mla").then((m) => m.default),
  "csl-json-to-mla": () =>
    import("./converters/csl-json-to-mla").then((m) => m.default),
  "bibtex-to-chicago": () =>
    import("./converters/bibtex-to-chicago").then((m) => m.default),
  "ris-to-chicago": () =>
    import("./converters/ris-to-chicago").then((m) => m.default),
  "nbib-to-chicago": () =>
    import("./converters/nbib-to-chicago").then((m) => m.default),
  "csl-json-to-chicago": () =>
    import("./converters/csl-json-to-chicago").then((m) => m.default),
  "csv-to-apa": () =>
    import("./converters/csv-to-apa").then((m) => m.default),
  "csv-to-mla": () =>
    import("./converters/csv-to-mla").then((m) => m.default),
  "csv-to-chicago": () =>
    import("./converters/csv-to-chicago").then((m) => m.default),
  "xlsx-to-apa": () =>
    import("./converters/xlsx-to-apa").then((m) => m.default),
  "xlsx-to-mla": () =>
    import("./converters/xlsx-to-mla").then((m) => m.default),
  "xlsx-to-chicago": () =>
    import("./converters/xlsx-to-chicago").then((m) => m.default),
  "bibtex-to-harvard": () =>
    import("./converters/bibtex-to-harvard").then((m) => m.default),
  "ris-to-harvard": () =>
    import("./converters/ris-to-harvard").then((m) => m.default),
  "nbib-to-harvard": () =>
    import("./converters/nbib-to-harvard").then((m) => m.default),
  "csl-json-to-harvard": () =>
    import("./converters/csl-json-to-harvard").then((m) => m.default),
  "csv-to-harvard": () =>
    import("./converters/csv-to-harvard").then((m) => m.default),
  "xlsx-to-harvard": () =>
    import("./converters/xlsx-to-harvard").then((m) => m.default),
  "bibtex-to-ieee": () =>
    import("./converters/bibtex-to-ieee").then((m) => m.default),
  "ris-to-ieee": () =>
    import("./converters/ris-to-ieee").then((m) => m.default),
  "nbib-to-ieee": () =>
    import("./converters/nbib-to-ieee").then((m) => m.default),
  "csl-json-to-ieee": () =>
    import("./converters/csl-json-to-ieee").then((m) => m.default),
  "csv-to-ieee": () =>
    import("./converters/csv-to-ieee").then((m) => m.default),
  "xlsx-to-ieee": () =>
    import("./converters/xlsx-to-ieee").then((m) => m.default),
  "references-to-apa": () =>
    import("./converters/references-to-apa").then((m) => m.default),
  "references-to-mla": () =>
    import("./converters/references-to-mla").then((m) => m.default),
  "references-to-chicago": () =>
    import("./converters/references-to-chicago").then((m) => m.default),
  "references-to-harvard": () =>
    import("./converters/references-to-harvard").then((m) => m.default),
  "references-to-ieee": () =>
    import("./converters/references-to-ieee").then((m) => m.default),
  "bibtex-to-ama": () =>
    import("./converters/bibtex-to-ama").then((m) => m.default),
  "ris-to-ama": () =>
    import("./converters/ris-to-ama").then((m) => m.default),
  "nbib-to-ama": () =>
    import("./converters/nbib-to-ama").then((m) => m.default),
  "csl-json-to-ama": () =>
    import("./converters/csl-json-to-ama").then((m) => m.default),
  "csv-to-ama": () =>
    import("./converters/csv-to-ama").then((m) => m.default),
  "xlsx-to-ama": () =>
    import("./converters/xlsx-to-ama").then((m) => m.default),
  "references-to-ama": () =>
    import("./converters/references-to-ama").then((m) => m.default),
  "bibtex-to-nature": () =>
    import("./converters/bibtex-to-nature").then((m) => m.default),
  "ris-to-nature": () =>
    import("./converters/ris-to-nature").then((m) => m.default),
  "nbib-to-nature": () =>
    import("./converters/nbib-to-nature").then((m) => m.default),
  "csl-json-to-nature": () =>
    import("./converters/csl-json-to-nature").then((m) => m.default),
  "csv-to-nature": () =>
    import("./converters/csv-to-nature").then((m) => m.default),
  "xlsx-to-nature": () =>
    import("./converters/xlsx-to-nature").then((m) => m.default),
  "references-to-nature": () =>
    import("./converters/references-to-nature").then((m) => m.default),
  "bibtex-to-acs": () =>
    import("./converters/bibtex-to-acs").then((m) => m.default),
  "ris-to-acs": () =>
    import("./converters/ris-to-acs").then((m) => m.default),
  "nbib-to-acs": () =>
    import("./converters/nbib-to-acs").then((m) => m.default),
  "csl-json-to-acs": () =>
    import("./converters/csl-json-to-acs").then((m) => m.default),
  "csv-to-acs": () =>
    import("./converters/csv-to-acs").then((m) => m.default),
  "xlsx-to-acs": () =>
    import("./converters/xlsx-to-acs").then((m) => m.default),
  "references-to-acs": () =>
    import("./converters/references-to-acs").then((m) => m.default),
  "bibtex-to-asa": () =>
    import("./converters/bibtex-to-asa").then((m) => m.default),
  "ris-to-asa": () =>
    import("./converters/ris-to-asa").then((m) => m.default),
  "nbib-to-asa": () =>
    import("./converters/nbib-to-asa").then((m) => m.default),
  "csl-json-to-asa": () =>
    import("./converters/csl-json-to-asa").then((m) => m.default),
  "csv-to-asa": () =>
    import("./converters/csv-to-asa").then((m) => m.default),
  "xlsx-to-asa": () =>
    import("./converters/xlsx-to-asa").then((m) => m.default),
  "references-to-asa": () =>
    import("./converters/references-to-asa").then((m) => m.default),
  "bibtex-to-vancouver": () =>
    import("./converters/bibtex-to-vancouver").then((m) => m.default),
  "ris-to-vancouver": () =>
    import("./converters/ris-to-vancouver").then((m) => m.default),
  "nbib-to-vancouver": () =>
    import("./converters/nbib-to-vancouver").then((m) => m.default),
  "csl-json-to-vancouver": () =>
    import("./converters/csl-json-to-vancouver").then((m) => m.default),
  "csv-to-vancouver": () =>
    import("./converters/csv-to-vancouver").then((m) => m.default),
  "xlsx-to-vancouver": () =>
    import("./converters/xlsx-to-vancouver").then((m) => m.default),
  "references-to-vancouver": () =>
    import("./converters/references-to-vancouver").then((m) => m.default),
  "enw-to-apa": () =>
    import("./converters/enw-to-apa").then((m) => m.default),
  "enw-to-mla": () =>
    import("./converters/enw-to-mla").then((m) => m.default),
  "enw-to-chicago": () =>
    import("./converters/enw-to-chicago").then((m) => m.default),
  "enw-to-harvard": () =>
    import("./converters/enw-to-harvard").then((m) => m.default),
  "enw-to-ieee": () =>
    import("./converters/enw-to-ieee").then((m) => m.default),
  "enw-to-ama": () =>
    import("./converters/enw-to-ama").then((m) => m.default),
  "enw-to-nature": () =>
    import("./converters/enw-to-nature").then((m) => m.default),
  "enw-to-acs": () =>
    import("./converters/enw-to-acs").then((m) => m.default),
  "enw-to-asa": () =>
    import("./converters/enw-to-asa").then((m) => m.default),
  "enw-to-vancouver": () =>
    import("./converters/enw-to-vancouver").then((m) => m.default),
  "ods-to-apa": () =>
    import("./converters/ods-to-apa").then((m) => m.default),
  "ods-to-mla": () =>
    import("./converters/ods-to-mla").then((m) => m.default),
  "ods-to-chicago": () =>
    import("./converters/ods-to-chicago").then((m) => m.default),
  "ods-to-harvard": () =>
    import("./converters/ods-to-harvard").then((m) => m.default),
  "ods-to-ieee": () =>
    import("./converters/ods-to-ieee").then((m) => m.default),
  "ods-to-ama": () =>
    import("./converters/ods-to-ama").then((m) => m.default),
  "ods-to-nature": () =>
    import("./converters/ods-to-nature").then((m) => m.default),
  "ods-to-acs": () =>
    import("./converters/ods-to-acs").then((m) => m.default),
  "ods-to-asa": () =>
    import("./converters/ods-to-asa").then((m) => m.default),
  "ods-to-vancouver": () =>
    import("./converters/ods-to-vancouver").then((m) => m.default),
  "refworks-to-apa": () =>
    import("./converters/refworks-to-apa").then((m) => m.default),
  "refworks-to-mla": () =>
    import("./converters/refworks-to-mla").then((m) => m.default),
  "refworks-to-chicago": () =>
    import("./converters/refworks-to-chicago").then((m) => m.default),
  "refworks-to-harvard": () =>
    import("./converters/refworks-to-harvard").then((m) => m.default),
  "refworks-to-ieee": () =>
    import("./converters/refworks-to-ieee").then((m) => m.default),
  "refworks-to-ama": () =>
    import("./converters/refworks-to-ama").then((m) => m.default),
  "refworks-to-nature": () =>
    import("./converters/refworks-to-nature").then((m) => m.default),
  "refworks-to-acs": () =>
    import("./converters/refworks-to-acs").then((m) => m.default),
  "refworks-to-asa": () =>
    import("./converters/refworks-to-asa").then((m) => m.default),
  "refworks-to-vancouver": () =>
    import("./converters/refworks-to-vancouver").then((m) => m.default),
  "wos-to-apa": () =>
    import("./converters/wos-to-apa").then((m) => m.default),
  "wos-to-mla": () =>
    import("./converters/wos-to-mla").then((m) => m.default),
  "wos-to-chicago": () =>
    import("./converters/wos-to-chicago").then((m) => m.default),
  "wos-to-harvard": () =>
    import("./converters/wos-to-harvard").then((m) => m.default),
  "wos-to-ieee": () =>
    import("./converters/wos-to-ieee").then((m) => m.default),
  "wos-to-ama": () =>
    import("./converters/wos-to-ama").then((m) => m.default),
  "wos-to-nature": () =>
    import("./converters/wos-to-nature").then((m) => m.default),
  "wos-to-acs": () =>
    import("./converters/wos-to-acs").then((m) => m.default),
  "wos-to-asa": () =>
    import("./converters/wos-to-asa").then((m) => m.default),
  "wos-to-vancouver": () =>
    import("./converters/wos-to-vancouver").then((m) => m.default),
  "mods-to-apa": () =>
    import("./converters/mods-to-apa").then((m) => m.default),
  "mods-to-mla": () =>
    import("./converters/mods-to-mla").then((m) => m.default),
  "mods-to-chicago": () =>
    import("./converters/mods-to-chicago").then((m) => m.default),
  "mods-to-harvard": () =>
    import("./converters/mods-to-harvard").then((m) => m.default),
  "mods-to-ieee": () =>
    import("./converters/mods-to-ieee").then((m) => m.default),
  "mods-to-ama": () =>
    import("./converters/mods-to-ama").then((m) => m.default),
  "mods-to-nature": () =>
    import("./converters/mods-to-nature").then((m) => m.default),
  "mods-to-acs": () =>
    import("./converters/mods-to-acs").then((m) => m.default),
  "mods-to-asa": () =>
    import("./converters/mods-to-asa").then((m) => m.default),
  "mods-to-vancouver": () =>
    import("./converters/mods-to-vancouver").then((m) => m.default),
  "marcxml-to-apa": () =>
    import("./converters/marcxml-to-apa").then((m) => m.default),
  "marcxml-to-mla": () =>
    import("./converters/marcxml-to-mla").then((m) => m.default),
  "marcxml-to-chicago": () =>
    import("./converters/marcxml-to-chicago").then((m) => m.default),
  "marcxml-to-harvard": () =>
    import("./converters/marcxml-to-harvard").then((m) => m.default),
  "marcxml-to-ieee": () =>
    import("./converters/marcxml-to-ieee").then((m) => m.default),
  "marcxml-to-ama": () =>
    import("./converters/marcxml-to-ama").then((m) => m.default),
  "marcxml-to-nature": () =>
    import("./converters/marcxml-to-nature").then((m) => m.default),
  "marcxml-to-acs": () =>
    import("./converters/marcxml-to-acs").then((m) => m.default),
  "marcxml-to-asa": () =>
    import("./converters/marcxml-to-asa").then((m) => m.default),
  "marcxml-to-vancouver": () =>
    import("./converters/marcxml-to-vancouver").then((m) => m.default),
  "bibtex-dedupe": () =>
    import("./converters/bibtex-dedupe").then((m) => m.default),
  "ris-dedupe": () =>
    import("./converters/ris-dedupe").then((m) => m.default),
  "csv-dedupe": () =>
    import("./converters/csv-dedupe").then((m) => m.default),
  "nbib-dedupe": () =>
    import("./converters/nbib-dedupe").then((m) => m.default),
  "csl-json-dedupe": () =>
    import("./converters/csl-json-dedupe").then((m) => m.default),
  "enw-dedupe": () =>
    import("./converters/enw-dedupe").then((m) => m.default),
  "bibtex-to-apa-intext": () =>
    import("./converters/bibtex-to-apa-intext").then((m) => m.default),
  "bibtex-to-mla-intext": () =>
    import("./converters/bibtex-to-mla-intext").then((m) => m.default),
  "bibtex-to-chicago-intext": () =>
    import("./converters/bibtex-to-chicago-intext").then((m) => m.default),
  "bibtex-to-harvard-intext": () =>
    import("./converters/bibtex-to-harvard-intext").then((m) => m.default),
  "ris-to-apa-intext": () =>
    import("./converters/ris-to-apa-intext").then((m) => m.default),
  "ris-to-mla-intext": () =>
    import("./converters/ris-to-mla-intext").then((m) => m.default),
  "ris-to-chicago-intext": () =>
    import("./converters/ris-to-chicago-intext").then((m) => m.default),
  "ris-to-harvard-intext": () =>
    import("./converters/ris-to-harvard-intext").then((m) => m.default),
  "csl-json-to-apa-intext": () =>
    import("./converters/csl-json-to-apa-intext").then((m) => m.default),
  "csl-json-to-mla-intext": () =>
    import("./converters/csl-json-to-mla-intext").then((m) => m.default),
  "csl-json-to-chicago-intext": () =>
    import("./converters/csl-json-to-chicago-intext").then((m) => m.default),
  "csl-json-to-harvard-intext": () =>
    import("./converters/csl-json-to-harvard-intext").then((m) => m.default),
  "text-to-dois": () =>
    import("./converters/text-to-dois").then((m) => m.default),
  "text-to-pmids": () =>
    import("./converters/text-to-pmids").then((m) => m.default),
  "text-to-arxiv-ids": () =>
    import("./converters/text-to-arxiv-ids").then((m) => m.default),
  "bibtex-to-xlsx": () =>
    import("./converters/bibtex-to-xlsx").then((m) => m.default),
  "ris-to-xlsx": () =>
    import("./converters/ris-to-xlsx").then((m) => m.default),
  "nbib-to-xlsx": () =>
    import("./converters/nbib-to-xlsx").then((m) => m.default),

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
  "fen-to-pgn": () =>
    import("./converters/fen-to-pgn").then((m) => m.default),
  "fen-to-png": () =>
    import("./converters/fen-to-png").then((m) => m.default),
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
  "mbox-to-csv": () =>
    import("./converters/mbox-to-csv").then((m) => m.default),
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
  "references-to-ris": () =>
    import("./converters/references-to-ris").then((m) => m.default),
  "references-to-bibtex": () =>
    import("./converters/references-to-bibtex").then((m) => m.default),
  "references-to-csl-json": () =>
    import("./converters/references-to-csl-json").then((m) => m.default),
  "references-to-enw": () =>
    import("./converters/references-to-enw").then((m) => m.default),
  "references-to-endnote-xml": () =>
    import("./converters/references-to-endnote-xml").then((m) => m.default),
  "references-to-nbib": () =>
    import("./converters/references-to-nbib").then((m) => m.default),
  "references-to-csv": () =>
    import("./converters/references-to-csv").then((m) => m.default),
  "references-to-xlsx": () =>
    import("./converters/references-to-xlsx").then((m) => m.default),
  "pubmed-to-ris": () =>
    import("./converters/pubmed-to-ris").then((m) => m.default),
  "pubmed-to-bibtex": () =>
    import("./converters/pubmed-to-bibtex").then((m) => m.default),
  "pubmed-to-csv": () =>
    import("./converters/pubmed-to-csv").then((m) => m.default),
  "pubmed-to-csl-json": () =>
    import("./converters/pubmed-to-csl-json").then((m) => m.default),
  "pubmed-to-enw": () =>
    import("./converters/pubmed-to-enw").then((m) => m.default),
  "pubmed-to-endnote-xml": () =>
    import("./converters/pubmed-to-endnote-xml").then((m) => m.default),
  "pubmed-to-nbib": () =>
    import("./converters/pubmed-to-nbib").then((m) => m.default),
  "pubmed-to-xlsx": () =>
    import("./converters/pubmed-to-xlsx").then((m) => m.default),
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

  // ASS / SSA subtitles (Aegisub, anime fansubs, libass-rendered overlays).
  // ASS dominates anywhere subtitles need styling beyond what SRT/VTT
  // express: positioning, fonts, colors, karaoke timing.
  "srt-to-ass": () => import("./converters/srt-to-ass").then((m) => m.default),
  "ass-to-srt": () => import("./converters/ass-to-srt").then((m) => m.default),
  "vtt-to-ass": () => import("./converters/vtt-to-ass").then((m) => m.default),
  "ass-to-vtt": () => import("./converters/ass-to-vtt").then((m) => m.default),

  // Subtitle transcripts (plain-text extraction) + matrix gap fills.
  "srt-to-txt": () => import("./converters/srt-to-txt").then((m) => m.default),
  "vtt-to-txt": () => import("./converters/vtt-to-txt").then((m) => m.default),
  "ass-to-txt": () => import("./converters/ass-to-txt").then((m) => m.default),
  "sbv-to-txt": () => import("./converters/sbv-to-txt").then((m) => m.default),
  "lrc-to-txt": () => import("./converters/lrc-to-txt").then((m) => m.default),
  "vtt-to-sbv": () => import("./converters/vtt-to-sbv").then((m) => m.default),
  "ass-to-sbv": () => import("./converters/ass-to-sbv").then((m) => m.default),
  "sbv-to-vtt": () => import("./converters/sbv-to-vtt").then((m) => m.default),
  "sbv-to-ass": () => import("./converters/sbv-to-ass").then((m) => m.default),

  // CAD: AutoCAD ASCII DXF. Universal 2D-CAD interchange format read by
  // AutoCAD, LibreCAD, QCAD, BricsCAD, FreeCAD, OnShape, Fusion 360,
  // TinkerCAD, KiCad, EAGLE, laser-cutter control software, etc.
  // dxf-to-svg renders for the browser/web; dxf-to-json gives a
  // structured entity list for programmatic CAD analysis.
  "dxf-to-svg": () => import("./converters/dxf-to-svg").then((m) => m.default),
  "dxf-to-json": () => import("./converters/dxf-to-json").then((m) => m.default),

  // 3D model interchange: glTF 2.0 binary (.glb) ↔ STL/OBJ. GLB is the
  // web-native format: Three.js, Babylon, model-viewer, Blender, USDZ,
  // and every AR/VR pipeline reads it. STL is the 3D-printing standard;
  // OBJ is the legacy DCC interchange. Custom parser/writer keeps the
  // bundle light (no @gltf-transform or three.js dependency).
  "stl-to-glb": () => import("./converters/stl-to-glb").then((m) => m.default),
  "glb-to-stl": () => import("./converters/glb-to-stl").then((m) => m.default),
  "obj-to-glb": () => import("./converters/obj-to-glb").then((m) => m.default),
  "glb-to-obj": () => import("./converters/glb-to-obj").then((m) => m.default),

  // DICOM medical imaging. Every X-ray, CT, MRI, ultrasound, mammogram,
  // PET scan from every modern PACS is DICOM. Browser-only conversion
  // is the HIPAA story: patient data never leaves the radiologist's
  // machine, unlike upload-based DICOM viewers. dicom-to-json extracts
  // metadata for triage; dicom-to-png renders the first frame.
  "dicom-to-json": () => import("./converters/dicom-to-json").then((m) => m.default),
  "dicom-to-png": () => import("./converters/dicom-to-png").then((m) => m.default),

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

  // Gettext PO (software localization). Spoken by every translation
  // toolchain: Poedit, Lokalise, Crowdin, Weblate, Transifex, polib,
  // react-i18next, Django gettext, etc. Lossless round-trip preserves
  // msgctxt, msgid_plural, plural msgstr arrays, comments, references,
  // and flags through both CSV and JSON.
  "po-to-csv": () => import("./converters/po-to-csv").then((m) => m.default),
  "csv-to-po": () => import("./converters/csv-to-po").then((m) => m.default),
  "po-to-json": () => import("./converters/po-to-json").then((m) => m.default),
  "json-to-po": () => import("./converters/json-to-po").then((m) => m.default),

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

  // Medical: HL7 v2.x messaging (universal hospital data exchange).
  "hl7-to-csv": () =>
    import("./converters/hl7-to-csv").then((m) => m.default),
  "hl7-to-json": () =>
    import("./converters/hl7-to-json").then((m) => m.default),
  "json-to-hl7": () =>
    import("./converters/json-to-hl7").then((m) => m.default),

  // Medical: FHIR R4 Bundle resources (modern interop).
  "fhir-bundle-to-csv": () =>
    import("./converters/fhir-bundle-to-csv").then((m) => m.default),
  "csv-to-fhir-bundle": () =>
    import("./converters/csv-to-fhir-bundle").then((m) => m.default),

  // Medical: C-CDA Clinical Document Architecture (Meaningful Use docs).
  "ccda-to-html": () =>
    import("./converters/ccda-to-html").then((m) => m.default),
  "ccda-to-json": () =>
    import("./converters/ccda-to-json").then((m) => m.default),

  // Legal: eDiscovery production load files (Concordance/Relativity).
  "dat-to-csv": () =>
    import("./converters/dat-to-csv").then((m) => m.default),
  "csv-to-dat": () =>
    import("./converters/csv-to-dat").then((m) => m.default),
  "opt-to-csv": () =>
    import("./converters/opt-to-csv").then((m) => m.default),

  // Academic: BibTeX expanded family. CSL-JSON is Zotero/Pandoc native;
  // YAML is the Pandoc Markdown bibliography format; Markdown/HTML are
  // for embedding rendered bibliographies in blog posts and papers. All
  // route through the unified Citation model in util/citation.ts.
  "bibtex-to-csl-json": () =>
    import("./converters/bibtex-to-csl-json").then((m) => m.default),
  "csl-json-to-bibtex": () =>
    import("./converters/csl-json-to-bibtex").then((m) => m.default),
  "bibtex-to-yaml": () =>
    import("./converters/bibtex-to-yaml").then((m) => m.default),
  "yaml-to-bibtex": () =>
    import("./converters/yaml-to-bibtex").then((m) => m.default),
  "bibtex-to-markdown": () =>
    import("./converters/bibtex-to-markdown").then((m) => m.default),
  "bibtex-to-html": () =>
    import("./converters/bibtex-to-html").then((m) => m.default),
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
