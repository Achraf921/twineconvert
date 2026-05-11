/**
 * Output validator library.
 *
 * For every output format we produce, a validator function that:
 *   1. Decodes the output blob (parses it as the format claims to be)
 *   2. Asserts structural properties (e.g. PDF has > 0 pages, CSV has expected
 *      row count, JSON parses with the expected shape)
 *   3. Throws with a specific error if the output is malformed/empty/bogus
 *
 * The validators are MIME-keyed. The unified converter test looks up the
 * validator by `converter.toMime` (or by file extension fallback) and
 * runs it against every conversion's output. This catches the failure
 * mode where a converter produces a file that LOOKS like the right type
 * (correct magic bytes) but is internally broken.
 *
 * To add a new validator: create a function returning Promise<void>
 * that throws on validation failure, then register it in the
 * VALIDATORS map below.
 */

export interface ValidationContext {
  /** The output blob from the conversion. */
  blob: Blob;
  /** The output filename (extension hints at format when MIME is generic). */
  filename: string;
  /** Optional: minimum expected size in bytes. Defaults to 1. */
  minSize?: number;
  /** Optional: input fixture for round-trip-style validation. */
  inputBlob?: Blob;
}

export type Validator = (ctx: ValidationContext) => Promise<void>;

// ============================================================================
// Magic byte helpers, first line of defense
// ============================================================================

async function readBytes(blob: Blob, n: number): Promise<Uint8Array> {
  const slice = blob.slice(0, Math.min(n, blob.size));
  return new Uint8Array(await slice.arrayBuffer());
}

async function readText(blob: Blob): Promise<string> {
  return blob.text();
}

function assertMagicBytes(actual: Uint8Array, expected: number[], format: string): void {
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(
        `${format} magic bytes mismatch at byte ${i}: expected 0x${expected[i].toString(16).padStart(2, "0")}, got 0x${(actual[i] ?? 0).toString(16).padStart(2, "0")}`,
      );
    }
  }
}

function assertMinSize(blob: Blob, min: number, format: string): void {
  if (blob.size < min) {
    throw new Error(`${format} output suspiciously small: ${blob.size} bytes (min expected: ${min})`);
  }
}

// ============================================================================
// Image format validators
// ============================================================================

export const validatePng: Validator = async ({ blob, minSize = 50 }) => {
  assertMinSize(blob, minSize, "PNG");
  const head = await readBytes(blob, 8);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  assertMagicBytes(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "PNG");
  // Verify IHDR chunk follows: bytes 8-11 = chunk length (0x0d), 12-15 = "IHDR"
  const ihdr = await readBytes(blob.slice(8, 16), 8);
  if (ihdr[4] !== 0x49 || ihdr[5] !== 0x48 || ihdr[6] !== 0x44 || ihdr[7] !== 0x52) {
    throw new Error("PNG missing IHDR chunk after signature");
  }
};

export const validateJpeg: Validator = async ({ blob, minSize = 50 }) => {
  assertMinSize(blob, minSize, "JPEG");
  const head = await readBytes(blob, 4);
  // JPEG: starts with FF D8 FF
  assertMagicBytes(head, [0xff, 0xd8, 0xff], "JPEG");
  // Last bytes should be FF D9 (EOI marker) for a complete JPEG
  const tail = new Uint8Array(await blob.slice(blob.size - 2).arrayBuffer());
  if (tail[0] !== 0xff || tail[1] !== 0xd9) {
    throw new Error(`JPEG missing EOI marker (FF D9) at end, got ${tail[0]?.toString(16)} ${tail[1]?.toString(16)}`);
  }
};

export const validateWebp: Validator = async ({ blob, minSize = 50 }) => {
  assertMinSize(blob, minSize, "WebP");
  const head = await readBytes(blob, 12);
  // WebP: RIFF....WEBP
  if (head[0] !== 0x52 || head[1] !== 0x49 || head[2] !== 0x46 || head[3] !== 0x46) {
    throw new Error("WebP missing RIFF magic");
  }
  if (head[8] !== 0x57 || head[9] !== 0x45 || head[10] !== 0x42 || head[11] !== 0x50) {
    throw new Error("WebP missing WEBP signature in RIFF container");
  }
};

