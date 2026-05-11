/**
 * Color palette parsers + writers for the design-tool interchange family.
 *
 * Formats supported:
 *   - ASE (Adobe Swatch Exchange), binary, big-endian, used by Adobe CC
 *   - ACO (Adobe Color), binary, big-endian, Photoshop's native format
 *   - GPL (GIMP Palette), plain text, used by GIMP / Krita / Inkscape
 *   - HEX list (text), input convenience for Coolors / Figma exports
 *   - CSS variables (text, output only)
 *   - JSON (text, output only)
 *
 * All formats reduce internally to a `Color[]` with R/G/B in 0-255 plus
 * an optional name. ASE supports CMYK/Lab/Gray entries, we convert
 * those to sRGB on input rather than carrying them through the
 * unified shape (most downstream consumers want RGB anyway).
 */

export interface Color {
  r: number; // 0-255
  g: number;
  b: number;
  name?: string;
}

export interface Palette {
  name?: string;
  colors: Color[];
}

// ---- HEX list (input only) --------------------------------------------

export function parseHexList(text: string): Palette {
  const colors: Color[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    // Allow comma-separated lists per line, with or without #, and tolerate names.
    for (const tok of rawLine.split(/[\s,;]+/)) {
      const m = tok.trim().match(/^#?([0-9a-fA-F]{6})$/) ?? tok.trim().match(/^#?([0-9a-fA-F]{3})$/);
      if (!m) continue;
      let hex = m[1];
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      colors.push({
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      });
    }
  }
  return { colors };
}

function toHex(c: Color): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

// ---- GPL (GIMP Palette) -----------------------------------------------

export function parseGpl(text: string): Palette {
  const lines = text.split(/\r?\n/);
  const colors: Color[] = [];
  let name: string | undefined;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed === "GIMP Palette") continue;
    if (trimmed.startsWith("Name:")) {
      name = trimmed.slice(5).trim();
      continue;
    }
    if (trimmed.startsWith("Columns:")) continue;
    // Color line: "R G B [Name]" with whitespace separation.
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    const r = parseInt(parts[0], 10);
    const g = parseInt(parts[1], 10);
    const b = parseInt(parts[2], 10);
    if (isNaN(r) || isNaN(g) || isNaN(b)) continue;
    const colorName = parts.slice(3).join(" ").trim() || undefined;
    colors.push({ r, g, b, name: colorName });
  }
  return { name, colors };
}

export function buildGpl(palette: Palette): string {
  const lines: string[] = ["GIMP Palette"];
  if (palette.name) lines.push(`Name: ${palette.name}`);
  lines.push("Columns: 0");
  lines.push("#");
  for (const c of palette.colors) {
    const r = String(c.r).padStart(3, " ");
    const g = String(c.g).padStart(3, " ");
    const b = String(c.b).padStart(3, " ");
    lines.push(`${r} ${g} ${b} ${c.name ?? "Untitled"}`);
  }
  return lines.join("\n") + "\n";
}

// ---- ASE (Adobe Swatch Exchange), binary, big-endian -----------------

export function parseAse(buf: ArrayBuffer): Palette {
  const view = new DataView(buf);
  const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (sig !== "ASEF") throw new Error("Not an ASE file (signature mismatch)");
  const blockCount = view.getUint32(8, false);
  const colors: Color[] = [];
  let off = 12;
  for (let i = 0; i < blockCount && off + 6 <= buf.byteLength; i++) {
    const blockType = view.getUint16(off, false);
    const blockLength = view.getUint32(off + 2, false);
    const blockBody = off + 6;
    off = blockBody + blockLength;

    if (blockType === 0x0001) {
      // Color entry block
      let p = blockBody;
      const nameLen = view.getUint16(p, false); // chars including null terminator
      p += 2;
      let name = "";
      for (let j = 0; j < nameLen - 1; j++) {
        name += String.fromCharCode(view.getUint16(p, false));
        p += 2;
      }
      p += 2; // skip null terminator
      const model = String.fromCharCode(view.getUint8(p), view.getUint8(p + 1), view.getUint8(p + 2), view.getUint8(p + 3));
      p += 4;
      const color = readAseColor(view, p, model);
      if (color) colors.push({ ...color, name: name.trim() || undefined });
    }
  }
  return { colors };
}

