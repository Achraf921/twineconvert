/**
 * Embroidery format parsers and writers.
 *
 * Common machine-embroidery formats are all sequences of "stitch records"
 * with control codes for jumps, color changes, trims, and ends. Each
 * brand uses different file headers and encoding conventions but the
 * underlying stitch model is shared.
 *
 * Internal model:
 *   Stitch[] — { x, y (absolute, units of 0.1mm), command }
 *   command in: NORMAL | JUMP | TRIM | STOP | COLOR_CHANGE | END
 *
 * Coordinate conventions:
 *   - All formats use 0.1mm-per-unit (so 100 = 1cm).
 *   - Y-axis convention varies (DST/PES use Y-up; we keep Y-up internally
 *     and flip on write where needed).
 *
 * v1 supports the four highest-volume formats:
 *   DST (Tajima), PES (Brother), JEF (Janome), EXP (Melco/Bernina)
 */

export const enum StitchCommand {
  NORMAL = 0,
  JUMP = 1,
  TRIM = 2,
  STOP = 3,
  COLOR_CHANGE = 4,
  END = 5,
}

export interface Stitch {
  x: number;
  y: number;
  command: StitchCommand;
}

export interface EmbroideryDesign {
  stitches: Stitch[];
  /** Optional thread color list as hex strings. */
  threads?: string[];
  /** Bounding box in 0.1mm units (computed on demand). */
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
}

export function computeBbox(design: EmbroideryDesign): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of design.stitches) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

// ============================================================================
// DST (Tajima) — most widely supported industrial format
// ============================================================================
//
// DST file structure:
//   Header: 512 bytes of fixed-position ASCII metadata + null padding
//     LA: design name      ST: stitch count       CO: color count
//     +X/-X/+Y/-Y: extents AX/AY/MX/MY: position info
//   Body: 3-byte stitch records until end:
//     byte 0: dx low bits + flags
//     byte 1: dy low bits + flags
//     byte 2: high bits + command flags
//   End: 0x00 0x00 0xF3 ("end" command)
//
// Coordinate decoding is bit-twiddly because Tajima encoded dx/dy across
// all three bytes to maximize range; the table below names which bit
// positions contribute which numeric value.

function decodeDstStitch(b0: number, b1: number, b2: number): { dx: number; dy: number; command: StitchCommand } {
  // Bits per byte (LSB to MSB).
  // b0: y+1, y-1, y+9, y-9, x-9, x+9, x-1, x+1
  // b1: y+3, y-3, y+27, y-27, x-27, x+27, x-3, x+3
  // b2: 0,   0,  y+81, y-81, x-81, x+81, set, jump
  let x = 0, y = 0;
  if (b0 & 0x01) y += 1;
  if (b0 & 0x02) y -= 1;
  if (b0 & 0x04) y += 9;
  if (b0 & 0x08) y -= 9;
  if (b0 & 0x10) x -= 9;
  if (b0 & 0x20) x += 9;
  if (b0 & 0x40) x -= 1;
  if (b0 & 0x80) x += 1;
  if (b1 & 0x01) y += 3;
  if (b1 & 0x02) y -= 3;
  if (b1 & 0x04) y += 27;
  if (b1 & 0x08) y -= 27;
  if (b1 & 0x10) x -= 27;
  if (b1 & 0x20) x += 27;
  if (b1 & 0x40) x -= 3;
  if (b1 & 0x80) x += 3;
  if (b2 & 0x04) y += 81;
  if (b2 & 0x08) y -= 81;
  if (b2 & 0x10) x -= 81;
  if (b2 & 0x20) x += 81;

  let command = StitchCommand.NORMAL;
  if ((b2 & 0xC3) === 0xC3) command = StitchCommand.COLOR_CHANGE;
  else if ((b2 & 0xC3) === 0x83) command = StitchCommand.JUMP;
  else if (b2 === 0xF3) command = StitchCommand.END;

  return { dx: x, dy: y, command };
}