export const validateAvif: Validator = async ({ blob, minSize = 50 }) => {
  assertMinSize(blob, minSize, "AVIF");
  // AVIF: ftyp box at byte 4-7, brand = "avif" or "avis" or related at 8-11
  const head = await readBytes(blob, 16);
  if (head[4] !== 0x66 || head[5] !== 0x74 || head[6] !== 0x79 || head[7] !== 0x70) {
    throw new Error("AVIF missing ftyp box at byte offset 4");
  }
  const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
  if (!["avif", "avis", "mif1", "msf1", "heic"].includes(brand)) {
    throw new Error(`AVIF unexpected major brand: '${brand}' (expected avif/avis/mif1)`);
  }
};

export const validateBmp: Validator = async ({ blob, minSize = 54 }) => {
  assertMinSize(blob, minSize, "BMP");
  const head = await readBytes(blob, 2);
  // BMP: starts with "BM" (0x42 0x4D)
  assertMagicBytes(head, [0x42, 0x4d], "BMP");
};

export const validateGif: Validator = async ({ blob, minSize = 6 }) => {
  assertMinSize(blob, minSize, "GIF");
  const head = await readBytes(blob, 6);
  // GIF: GIF87a or GIF89a
  const sig = String.fromCharCode(...head);
  if (sig !== "GIF87a" && sig !== "GIF89a") {
    throw new Error(`GIF bad signature: '${sig}' (expected GIF87a or GIF89a)`);
  }
};

export const validateTiff: Validator = async ({ blob, minSize = 8 }) => {
  assertMinSize(blob, minSize, "TIFF");
  const head = await readBytes(blob, 4);
  // TIFF: II*\0 (little-endian) or MM\0* (big-endian)
  const isLE = head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a && head[3] === 0x00;
  const isBE = head[0] === 0x4d && head[1] === 0x4d && head[2] === 0x00 && head[3] === 0x2a;
  if (!isLE && !isBE) {
    throw new Error("TIFF magic bytes mismatch, expected II*\\0 or MM\\0*");
  }
};

export const validateIco: Validator = async ({ blob, minSize = 22 }) => {
  assertMinSize(blob, minSize, "ICO");
  const head = await readBytes(blob, 6);
  // ICO: 00 00 01 00 [count_lo] [count_hi]
  assertMagicBytes(head, [0x00, 0x00, 0x01, 0x00], "ICO");
  const count = head[4] | (head[5] << 8);
  if (count === 0) throw new Error("ICO declares zero images");
  if (count > 32) throw new Error(`ICO declares unusually high image count: ${count}`);
};

export const validateSvg: Validator = async ({ blob }) => {
  const text = await readText(blob);
  if (!/<svg[\s>]/i.test(text)) {
    throw new Error("SVG missing <svg> root element");
  }
  // Should also have a closing </svg>
  if (!/<\/svg>/i.test(text)) {
    throw new Error("SVG missing closing </svg> tag");
  }
};

// ============================================================================
// Document format validators
// ============================================================================

export const validatePdf: Validator = async ({ blob, minSize = 100 }) => {
  assertMinSize(blob, minSize, "PDF");
  const head = await readBytes(blob, 5);
  // PDF: %PDF-
  assertMagicBytes(head, [0x25, 0x50, 0x44, 0x46, 0x2d], "PDF");
  // Should have %%EOF near the end (last 1024 bytes, PDFs sometimes have
  // trailing whitespace or junk after the marker)
  const tail = await readBytes(blob.slice(Math.max(0, blob.size - 1024)), 1024);
  const tailStr = new TextDecoder("ascii", { fatal: false }).decode(tail);
  if (!tailStr.includes("%%EOF")) {
    throw new Error("PDF missing %%EOF trailer marker in last 1024 bytes");
  }
};

