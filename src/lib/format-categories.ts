/**
 * Format → category mapping for the chip-widget dropdown's two-pane layout.
 * Categories drive the left-hand sidebar; the right-hand grid shows formats
 * for the selected (or hovered) category. Mirrors the CloudConvert dropdown.
 *
 * Keep this list aligned with the CATEGORIES array in src/app/page.tsx so the
 * homepage taxonomy stays consistent. Compound formats (those with hyphens
 * like "kindle-clippings") are excluded from the chip widget by
 * buildFormatGraph and so don't need to be categorized here.
 */

export const FORMAT_CATEGORIES = [
  "Image",
  "Document",
  "Audio",
  "Video",
  "Ebook",
  "Email",
  "Finance",
  "Genealogy",
  "Citation",
  "Color",
  "3D",
  "Music",
  "Embroidery",
  "Other",
] as const;

export type FormatCategory = (typeof FORMAT_CATEGORIES)[number];

const FORMAT_TO_CATEGORY: Record<string, FormatCategory> = {
  // Image
  HEIC: "Image", JPG: "Image", JPEG: "Image", PNG: "Image", WEBP: "Image",
  AVIF: "Image", BMP: "Image", GIF: "Image", SVG: "Image",
  TIFF: "Image", TIF: "Image", ICO: "Image",
  // Document
  PDF: "Document", DOCX: "Document", DOC: "Document", XLSX: "Document",
  XLS: "Document", CSV: "Document", HTML: "Document", HTM: "Document",
  JSON: "Document", TXT: "Document", MD: "Document", RTF: "Document",
  PAGES: "Document", NUMBERS: "Document", KEYNOTE: "Document",
  // Audio
  MP3: "Audio", WAV: "Audio", M4A: "Audio", FLAC: "Audio",
  OGG: "Audio", AAC: "Audio", OPUS: "Audio",
  // Video
  MP4: "Video", MOV: "Video", WEBM: "Video", AVI: "Video", MKV: "Video",
  // Ebook
  EPUB: "Ebook", MOBI: "Ebook", AZW3: "Ebook",
  // Email
  EML: "Email", MBOX: "Email", MSG: "Email",
  // Finance
  OFX: "Finance", QFX: "Finance", QBO: "Finance", QIF: "Finance",
  // Genealogy
  GEDCOM: "Genealogy", GED: "Genealogy",
  // Citation
  BIBTEX: "Citation", BIB: "Citation", RIS: "Citation",
  NBIB: "Citation", "ENDNOTE-XML": "Citation",
  // Color (palettes + LUTs)
  ASE: "Color", GPL: "Color", ACO: "Color", HEX: "Color",
  CUBE: "Color", "3DL": "Color", CSP: "Color",
  // 3D
  STL: "3D", "3MF": "3D", OBJ: "3D", GLTF: "3D", IFC: "3D",
  // Music
  MIDI: "Music", MID: "Music", MUSICXML: "Music", MXL: "Music",
  // Embroidery
  DST: "Embroidery", PES: "Embroidery", JEF: "Embroidery", EXP: "Embroidery",
  // Other (ham radio, chess, security, localization, etc.)
  ADIF: "Other", CABRILLO: "Other", KML: "Other",
  PGN: "Other", FEN: "Other",
  SARIF: "Other", EDI: "Other", EDIFACT: "Other",
  PACER: "Other",
  PO: "Other", POT: "Other",
};

export function categorize(format: string): FormatCategory {
  return FORMAT_TO_CATEGORY[format.toUpperCase()] ?? "Other";
}

/**
 * Group a list of formats by category, preserving format order within each
 * group. Returns categories in the canonical FORMAT_CATEGORIES order, with
 * empty categories omitted.
 */
export function groupByCategory(
  formats: string[],
): Array<{ category: FormatCategory; formats: string[] }> {
  const buckets = new Map<FormatCategory, string[]>();
  for (const fmt of formats) {
    const cat = categorize(fmt);
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(fmt);
  }
  return FORMAT_CATEGORIES
    .filter((c) => buckets.has(c))
    .map((category) => ({ category, formats: buckets.get(category)! }));
}