function encodeDstStitch(dx: number, dy: number, command: StitchCommand): [number, number, number] {
  let b0 = 0, b1 = 0, b2 = 0;
  // Saturate to DST's representable range (-121..+121 per stitch, sum of bit weights).
  const sat = (n: number) => Math.max(-121, Math.min(121, n));
  let xRem = sat(dx);
  let yRem = sat(dy);

  // Greedy decomposition into the bit-weight ladder.
  const consume = (weight: number, posMask: { byte: 0 | 1 | 2; bit: number }, negMask: { byte: 0 | 1 | 2; bit: number }) => {
    while (xRem >= weight) {
      const bit = posMask.byte === 0 ? "b0" : posMask.byte === 1 ? "b1" : "b2";
      if (bit === "b0") b0 |= posMask.bit;
      else if (bit === "b1") b1 |= posMask.bit;
      else b2 |= posMask.bit;
      xRem -= weight;
    }
    while (xRem <= -weight) {
      const bit = negMask.byte === 0 ? "b0" : negMask.byte === 1 ? "b1" : "b2";
      if (bit === "b0") b0 |= negMask.bit;
      else if (bit === "b1") b1 |= negMask.bit;
      else b2 |= negMask.bit;
      xRem += weight;
    }
  };
  const consumeY = (weight: number, posMask: { byte: 0 | 1 | 2; bit: number }, negMask: { byte: 0 | 1 | 2; bit: number }) => {
    while (yRem >= weight) {
      const bit = posMask.byte === 0 ? "b0" : posMask.byte === 1 ? "b1" : "b2";
      if (bit === "b0") b0 |= posMask.bit;
      else if (bit === "b1") b1 |= posMask.bit;
      else b2 |= posMask.bit;
      yRem -= weight;
    }
    while (yRem <= -weight) {
      const bit = negMask.byte === 0 ? "b0" : negMask.byte === 1 ? "b1" : "b2";
      if (bit === "b0") b0 |= negMask.bit;
      else if (bit === "b1") b1 |= negMask.bit;
      else b2 |= negMask.bit;
      yRem += weight;
    }
  };

  // X bit ladder
  consume(81, { byte: 2, bit: 0x20 }, { byte: 2, bit: 0x10 });
  consume(27, { byte: 1, bit: 0x20 }, { byte: 1, bit: 0x10 });
  consume(9,  { byte: 0, bit: 0x20 }, { byte: 0, bit: 0x10 });
  consume(3,  { byte: 1, bit: 0x80 }, { byte: 1, bit: 0x40 });
  consume(1,  { byte: 0, bit: 0x80 }, { byte: 0, bit: 0x40 });
  // Y bit ladder
  consumeY(81, { byte: 2, bit: 0x04 }, { byte: 2, bit: 0x08 });
  consumeY(27, { byte: 1, bit: 0x04 }, { byte: 1, bit: 0x08 });
  consumeY(9,  { byte: 0, bit: 0x04 }, { byte: 0, bit: 0x08 });
  consumeY(3,  { byte: 1, bit: 0x01 }, { byte: 1, bit: 0x02 });
  consumeY(1,  { byte: 0, bit: 0x01 }, { byte: 0, bit: 0x02 });

  // Command flag
  if (command === StitchCommand.COLOR_CHANGE) b2 |= 0xC3;
  else if (command === StitchCommand.JUMP) b2 |= 0x83;
  else if (command === StitchCommand.END) { b0 = 0; b1 = 0; b2 = 0xF3; }
  else b2 |= 0x03;

  return [b0, b1, b2];
}

export function parseDst(buf: ArrayBuffer): EmbroideryDesign {
  if (buf.byteLength < 512) throw new Error("DST file too small for header");
  const view = new DataView(buf);
  const stitches: Stitch[] = [];
  let x = 0, y = 0;
  let off = 512;
  while (off + 3 <= buf.byteLength) {
    const b0 = view.getUint8(off);
    const b1 = view.getUint8(off + 1);
    const b2 = view.getUint8(off + 2);
    off += 3;
    const { dx, dy, command } = decodeDstStitch(b0, b1, b2);
    x += dx;
    y += dy;
    stitches.push({ x, y, command });
    if (command === StitchCommand.END) break;
  }
  return { stitches };
}