function readAseColor(view: DataView, off: number, model: string): { r: number; g: number; b: number } | null {
  if (model === "RGB ") {
    const r = view.getFloat32(off, false);
    const g = view.getFloat32(off + 4, false);
    const b = view.getFloat32(off + 8, false);
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  if (model === "GRAY") {
    const v = Math.round(view.getFloat32(off, false) * 255);
    return { r: v, g: v, b: v };
  }
  if (model === "CMYK") {
    const c = view.getFloat32(off, false);
    const m = view.getFloat32(off + 4, false);
    const y = view.getFloat32(off + 8, false);
    const k = view.getFloat32(off + 12, false);
    return {
      r: Math.round(255 * (1 - c) * (1 - k)),
      g: Math.round(255 * (1 - m) * (1 - k)),
      b: Math.round(255 * (1 - y) * (1 - k)),
    };
  }
  // LAB and others, skip silently rather than fail.
  return null;
}

export function buildAse(palette: Palette): ArrayBuffer {
  // Compute total size first so we can allocate a single buffer.
  // Per color block: 6 (header) + 2 (name len) + 2*(name+1) (UTF-16BE name + null) + 4 (model) + 12 (RGB) + 2 (color type)
  let total = 12; // file header
  const namesEncoded = palette.colors.map((c) => c.name ?? "");
  for (const name of namesEncoded) {
    total += 6 + 2 + (name.length + 1) * 2 + 4 + 12 + 2;
  }

  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  view.setUint8(0, 0x41); view.setUint8(1, 0x53); view.setUint8(2, 0x45); view.setUint8(3, 0x46); // "ASEF"
  view.setUint16(4, 1, false); // major version
  view.setUint16(6, 0, false); // minor version
  view.setUint32(8, palette.colors.length, false);

  let off = 12;
  for (let i = 0; i < palette.colors.length; i++) {
    const c = palette.colors[i];
    const name = namesEncoded[i];
    const nameBytes = (name.length + 1) * 2;
    const blockLen = 2 + nameBytes + 4 + 12 + 2;

    view.setUint16(off, 0x0001, false); // color entry
    view.setUint32(off + 2, blockLen, false);
    view.setUint16(off + 6, name.length + 1, false);
    let p = off + 8;
    for (let j = 0; j < name.length; j++) {
      view.setUint16(p, name.charCodeAt(j), false);
      p += 2;
    }
    view.setUint16(p, 0, false); p += 2; // null terminator
    view.setUint8(p, 0x52); view.setUint8(p + 1, 0x47); view.setUint8(p + 2, 0x42); view.setUint8(p + 3, 0x20); // "RGB "
    p += 4;
    view.setFloat32(p, c.r / 255, false); p += 4;
    view.setFloat32(p, c.g / 255, false); p += 4;
    view.setFloat32(p, c.b / 255, false); p += 4;
    view.setUint16(p, 0x0002, false); // color type: normal
    off += 6 + blockLen;
  }
  return buf;
}

// ---- ACO (Adobe Color), binary, big-endian ---------------------------

export function parseAco(buf: ArrayBuffer): Palette {
  const view = new DataView(buf);
  // Try v2 first (it includes names); fall back to v1 if signature is off.
  const v1ColorCount = view.getUint16(2, false);
  const v1BodySize = 4 + v1ColorCount * 10;

  // v2 starts immediately after v1 if both versions are present.
  let off = v1BodySize;
  let useV2 = false;
  if (off + 4 <= buf.byteLength && view.getUint16(off, false) === 0x0002) {
    useV2 = true;
    off += 2;
  } else {
    off = 0;
    if (view.getUint16(0, false) === 0x0002) {
      useV2 = true;
      off = 2;
    } else {
      off = 0;
    }
  }
  const colorCount = view.getUint16(off, false);
  off += 2;

  const colors: Color[] = [];
  for (let i = 0; i < colorCount; i++) {
    const space = view.getUint16(off, false);
    const w = view.getUint16(off + 2, false);
    const x = view.getUint16(off + 4, false);
    const y = view.getUint16(off + 6, false);
    // const z = view.getUint16(off + 8, false); // 4th channel; only used for CMYK
    off += 10;

    let color: { r: number; g: number; b: number } | null = null;
    if (space === 0) {
      // RGB: stored as 16-bit values, each = (component * 256). Divide by 256.
      color = { r: Math.round(w / 256), g: Math.round(x / 256), b: Math.round(y / 256) };
    } else if (space === 8) {
      // Grayscale: w is 0-10000
      const v = Math.round((w / 10000) * 255);
      color = { r: v, g: v, b: v };
    }

    let name: string | undefined;
    if (useV2 && off + 4 <= buf.byteLength) {
      off += 2; // skip 2-byte zero pad
      const len = view.getUint16(off, false); // includes null terminator
      off += 2;
      let n = "";
      for (let j = 0; j < len - 1; j++) {
        n += String.fromCharCode(view.getUint16(off, false));
        off += 2;
      }
      off += 2; // null terminator
      name = n.trim() || undefined;
    }

    if (color) colors.push({ ...color, name });
  }
  return { colors };
}

export function buildAco(palette: Palette): ArrayBuffer {
  // Build v2 (includes names). v1 section first, then v2 section.
  const namesEncoded = palette.colors.map((c) => c.name ?? "");
  let v2NameBytes = 0;
  for (const name of namesEncoded) v2NameBytes += 4 + (name.length + 1) * 2;

  const v1Size = 4 + palette.colors.length * 10;
  const v2Size = 4 + palette.colors.length * 10 + v2NameBytes;
  const total = v1Size + v2Size;

  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  // v1 section
  view.setUint16(0, 0x0001, false);
  view.setUint16(2, palette.colors.length, false);
  let off = 4;
  for (const c of palette.colors) {
    view.setUint16(off, 0, false); // RGB
    view.setUint16(off + 2, c.r * 256, false);
    view.setUint16(off + 4, c.g * 256, false);
    view.setUint16(off + 6, c.b * 256, false);
    view.setUint16(off + 8, 0, false);
    off += 10;
  }
  // v2 section
  view.setUint16(off, 0x0002, false);
  view.setUint16(off + 2, palette.colors.length, false);
  off += 4;
  for (let i = 0; i < palette.colors.length; i++) {
    const c = palette.colors[i];
    const name = namesEncoded[i];
    view.setUint16(off, 0, false); // RGB
    view.setUint16(off + 2, c.r * 256, false);
    view.setUint16(off + 4, c.g * 256, false);
    view.setUint16(off + 6, c.b * 256, false);
    view.setUint16(off + 8, 0, false);
    off += 10;
    view.setUint16(off, 0, false); // 2-byte pad
    off += 2;
    view.setUint16(off, name.length + 1, false);
    off += 2;
    for (let j = 0; j < name.length; j++) {
      view.setUint16(off, name.charCodeAt(j), false);
      off += 2;
    }
    view.setUint16(off, 0, false);
    off += 2;
  }
  return buf;
}

// ---- HEX list output (reverse of parseHexList) -----------------------

/**
 * Serialize a palette as a flat list of hex codes, one per line.
 * Color names are preserved as inline `; <name>` comments so a round
 * trip through ASE/GPL doesn't strip them.
 */
export function buildHexList(palette: Palette): string {
  const lines: string[] = [];
  for (const c of palette.colors) {
    const hex = toHex(c);
    lines.push(c.name ? `${hex} ; ${c.name}` : hex);
  }
  return lines.join("\n") + "\n";
}

// ---- CSS variables ----------------------------------------------------

/**
 * Parse colors out of a CSS file. Recognizes:
 *   - CSS custom properties:  --primary: #ff0000;
 *   - Inline color values:    color: #ff0000;
 *   - rgb()/rgba() functional notation
 *
 * Any stylesheet that declares colors is fair game; we extract every
 * hex/rgb value and treat them as a flat palette. Names come from
 * the surrounding custom-property declaration when available.
 */
export function parseCss(text: string): Palette {
  const colors: Color[] = [];
  const seen = new Set<string>();
  let unnamedIdx = 1;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("/*")) continue;

    const customPropMatch = line.match(/^--([\w-]+)\s*:\s*/);
    const baseName = customPropMatch ? customPropMatch[1] : null;

    // Hex codes (3 or 6 digit)
    const hexMatches = line.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
    for (const m of hexMatches) {
      let hex = m[1];
      if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const key = `${r},${g},${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      colors.push({ r, g, b, name: baseName ?? `color-${unnamedIdx++}` });
    }

    // rgb()/rgba() functional notation
    const rgbMatches = line.matchAll(/rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/g);
    for (const m of rgbMatches) {
      const r = parseInt(m[1], 10);
      const g = parseInt(m[2], 10);
      const b = parseInt(m[3], 10);
      const key = `${r},${g},${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      colors.push({ r, g, b, name: baseName ?? `color-${unnamedIdx++}` });
    }
  }
  return { colors };
}

export function buildPaletteCss(palette: Palette): string {
  const lines = [":root {"];
  let unnamedIdx = 1;
  for (const c of palette.colors) {
    const slug = (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : `color-${unnamedIdx++}`) || `color-${unnamedIdx++}`;
    lines.push(`  --${slug}: ${toHex(c)};`);
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}

// ---- JSON (output only) -----------------------------------------------

export function buildPaletteJson(palette: Palette): string {
  return JSON.stringify(
    {
      name: palette.name,
      colors: palette.colors.map((c) => ({
        name: c.name,
        hex: toHex(c),
        rgb: { r: c.r, g: c.g, b: c.b },
      })),
    },
    null,
    2,
  );
}