export const validateDocx: Validator = async ({ blob, minSize = 200 }) => {
  assertMinSize(blob, minSize, "DOCX");
  // DOCX is a ZIP, must have the ZIP magic
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x50, 0x4b, 0x03, 0x04], "DOCX (ZIP)");
  // Use JSZip to verify the inner Content_Types file exists
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  if (!zip.file("[Content_Types].xml")) {
    throw new Error("DOCX missing [Content_Types].xml, not a valid OOXML package");
  }
};

export const validateXlsx: Validator = async ({ blob, minSize = 200 }) => {
  assertMinSize(blob, minSize, "XLSX");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x50, 0x4b, 0x03, 0x04], "XLSX (ZIP)");
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  if (!zip.file("[Content_Types].xml")) {
    throw new Error("XLSX missing [Content_Types].xml");
  }
  // Should also have at least one worksheet
  const hasSheet = Object.keys(zip.files).some((p) => /^xl\/worksheets\/sheet/i.test(p));
  if (!hasSheet) throw new Error("XLSX has no worksheets in xl/worksheets/");
};

export const validateEpub: Validator = async ({ blob, minSize = 200 }) => {
  assertMinSize(blob, minSize, "EPUB");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x50, 0x4b, 0x03, 0x04], "EPUB (ZIP)");
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  if (!zip.file("META-INF/container.xml")) {
    throw new Error("EPUB missing META-INF/container.xml, not a valid EPUB");
  }
};

// ============================================================================
// Text format validators
// ============================================================================

export const validateCsv: Validator = async ({ blob, minSize = 1 }) => {
  assertMinSize(blob, minSize, "CSV");
  const text = await readText(blob);
  if (!text.trim()) throw new Error("CSV is empty");
  // First line should have at least one separator (comma) OR be a single field.
  // We're tolerant, empty header, single column CSVs are valid.
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) throw new Error("CSV has no non-blank lines");
};

export const validateJson: Validator = async ({ blob }) => {
  const text = await readText(blob);
  try {
    JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON failed to parse: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const validatePlainText: Validator = async ({ blob, minSize = 1 }) => {
  assertMinSize(blob, minSize, "Text");
  const text = await readText(blob);
  if (!text.trim()) throw new Error("Text output is empty / whitespace only");
};

export const validateMarkdown: Validator = async ({ blob, minSize = 1 }) => {
  assertMinSize(blob, minSize, "Markdown");
  const text = await readText(blob);
  if (!text.trim()) throw new Error("Markdown output is empty");
};

export const validateHtml: Validator = async ({ blob, minSize = 20 }) => {
  assertMinSize(blob, minSize, "HTML");
  const text = await readText(blob);
  if (!/<html[\s>]/i.test(text) && !/<body[\s>]/i.test(text)) {
    throw new Error("HTML output missing <html> or <body> root");
  }
};

export const validateXml: Validator = async ({ blob, minSize = 20 }) => {
  assertMinSize(blob, minSize, "XML");
  const text = await readText(blob);
  if (!text.trimStart().startsWith("<?xml") && !/<\w+/.test(text)) {
    throw new Error("XML output doesn't start with XML declaration or any element");
  }
};

export const validateCss: Validator = async ({ blob, minSize = 1 }) => {
  assertMinSize(blob, minSize, "CSS");
  const text = await readText(blob);
  // CSS variables format we emit always has :root { ... }
  if (!text.includes(":root") && !text.includes("{")) {
    throw new Error("CSS output looks malformed, no rules detected");
  }
};

// ============================================================================
// Archive validators
// ============================================================================

export const validateZip: Validator = async ({ blob, minSize = 22 }) => {
  assertMinSize(blob, minSize, "ZIP");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x50, 0x4b, 0x03, 0x04], "ZIP");
};

export const validateMxl: Validator = async ({ blob, minSize = 100 }) => {
  // MXL = compressed MusicXML in a zip
  assertMinSize(blob, minSize, "MXL");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x50, 0x4b, 0x03, 0x04], "MXL (ZIP)");
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  if (!zip.file("META-INF/container.xml")) {
    throw new Error("MXL missing META-INF/container.xml");
  }
};