export function buildDst(design: EmbroideryDesign): ArrayBuffer {
  const bbox = computeBbox(design);
  const stitchCount = design.stitches.filter((s) => s.command !== StitchCommand.END).length;
  const colorCount = design.stitches.filter((s) => s.command === StitchCommand.COLOR_CHANGE).length + 1;

  // 512-byte ASCII header
  const headerStr = [
    `LA:${"unnamed".padEnd(16, " ")}`,
    `ST:${String(stitchCount).padStart(7, "0")}`,
    `CO:${String(colorCount).padStart(3, "0")}`,
    `+X:${String(bbox.maxX).padStart(5, "0")}`,
    `-X:${String(Math.abs(bbox.minX)).padStart(5, "0")}`,
    `+Y:${String(bbox.maxY).padStart(5, "0")}`,
    `-Y:${String(Math.abs(bbox.minY)).padStart(5, "0")}`,
    `AX:+00000`, `AY:+00000`, `MX:+00000`, `MY:+00000`, `PD:******`,
  ].join("\r");
  const header = new Uint8Array(512);
  for (let i = 0; i < headerStr.length && i < 511; i++) header[i] = headerStr.charCodeAt(i);
  header[Math.min(headerStr.length, 511)] = 0x1a;

  // Body: convert absolute → delta, encode each stitch
  const bodyBytes: number[] = [];
  let prevX = 0, prevY = 0;
  for (const s of design.stitches) {
    if (s.command === StitchCommand.END) {
      bodyBytes.push(0x00, 0x00, 0xF3);
      continue;
    }
    let dx = s.x - prevX;
    let dy = s.y - prevY;
    // Split moves > 121 units into multiple jump stitches.
    while (Math.abs(dx) > 121 || Math.abs(dy) > 121) {
      const stepX = Math.max(-121, Math.min(121, dx));
      const stepY = Math.max(-121, Math.min(121, dy));
      const [a, b, c] = encodeDstStitch(stepX, stepY, StitchCommand.JUMP);
      bodyBytes.push(a, b, c);
      dx -= stepX;
      dy -= stepY;
    }
    const [a, b, c] = encodeDstStitch(dx, dy, s.command);
    bodyBytes.push(a, b, c);
    prevX = s.x;
    prevY = s.y;
  }
  // Ensure terminator
  if (bodyBytes.length < 3 || bodyBytes[bodyBytes.length - 1] !== 0xF3) {
    bodyBytes.push(0x00, 0x00, 0xF3);
  }

  const out = new Uint8Array(512 + bodyBytes.length);
  out.set(header, 0);
  out.set(bodyBytes, 512);
  return out.buffer;
}

// ============================================================================
// EXP (Melco / Bernina) — simplest format: no header, just stitch deltas
// ============================================================================
//
// Each stitch is 2 bytes (signed dx, dy). Control codes use 0x80 in byte 0
// followed by a code byte: 0x80 0x01 = color change, 0x80 0x02 = end.

export function parseExp(buf: ArrayBuffer): EmbroideryDesign {
  const view = new DataView(buf);
  const stitches: Stitch[] = [];
  let x = 0, y = 0;
  for (let off = 0; off + 2 <= buf.byteLength; off += 2) {
    const b0 = view.getInt8(off);
    const b1 = view.getInt8(off + 1);
    if (b0 === -128 /* 0x80 */) {
      // Control code in unsigned form
      const code = view.getUint8(off + 1);
      if (code === 0x01) stitches.push({ x, y, command: StitchCommand.COLOR_CHANGE });
      else if (code === 0x02) { stitches.push({ x, y, command: StitchCommand.END }); break; }
      else if (code === 0x04) {
        // Jump — delta is in the next 2 bytes
        if (off + 4 > buf.byteLength) break;
        x += view.getInt8(off + 2);
        y += view.getInt8(off + 3);
        stitches.push({ x, y, command: StitchCommand.JUMP });
        off += 2;
      }
    } else {
      x += b0;
      y += b1;
      stitches.push({ x, y, command: StitchCommand.NORMAL });
    }
  }
  return { stitches };
}

