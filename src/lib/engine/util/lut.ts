/**
 * LUT (Look-Up Table) parser + writer for color-grading interchange.
 *
 * The three formats we support:
 *   - .cube, Adobe / SpeedGrade format (most common). Text:
 *       LUT_3D_SIZE 33
 *       0.000000 0.000000 0.000000
 *       0.031250 0.000000 0.000000
 *       ...
 *   - .3dl, Autodesk / Lustre format. Text. Header lines vary by vendor;
 *       we skip lines until we hit numeric data.
 *   - .csp, Cinespace (Rising Sun) format. Text with a richer header
 *       (preLUT and metadata blocks) but the 3D core is a simple grid.
 *
 * Internally everything reduces to a single 3D table:
 *   size: cube edge length (17/33/65 are typical)
 *   data: Float32Array of size*size*size*3 in R,G,B,R,G,B... order
 *
 * Index ordering follows Cube convention: R fastest, then G, then B.
 * Different formats have different ordering, readers normalize on input.
 */

export interface Lut3D {
  size: number;
  /** Flat array of size^3 RGB triplets in R-major (R,G,B,R,G,B,...) order. */
  data: Float32Array;
  /** Optional title from the source file (for round-trip). */
  title?: string;
  /** Optional input domain min/max from the source (default 0/1). */
  domainMin?: [number, number, number];
  domainMax?: [number, number, number];
}

// ---- CUBE -------------------------------------------------------------

export function parseCube(text: string): Lut3D {
  let size = 0;
  let oneDSize = 0;
  let title: string | undefined;
  let domainMin: [number, number, number] | undefined;
  let domainMax: [number, number, number] | undefined;
  const triples: number[] = [];

  // Strip leading BOM. Resolve / DaVinci sometimes save with UTF-8 BOM
  // and the first TITLE/LUT_3D_SIZE line then fails the startsWith check.
  for (const rawLine of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("TITLE")) {
      title = line.replace(/^TITLE\s+"?(.*?)"?$/i, "$1");
      continue;
    }
    if (line.startsWith("LUT_3D_SIZE")) {
      size = parseInt(line.split(/\s+/)[1], 10);
      continue;
    }
    if (line.startsWith("LUT_1D_SIZE")) {
      oneDSize = parseInt(line.split(/\s+/)[1], 10);
      continue;
    }
    if (line.startsWith("DOMAIN_MIN")) {
      const parts = line.split(/\s+/).slice(1).map(parseFloat);
      domainMin = [parts[0], parts[1], parts[2]];
      continue;
    }
    if (line.startsWith("DOMAIN_MAX")) {
      const parts = line.split(/\s+/).slice(1).map(parseFloat);
      domainMax = [parts[0], parts[1], parts[2]];
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length === 3 && !isNaN(parseFloat(parts[0]))) {
      triples.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
    }
  }

  // 1D LUT declared and matches the data: tell the caller cleanly that
  // this is a 1D file, which the 3D writers cannot represent.
  if (oneDSize > 0 && size === 0) {
    throw new Error(
      `This CUBE file is a 1D LUT (LUT_1D_SIZE ${oneDSize}). The 3DL/Resolve targets require a 3D LUT. Re-export as a 3D LUT from your color tool.`,
    );
  }

  if (size === 0) {
    throw new Error(
      "CUBE LUT is missing the LUT_3D_SIZE header. The file does not look like a valid 3D CUBE LUT.",
    );
  }

  const expected = size * size * size;
  const got = Math.floor(triples.length / 3);
  if (triples.length !== expected * 3) {
    throw new Error(
      `CUBE LUT incomplete: header declares LUT_3D_SIZE ${size} (expects ${expected} RGB triples) but the file has ${got}. The file is likely truncated or vendor-malformed; re-export from your color tool.`,
    );
  }

  return { size, data: Float32Array.from(triples), title, domainMin, domainMax };
}

export function buildCube(lut: Lut3D): string {
  const lines: string[] = [];
  if (lut.title) lines.push(`TITLE "${lut.title}"`);
  lines.push(`LUT_3D_SIZE ${lut.size}`);
  if (lut.domainMin) lines.push(`DOMAIN_MIN ${lut.domainMin.join(" ")}`);
  if (lut.domainMax) lines.push(`DOMAIN_MAX ${lut.domainMax.join(" ")}`);
  for (let i = 0; i < lut.data.length; i += 3) {
    lines.push(`${lut.data[i].toFixed(6)} ${lut.data[i + 1].toFixed(6)} ${lut.data[i + 2].toFixed(6)}`);
  }
  return lines.join("\n") + "\n";
}

// ---- 3DL --------------------------------------------------------------

/**
 * 3DL parsers vary by vendor (Autodesk Lustre vs Inferno vs Quantel).
 * The widely-supported "Mesh-style" 3DL has a header line listing the
 * coordinate ladder (e.g. `0 64 128 192 255 ...`) followed by RGB triples
 * in B-major order (B varies fastest). Output values are integers in the
 * declared output range.
 *
 * We normalize ordering to R-major and values to 0..1 floats internally.
 */