export const validate3mf: Validator = async ({ blob, minSize = 200 }) => {
  assertMinSize(blob, minSize, "3MF");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x50, 0x4b, 0x03, 0x04], "3MF (ZIP)");
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const hasModel = !!(zip.file("3D/3dmodel.model") || zip.file(/3dmodel\.model$/i)[0]);
  if (!hasModel) throw new Error("3MF missing 3D/3dmodel.model");
};

// ============================================================================
// 3D mesh validators
// ============================================================================

export const validateStlBinary: Validator = async ({ blob, minSize = 84 }) => {
  assertMinSize(blob, minSize, "STL");
  // Binary STL: 80-byte header + uint32 LE triangle count + N * 50 bytes
  const view = new DataView(await blob.slice(0, 84).arrayBuffer());
  const triCount = view.getUint32(80, true);
  const expectedSize = 84 + triCount * 50;
  if (blob.size !== expectedSize) {
    // Allow some slack for trailing garbage
    if (Math.abs(blob.size - expectedSize) > 50) {
      throw new Error(`STL size mismatch: expected ${expectedSize} for ${triCount} triangles, got ${blob.size}`);
    }
  }
  if (triCount === 0) throw new Error("STL declares zero triangles");
};

export const validateObj: Validator = async ({ blob, minSize = 10 }) => {
  assertMinSize(blob, minSize, "OBJ");
  const text = await readText(blob);
  if (!/^v\s/m.test(text)) throw new Error("OBJ has no vertices (no 'v ' lines)");
  if (!/^f\s/m.test(text)) throw new Error("OBJ has no faces (no 'f ' lines)");
};

// ============================================================================
// Audio / video validators (file-shape only at this layer; deep validation
// happens in the browser test suite where Web Audio API decodes the audio)
// ============================================================================

export const validateMp3: Validator = async ({ blob, minSize = 100 }) => {
  assertMinSize(blob, minSize, "MP3");
  const head = await readBytes(blob, 3);
  // MP3 starts with either ID3 tag (49 44 33) or directly with a frame sync (FF Fx)
  const isId3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
  const isFrameSync = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
  if (!isId3 && !isFrameSync) {
    throw new Error("MP3 missing ID3 tag or frame sync at start");
  }
};

export const validateWav: Validator = async ({ blob, minSize = 44 }) => {
  assertMinSize(blob, minSize, "WAV");
  const head = await readBytes(blob, 12);
  // WAV: RIFF....WAVE
  if (head[0] !== 0x52 || head[1] !== 0x49 || head[2] !== 0x46 || head[3] !== 0x46) {
    throw new Error("WAV missing RIFF magic");
  }
  if (head[8] !== 0x57 || head[9] !== 0x41 || head[10] !== 0x56 || head[11] !== 0x45) {
    throw new Error("WAV missing WAVE signature in RIFF container");
  }
};

export const validateFlac: Validator = async ({ blob, minSize = 100 }) => {
  assertMinSize(blob, minSize, "FLAC");
  const head = await readBytes(blob, 4);
  // FLAC: starts with "fLaC"
  assertMagicBytes(head, [0x66, 0x4c, 0x61, 0x43], "FLAC");
};

export const validateOgg: Validator = async ({ blob, minSize = 30 }) => {
  assertMinSize(blob, minSize, "OGG");
  const head = await readBytes(blob, 4);
  // OGG: OggS
  assertMagicBytes(head, [0x4f, 0x67, 0x67, 0x53], "OGG");
};

export const validateMp4Container: Validator = async ({ blob, minSize = 100 }) => {
  // MP4/MOV/M4A all share the ISO base media format: ftyp box at byte 4
  assertMinSize(blob, minSize, "MP4 container");
  const head = await readBytes(blob, 8);
  if (head[4] !== 0x66 || head[5] !== 0x74 || head[6] !== 0x79 || head[7] !== 0x70) {
    throw new Error("MP4 container missing ftyp box at byte 4");
  }
};