export function buildExp(design: EmbroideryDesign): ArrayBuffer {
  const out: number[] = [];
  let prevX = 0, prevY = 0;
  for (const s of design.stitches) {
    if (s.command === StitchCommand.END) {
      out.push(0x80, 0x02);
      break;
    }
    if (s.command === StitchCommand.COLOR_CHANGE) {
      out.push(0x80, 0x01);
      continue;
    }
    let dx = s.x - prevX;
    let dy = s.y - prevY;
    while (Math.abs(dx) > 127 || Math.abs(dy) > 127) {
      const stepX = Math.max(-127, Math.min(127, dx));
      const stepY = Math.max(-127, Math.min(127, dy));
      out.push(0x80, 0x04, stepX & 0xff, stepY & 0xff);
      dx -= stepX;
      dy -= stepY;
    }
    out.push(dx & 0xff, dy & 0xff);
    prevX = s.x;
    prevY = s.y;
  }
  if (out.length < 2 || out[out.length - 2] !== 0x80) out.push(0x80, 0x02);
  return new Uint8Array(out).buffer;
}

// ============================================================================
// JEF (Janome) — header with color list, then simple 2-byte stitches
// ============================================================================
//
// JEF header is ~116 bytes of fixed-position metadata followed by a
// color table (4 bytes per color), then stitch data. Stitches use the
// same 2-byte delta convention as EXP, with control codes 0x80 0x01
// (color change) and 0x80 0x10 (end).

export function parseJef(buf: ArrayBuffer): EmbroideryDesign {
  const view = new DataView(buf);
  const stitchOffset = view.getUint32(0, true);
  const colorCount = view.getUint32(24, true);
  const threads: string[] = [];
  for (let i = 0; i < colorCount; i++) {
    const colorIdx = view.getUint32(116 + i * 4, true);
    threads.push(jefColorIndexToHex(colorIdx));
  }
  const stitches: Stitch[] = [];
  let x = 0, y = 0;
  let off = stitchOffset;
  while (off + 2 <= buf.byteLength) {
    const b0 = view.getUint8(off);
    const b1 = view.getUint8(off + 1);
    if (b0 === 0x80) {
      if (b1 === 0x10 || b1 === 0x00) { stitches.push({ x, y, command: StitchCommand.END }); break; }
      if (b1 === 0x01) { stitches.push({ x, y, command: StitchCommand.COLOR_CHANGE }); off += 2; continue; }
      if (b1 === 0x02) {
        if (off + 4 > buf.byteLength) break;
        const dx = view.getInt8(off + 2);
        const dy = view.getInt8(off + 3);
        x += dx; y += dy;
        stitches.push({ x, y, command: StitchCommand.JUMP });
        off += 4;
        continue;
      }
      off += 2;
      continue;
    }
    const dx = view.getInt8(off);
    const dy = view.getInt8(off + 1);
    x += dx; y += dy;
    stitches.push({ x, y, command: StitchCommand.NORMAL });
    off += 2;
  }
  return { stitches, threads };
}