export function parse3dl(text: string): Lut3D {
  let coords: number[] | null = null;
  const triples: number[] = [];
  // Strip leading BOM (Windows-saved Autodesk Lustre exports carry one).
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/).map(Number).filter((n) => !isNaN(n));
    if (parts.length === 0) continue;
    // Header coord ladder is typically the first numeric line with > 3 entries.
    if (!coords && parts.length > 3) {
      coords = parts;
      continue;
    }
    if (coords && parts.length === 3) {
      triples.push(...parts);
    }
  }

  if (!coords) throw new Error("3DL LUT missing coordinate header line");
  const size = coords.length;
  if (triples.length !== size * size * size * 3) {
    throw new Error(`3DL LUT malformed: header declares size ${size} but body has ${triples.length / 3} entries`);
  }

  // Detect output bit depth from max value seen, then normalize to 0..1.
  let maxVal = 0;
  for (const v of triples) if (v > maxVal) maxVal = v;
  // Round to the nearest power-of-two minus 1 (255, 1023, 4095, 65535).
  const norm = maxVal <= 255 ? 255 : maxVal <= 1023 ? 1023 : maxVal <= 4095 ? 4095 : 65535;
  const data = new Float32Array(size * size * size * 3);

  // 3DL uses B-major ordering: outer B, middle G, inner R. Re-order to R-major.
  for (let bi = 0; bi < size; bi++) {
    for (let gi = 0; gi < size; gi++) {
      for (let ri = 0; ri < size; ri++) {
        const srcIdx = (bi * size * size + gi * size + ri) * 3;
        const dstIdx = (ri * size * size + gi * size + bi) * 3;
        data[dstIdx] = triples[srcIdx] / norm;
        data[dstIdx + 1] = triples[srcIdx + 1] / norm;
        data[dstIdx + 2] = triples[srcIdx + 2] / norm;
      }
    }
  }

  return { size, data };
}

export function build3dl(lut: Lut3D): string {
  // Use a 0..1023 (10-bit) output ladder, Lustre's default.
  const lines: string[] = [];
  const ladder: number[] = [];
  for (let i = 0; i < lut.size; i++) {
    ladder.push(Math.round((i / (lut.size - 1)) * 1023));
  }
  lines.push(ladder.join(" "));

  // Re-order R-major → B-major for output.
  for (let bi = 0; bi < lut.size; bi++) {
    for (let gi = 0; gi < lut.size; gi++) {
      for (let ri = 0; ri < lut.size; ri++) {
        const srcIdx = (ri * lut.size * lut.size + gi * lut.size + bi) * 3;
        const r = Math.round(lut.data[srcIdx] * 1023);
        const g = Math.round(lut.data[srcIdx + 1] * 1023);
        const b = Math.round(lut.data[srcIdx + 2] * 1023);
        lines.push(`${r} ${g} ${b}`);
      }
    }
  }
  return lines.join("\n") + "\n";
}

// ---- CSP --------------------------------------------------------------

/**
 * Cinespace 3D LUT, minimal subset. Real CSP files can include a
 * 1D preLUT block and metadata; we generate a 3D-only file (which all
 * Cinespace-compatible apps accept) and parse 3D-only files cleanly.
 * Files with a preLUT will still parse, the preLUT block is skipped.
 */
export function parseCsp(text: string): Lut3D {
  // Skip header until we find a "size size size" line, then read triples.
  const lines = text.split(/\r?\n/);
  let i = 0;
  let size = 0;

  // Find the 3D-LUT size declaration: three identical integers on a line.
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length === 3 && parts.every((p) => /^\d+$/.test(p)) && parts[0] === parts[1] && parts[1] === parts[2]) {
      size = parseInt(parts[0], 10);
      i++;
      break;
    }
  }
  if (size === 0) throw new Error("CSP LUT: could not find 3D size declaration");

  // CSP body is R-major (matches our internal convention). Values 0..1 floats.
  const triples: number[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+/).map(parseFloat);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      triples.push(parts[0], parts[1], parts[2]);
    }
  }

  if (triples.length !== size * size * size * 3) {
    throw new Error(`CSP LUT malformed: declared size ${size} but body has ${triples.length / 3} entries`);
  }

  return { size, data: Float32Array.from(triples) };
}

export function buildCsp(lut: Lut3D): string {
  const lines: string[] = [
    "CSPLUTV100",
    "3D",
    "BEGIN METADATA",
    "client-conversion",
    "END METADATA",
    "",
    // 1D preLUT defaulting to identity for each channel
    "2", "0.0 1.0", "0.0 1.0",
    "2", "0.0 1.0", "0.0 1.0",
    "2", "0.0 1.0", "0.0 1.0",
    "",
    `${lut.size} ${lut.size} ${lut.size}`,
  ];
  for (let i = 0; i < lut.data.length; i += 3) {
    lines.push(`${lut.data[i].toFixed(6)} ${lut.data[i + 1].toFixed(6)} ${lut.data[i + 2].toFixed(6)}`);
  }
  return lines.join("\n") + "\n";
}