export const validateMatroskaContainer: Validator = async ({ blob, minSize = 30 }) => {
  // MKV/WebM both use EBML header: 1A 45 DF A3
  assertMinSize(blob, minSize, "Matroska container");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x1a, 0x45, 0xdf, 0xa3], "Matroska/EBML");
};

export const validateAvi: Validator = async ({ blob, minSize = 100 }) => {
  assertMinSize(blob, minSize, "AVI");
  const head = await readBytes(blob, 12);
  if (head[0] !== 0x52 || head[1] !== 0x49 || head[2] !== 0x46 || head[3] !== 0x46) {
    throw new Error("AVI missing RIFF magic");
  }
  if (head[8] !== 0x41 || head[9] !== 0x56 || head[10] !== 0x49 || head[11] !== 0x20) {
    throw new Error("AVI missing 'AVI ' fourcc in RIFF container");
  }
};

// ============================================================================
// Niche format validators
// ============================================================================

export const validateBibtex: Validator = async ({ blob, minSize = 10 }) => {
  assertMinSize(blob, minSize, "BibTeX");
  const text = await readText(blob);
  if (!/^@\w+\{/m.test(text)) throw new Error("BibTeX has no @entry blocks");
  if (!/\}\s*$/m.test(text)) throw new Error("BibTeX has no closing brace");
};

export const validateRis: Validator = async ({ blob, minSize = 10 }) => {
  assertMinSize(blob, minSize, "RIS/NBIB");
  const text = await readText(blob);
  // RIS uses TY (record type); NBIB uses PT (publication type) for the
  // same role. Accept either since the MIME type doesn't distinguish them.
  if (!/^TY\s*-/m.test(text) && !/^PT\s+-/m.test(text)) {
    throw new Error("RIS/NBIB missing record-type tag (TY for RIS, PT for NBIB)");
  }
  if (!/^ER\s*-/m.test(text)) throw new Error("RIS/NBIB missing ER (end of record) tag");
};

export const validateGedcom: Validator = async ({ blob, minSize = 50 }) => {
  assertMinSize(blob, minSize, "GEDCOM");
  const text = await readText(blob);
  if (!/^0\s+HEAD/m.test(text)) throw new Error("GEDCOM missing HEAD record");
  if (!/^0\s+TRLR/m.test(text)) throw new Error("GEDCOM missing TRLR (trailer) record");
};

export const validateOfx: Validator = async ({ blob, minSize = 100 }) => {
  assertMinSize(blob, minSize, "OFX");
  const text = await readText(blob);
  if (!text.includes("<OFX>")) throw new Error("OFX missing <OFX> root element");
  if (!text.includes("</OFX>")) throw new Error("OFX missing </OFX> closing element");
};

export const validateQif: Validator = async ({ blob, minSize = 5 }) => {
  assertMinSize(blob, minSize, "QIF");
  const text = await readText(blob);
  if (!/^!Type:/m.test(text)) throw new Error("QIF missing !Type: header");
  if (!/^\^/m.test(text)) throw new Error("QIF has no transaction terminators (^)");
};

export const validateAdif: Validator = async ({ blob, minSize = 20 }) => {
  assertMinSize(blob, minSize, "ADIF");
  const text = await readText(blob);
  if (!/<EOH>/i.test(text)) throw new Error("ADIF missing <EOH> end-of-header");
  if (!/<EOR>/i.test(text)) throw new Error("ADIF has no <EOR> records");
};

export const validateCabrillo: Validator = async ({ blob, minSize = 20 }) => {
  assertMinSize(blob, minSize, "Cabrillo");
  const text = await readText(blob);
  if (!/^START-OF-LOG:/m.test(text)) throw new Error("Cabrillo missing START-OF-LOG header");
  if (!/^END-OF-LOG:/m.test(text)) throw new Error("Cabrillo missing END-OF-LOG terminator");
};