export function buildJef(design: EmbroideryDesign): ArrayBuffer {
  // Build stitch body first so we know its size
  const body: number[] = [];
  let prevX = 0, prevY = 0;
  const colorChangeCount = design.stitches.filter((s) => s.command === StitchCommand.COLOR_CHANGE).length;
  const colorCount = colorChangeCount + 1;

  for (const s of design.stitches) {
    if (s.command === StitchCommand.END) { body.push(0x80, 0x10); break; }
    if (s.command === StitchCommand.COLOR_CHANGE) { body.push(0x80, 0x01); continue; }
    let dx = s.x - prevX;
    let dy = s.y - prevY;
    while (Math.abs(dx) > 127 || Math.abs(dy) > 127) {
      const stepX = Math.max(-127, Math.min(127, dx));
      const stepY = Math.max(-127, Math.min(127, dy));
      body.push(0x80, 0x02, stepX & 0xff, stepY & 0xff);
      dx -= stepX; dy -= stepY;
    }
    body.push(dx & 0xff, dy & 0xff);
    prevX = s.x; prevY = s.y;
  }
  if (body.length < 2 || body[body.length - 2] !== 0x80) body.push(0x80, 0x10);

  const headerSize = 116 + colorCount * 4;
  const stitchOffset = headerSize;
  const total = headerSize + body.length;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);

  dv.setUint32(0, stitchOffset, true);
  dv.setUint32(4, 0x14, true); // format
  // Skip optional date string at offset 8 (16 bytes ASCII) — leave zeros
  dv.setUint32(24, colorCount, true);
  // Stitch count, hoop type, extents — leave defaults; consumer software derives them.
  for (let i = 0; i < colorCount; i++) dv.setUint32(116 + i * 4, 14, true); // default color id
  out.set(body, headerSize);
  return out.buffer;
}

function jefColorIndexToHex(idx: number): string {
  // Janome's full color palette is huge — we map common slots and fall
  // back to neutral grey for unknowns. Round-trip through other formats
  // is what matters most here, not exact thread color reproduction.
  const palette: Record<number, string> = {
    0: "#000000", 1: "#FFFFFF", 14: "#444444",
    18: "#FF0000", 24: "#FFFF00", 30: "#0000FF", 36: "#00FF00",
  };
  return palette[idx] ?? "#888888";
}

// ============================================================================
// PES (Brother) — minimal: contains an embedded PEC subsection that's
// the actual stitch data. Full PES parsing is complex; for v1 we only
// READ the PEC subsection, and we WRITE a minimal v1 PES with one PEC.
// ============================================================================
//
// PES file structure (simplified):
//   Bytes 0-3: "#PES" signature
//   Bytes 4-7: version (e.g. "0001")
//   Byte 8 onwards: variable header. PEC start offset is at bytes 8-11.
//   Then PEC subsection: small color table + stitch data with the same
//   2-byte delta convention as JEF/EXP.

export function parsePes(buf: ArrayBuffer): EmbroideryDesign {
  const view = new DataView(buf);
  const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (sig !== "#PES") throw new Error("Not a PES file (bad signature)");
  const pecStart = view.getUint32(8, true);
  if (pecStart + 4 > buf.byteLength) throw new Error("PES: PEC start offset out of range");

  // Skip the PEC label header (variable; data starts after a 0x20 0x20 padding
  // and a few description bytes). The stitch list always begins exactly
  // 532 bytes into the PEC section in the v1 standard layout.
  let off = pecStart + 532;
  const stitches: Stitch[] = [];
  let x = 0, y = 0;

  while (off + 2 <= buf.byteLength) {
    const b0 = view.getUint8(off);
    const b1 = view.getUint8(off + 1);
    if (b0 === 0xff && b1 === 0x00) {
      stitches.push({ x, y, command: StitchCommand.END });
      break;
    }
    if (b0 === 0xfe && b1 === 0xb0) {
      stitches.push({ x, y, command: StitchCommand.COLOR_CHANGE });
      off += 3; // skip the color index byte that follows
      continue;
    }
    let dx: number;
    let dy: number;
    let cmd = StitchCommand.NORMAL;
    if (b0 & 0x80) {
      // Long-form 12-bit signed deltas spanning two bytes each.
      dx = ((b0 & 0x0f) << 8) | b1;
      if (dx & 0x800) dx -= 0x1000;
      if (b0 & 0x20) cmd = StitchCommand.JUMP;
      off += 2;
      if (off + 2 > buf.byteLength) break;
      const c0 = view.getUint8(off);
      const c1 = view.getUint8(off + 1);
      dy = ((c0 & 0x0f) << 8) | c1;
      if (dy & 0x800) dy -= 0x1000;
      off += 2;
    } else {
      dx = b0; if (dx & 0x40) dx -= 0x80;
      dy = b1; if (dy & 0x40) dy -= 0x80;
      off += 2;
    }
    x += dx; y += dy;
    stitches.push({ x, y, command: cmd });
  }
  return { stitches };
}