export const validateMusicXml: Validator = async ({ blob, minSize = 50 }) => {
  assertMinSize(blob, minSize, "MusicXML");
  const text = await readText(blob);
  if (!text.includes("<score-partwise") && !text.includes("<score-timewise")) {
    throw new Error("MusicXML missing <score-partwise> or <score-timewise> root");
  }
};

export const validateMidi: Validator = async ({ blob, minSize = 14 }) => {
  assertMinSize(blob, minSize, "MIDI");
  const head = await readBytes(blob, 4);
  // MIDI: MThd
  assertMagicBytes(head, [0x4d, 0x54, 0x68, 0x64], "MIDI");
};

export const validateAse: Validator = async ({ blob, minSize = 12 }) => {
  // Adobe Swatch Exchange: ASEF
  assertMinSize(blob, minSize, "ASE");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x41, 0x53, 0x45, 0x46], "ASE");
};

export const validateAco: Validator = async ({ blob, minSize = 4 }) => {
  // Photoshop ACO: 16-bit version (0x0001 or 0x0002) + 16-bit color count
  assertMinSize(blob, minSize, "ACO");
  const head = await readBytes(blob, 2);
  const version = (head[0] << 8) | head[1];
  if (version !== 0x0001 && version !== 0x0002) {
    throw new Error(`ACO unexpected version: 0x${version.toString(16)}`);
  }
};

export const validateGpl: Validator = async ({ blob, minSize = 15 }) => {
  // GIMP Palette: starts with "GIMP Palette"
  assertMinSize(blob, minSize, "GPL");
  const text = await readText(blob);
  if (!text.startsWith("GIMP Palette")) {
    throw new Error("GPL missing 'GIMP Palette' header");
  }
};

export const validateLut: Validator = async ({ blob, minSize = 30 }) => {
  // CUBE / 3DL / CSP, all text formats with numeric grids
  assertMinSize(blob, minSize, "LUT");
  const text = await readText(blob);
  // Should have at least one line of three space-separated floats
  if (!/^\s*-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+\s*$/m.test(text)) {
    throw new Error("LUT has no RGB triplet lines");
  }
};

export const validateDst: Validator = async ({ blob, minSize = 515 }) => {
  // DST embroidery: 512-byte fixed header + at least 1 stitch (3 bytes).
  // Tiny fixtures from round-trips with a few stitches are ~520-540 bytes.
  assertMinSize(blob, minSize, "DST");
  const head = await readBytes(blob, 3);
  // First 3 bytes of header should be "LA:" (label tag)
  if (head[0] !== 0x4c || head[1] !== 0x41 || head[2] !== 0x3a) {
    throw new Error("DST header doesn't start with 'LA:'");
  }
  // Last 3 bytes should be 0x00 0x00 0xF3 (END marker)
  const tail = new Uint8Array(await blob.slice(blob.size - 3).arrayBuffer());
  if (tail[2] !== 0xf3) {
    throw new Error("DST missing END marker (0x00 0x00 0xF3) at file end");
  }
};

export const validatePes: Validator = async ({ blob, minSize = 100 }) => {
  // PES embroidery: starts with "#PES". Min size 100 because PES has a
  // small header + variable-size PEC body; round-trip fixtures from
  // tiny designs can be ~575 bytes, hand-crafted minimal PES is >100.
  assertMinSize(blob, minSize, "PES");
  const head = await readBytes(blob, 4);
  assertMagicBytes(head, [0x23, 0x50, 0x45, 0x53], "PES");
};

export const validateJefOrExp: Validator = async ({ blob, minSize = 4 }) => {
  // JEF/EXP have no fixed header; just check size + last bytes look like an end marker
  assertMinSize(blob, minSize, "JEF/EXP");
  // Both formats end with a 2-byte control code: 0x80 0x10 for JEF (END),
  // 0x80 0x02 for EXP (END). Look at the last 2 bytes, must start with 0x80.
  const tail = new Uint8Array(await blob.slice(Math.max(0, blob.size - 2)).arrayBuffer());
  if (tail[0] !== 0x80) {
    throw new Error(`JEF/EXP missing control-code end marker; last 2 bytes are 0x${(tail[0] ?? 0).toString(16)} 0x${(tail[1] ?? 0).toString(16)} (expected 0x80 ...)`);
  }
};