/** Write a minimal PES v1 file by embedding the design as a PEC subsection. */
export function buildPes(design: EmbroideryDesign): ArrayBuffer {
  // Build PEC stitch body
  const pecBody: number[] = [];
  let prevX = 0, prevY = 0;
  for (const s of design.stitches) {
    if (s.command === StitchCommand.END) { pecBody.push(0xff, 0x00); break; }
    if (s.command === StitchCommand.COLOR_CHANGE) { pecBody.push(0xfe, 0xb0, 0x01); continue; }
    let dx = s.x - prevX;
    let dy = s.y - prevY;
    while (Math.abs(dx) > 2047 || Math.abs(dy) > 2047) {
      const stepX = Math.max(-2047, Math.min(2047, dx));
      const stepY = Math.max(-2047, Math.min(2047, dy));
      const sx = stepX < 0 ? stepX + 0x1000 : stepX;
      const sy = stepY < 0 ? stepY + 0x1000 : stepY;
      pecBody.push(0x80 | 0x20 | ((sx >> 8) & 0x0f), sx & 0xff);
      pecBody.push(0x80 | 0x20 | ((sy >> 8) & 0x0f), sy & 0xff);
      dx -= stepX; dy -= stepY;
    }
    if (Math.abs(dx) <= 63 && Math.abs(dy) <= 63 && s.command === StitchCommand.NORMAL) {
      pecBody.push(dx & 0x7f, dy & 0x7f);
    } else {
      const ex = dx < 0 ? dx + 0x1000 : dx;
      const ey = dy < 0 ? dy + 0x1000 : dy;
      const cmdBit = s.command === StitchCommand.JUMP ? 0x20 : 0x00;
      pecBody.push(0x80 | cmdBit | ((ex >> 8) & 0x0f), ex & 0xff);
      pecBody.push(0x80 | cmdBit | ((ey >> 8) & 0x0f), ey & 0xff);
    }
    prevX = s.x; prevY = s.y;
  }
  if (pecBody.length < 2 || pecBody[pecBody.length - 2] !== 0xff) pecBody.push(0xff, 0x00);

  // PES "v1" structure: 8-byte signature, 4-byte PEC offset, minimal header,
  // followed by PEC. We use a 24-byte top header so PEC starts at 24.
  const pesHeaderSize = 24;
  const pecLabel = new Uint8Array(532);
  // PEC header: "LA:Untitled\r\n" then 0x20 padding to fill 532 bytes.
  const labelStr = "LA:Untitled\r";
  for (let i = 0; i < labelStr.length; i++) pecLabel[i] = labelStr.charCodeAt(i);
  for (let i = labelStr.length; i < 532; i++) pecLabel[i] = 0x20;

  const total = pesHeaderSize + pecLabel.length + pecBody.length;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);

  out[0] = 0x23; out[1] = 0x50; out[2] = 0x45; out[3] = 0x53; // "#PES"
  out[4] = 0x30; out[5] = 0x30; out[6] = 0x30; out[7] = 0x31; // "0001"
  dv.setUint32(8, pesHeaderSize, true); // PEC start
  // Bytes 12-23: minimal header padding
  out.set(pecLabel, pesHeaderSize);
  out.set(pecBody, pesHeaderSize + pecLabel.length);
  return out.buffer;
}