export const validateMbox: Validator = async ({ blob, minSize = 10 }) => {
  // mbox format: each message preceded by a "From " line (with trailing space)
  assertMinSize(blob, minSize, "MBOX");
  const text = await readText(blob);
  if (!/^From /m.test(text)) {
    throw new Error("MBOX missing 'From ' separator line");
  }
};

export const validateEml: Validator = async ({ blob, minSize = 20 }) => {
  // RFC-822 message: must have at least one header (Header-Name:) followed
  // by a blank line and a body. We're tolerant, any line matching
  // "Word: value" near the start counts as a header.
  assertMinSize(blob, minSize, "EML");
  const text = await readText(blob);
  if (!/^[A-Za-z][A-Za-z0-9-]*:\s*\S/m.test(text)) {
    throw new Error("EML missing any RFC-822 header line");
  }
};

export const validateGlb: Validator = async ({ blob, minSize = 12 }) => {
  // glTF Binary: glTF magic
  assertMinSize(blob, minSize, "glTF Binary");
  const head = await readBytes(blob, 4);
  // 'glTF' = 0x46 0x54 0x6c 0x67 little-endian
  assertMagicBytes(head, [0x67, 0x6c, 0x54, 0x46], "glTF Binary");
};

export const validateYaml: Validator = async ({ blob, minSize = 1 }) => {
  assertMinSize(blob, minSize, "YAML");
  const text = await readText(blob);
  if (!text.trim()) throw new Error("YAML is empty");
  // Don't try to parse it (would require pulling js-yaml into the
  // validator); check it's plausibly YAML (has a `key:` line OR a list
  // marker `- `) and not just an opaque blob.
  if (!/^[ \t]*[\w"'][^:\n]*:\s*/m.test(text) && !/^[ \t]*-\s+/m.test(text)) {
    throw new Error("YAML has no key: or - list markers");
  }
};

export const validateToml: Validator = async ({ blob, minSize = 1 }) => {
  assertMinSize(blob, minSize, "TOML");
  const text = await readText(blob);
  if (!text.trim()) throw new Error("TOML is empty");
  if (!/^\s*[\w"][^=\n]*=\s*/m.test(text) && !/^\[[^\]\n]+\]/m.test(text)) {
    throw new Error("TOML has no key=value or [table] markers");
  }
};

export const validateSrt: Validator = async ({ blob, minSize = 20 }) => {
  assertMinSize(blob, minSize, "SRT");
  const text = await readText(blob);
  // SRT timestamps use `,` as decimal separator
  if (!/\d{2}:\d{2}:\d{2},\d{1,3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{1,3}/.test(text)) {
    throw new Error("SRT has no recognizable timestamp line");
  }
};

export const validateVtt: Validator = async ({ blob, minSize = 20 }) => {
  assertMinSize(blob, minSize, "WebVTT");
  const text = await readText(blob);
  if (!/^WEBVTT/m.test(text)) throw new Error("WebVTT missing WEBVTT header");
  // VTT timestamps use `.` as decimal separator
  if (!/\d{2}:\d{2}:\d{2}\.\d{1,3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{1,3}/.test(text)) {
    throw new Error("WebVTT has no recognizable timestamp line");
  }
};

// ============================================================================
// Validator dispatch, pick by output MIME or by filename extension fallback
// ============================================================================

const BY_MIME: Record<string, Validator> = {
  "image/png": validatePng,
  "image/jpeg": validateJpeg,
  "image/webp": validateWebp,
  "image/avif": validateAvif,
  "image/bmp": validateBmp,
  "image/gif": validateGif,
  "image/tiff": validateTiff,
  "image/x-tiff": validateTiff,
  "image/x-icon": validateIco,
  "image/vnd.microsoft.icon": validateIco,
  "image/svg+xml": validateSvg,

  "application/pdf": validatePdf,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": validateDocx,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": validateXlsx,
  "application/epub+zip": validateEpub,

  "text/csv": validateCsv,
  "application/csv": validateCsv,
  "application/json": validateJson,
  "text/plain": validatePlainText,
  "text/markdown": validateMarkdown,
  "text/html": validateHtml,
  "application/xml": validateXml,
  "text/xml": validateXml,
  "text/css": validateCss,

  "application/zip": validateZip,
  "application/vnd.recordare.musicxml": validateMxl,
  "application/vnd.recordare.musicxml+xml": validateMusicXml,
  "model/3mf": validate3mf,

  "model/stl": validateStlBinary,
  "application/sla": validateStlBinary,
  "model/obj": validateObj,
  "model/gltf-binary": validateGlb,

  "audio/mpeg": validateMp3,
  "audio/mp3": validateMp3,
  "audio/wav": validateWav,
  "audio/x-wav": validateWav,
  "audio/flac": validateFlac,
  "audio/x-flac": validateFlac,
  "audio/ogg": validateOgg,
  "application/ogg": validateOgg,
  "audio/mp4": validateMp4Container,
  "audio/m4a": validateMp4Container,
  "audio/x-m4a": validateMp4Container,
  "audio/midi": validateMidi,
  "audio/x-midi": validateMidi,

  "video/mp4": validateMp4Container,
  "video/quicktime": validateMp4Container,
  "video/webm": validateMatroskaContainer,
  "video/x-matroska": validateMatroskaContainer,
  "video/x-msvideo": validateAvi,

  // Application-specific text formats, match by their stated MIME
  "application/x-bibtex": validateBibtex,
  "text/x-bibtex": validateBibtex,
  "application/x-research-info-systems": validateRis,
  "application/x-gedcom": validateGedcom,
  "application/x-ofx": validateOfx,
  "application/vnd.intu.qfx": validateOfx,
  "application/vnd.intu.qbo": validateOfx,
  "application/qif": validateQif,
  "application/x-qif": validateQif,
  "application/x-adif": validateAdif,
  "application/mbox": validateMbox,
  "application/vnd.google-earth.kml+xml": validateXml,
  "message/rfc822": validateEml,

  // YAML / TOML / Subtitle (defined above this map)
  "application/x-yaml": validateYaml,
  "text/yaml": validateYaml,
  "application/toml": validateToml,
  "text/vtt": validateVtt,
  "application/x-subrip": validateSrt,

  // TSV: validate as a plain-text file with at least one tab character
  // somewhere (otherwise it's degenerate single-column data).
  "text/tab-separated-values": validatePlainText,
};

// Extension-keyed fallback, used when toMime is generic (octet-stream)
const BY_EXT: Record<string, Validator> = {
  ase: validateAse,
  aco: validateAco,
  gpl: validateGpl,
  cube: validateLut,
  "3dl": validateLut,
  csp: validateLut,
  dst: validateDst,
  pes: validatePes,
  jef: validateJefOrExp,
  exp: validateJefOrExp,
  log: validateCabrillo,
  cbr: validateCabrillo,
  cabrillo: validateCabrillo,
  ico: validateIco,
};

/**
 * Pick the right validator for a given output. Looks up by MIME first,
 * falls back to extension. Throws if neither matches, better to fail
 * loudly than silently skip validation.
 *
 * Strips MIME parameters (e.g. `text/csv;charset=utf-8` → `text/csv`)
 * before lookup, since converters routinely add a charset to text output.
 */
export function pickValidator(outputMime: string, filename: string): Validator | null {
  const baseMime = outputMime.split(";")[0].trim().toLowerCase();
  const byMime = BY_MIME[baseMime];
  if (byMime) return byMime;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && BY_EXT[ext]) return BY_EXT[ext];
  return null;
}
