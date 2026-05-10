/**
 * Binary fixtures that we generate programmatically — using either our own
 * writers (which doubles as a sanity check for the writer) or hand-crafted
 * bytes for tiny standard formats (PNG, JPEG, etc.).
 *
 * We deliberately do NOT commit binary files to the repo; instead each
 * fixture is built at test time. This keeps the repo lean and means
 * any writer regression breaks fixture creation, which fails loudly.
 */

import type JSZipType from "jszip";
import { buildAse, buildAco, type Palette } from "../../src/lib/engine/util/palette";
import { buildBinaryStl, type Mesh } from "../../src/lib/engine/util/mesh";
import { buildDst, buildPes, buildJef, buildExp, StitchCommand, type EmbroideryDesign } from "../../src/lib/engine/util/embroidery";

/** A 1x1 transparent PNG (smallest valid PNG, hand-crafted). */
export const TINY_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR length + name
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, // bit depth, color type, etc + CRC
  0x00, 0x00, 0x00, 0x0b, 0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // deflate stream
  0x0d, 0x0a, 0x2d, 0xb4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82, // IEND
]);

/** A 1x1 white JPEG (hand-crafted minimal). */
export const TINY_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
  0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xff, 0xdb, 0x00, 0x43, 0x00,
  ...new Array(64).fill(0x10),
  0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
  0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00,
  0xff, 0xd9,
]);

const SAMPLE_PALETTE: Palette = {
  name: "Test",
  colors: [
    { r: 255, g: 0, b: 0, name: "Red" },
    { r: 0, g: 255, b: 0, name: "Green" },
    { r: 0, g: 0, b: 255, name: "Blue" },
  ],
};

/** A minimal valid ASE palette (3 colors). */
export function makeTinyAse(): Uint8Array {
  return new Uint8Array(buildAse(SAMPLE_PALETTE));
}

/** A minimal valid ACO palette (3 colors). */
export function makeTinyAco(): Uint8Array {
  return new Uint8Array(buildAco(SAMPLE_PALETTE));
}

/** A unit cube as a Mesh — useful for STL/OBJ/3MF round-trips. */
export const SAMPLE_CUBE_MESH: Mesh = {
  vertices: new Float32Array([
    0, 0, 0,  1, 0, 0,  1, 1, 0,  0, 1, 0, // bottom face
    0, 0, 1,  1, 0, 1,  1, 1, 1,  0, 1, 1, // top face
  ]),
  triangles: new Uint32Array([
    0, 1, 2,  0, 2, 3,   // bottom
    4, 6, 5,  4, 7, 6,   // top
    0, 4, 5,  0, 5, 1,   // front
    1, 5, 6,  1, 6, 2,   // right
    2, 6, 7,  2, 7, 3,   // back
    3, 7, 4,  3, 4, 0,   // left
  ]),
};

/** A binary STL of the unit cube. */
export function makeTinyStl(): Uint8Array {
  return new Uint8Array(buildBinaryStl(SAMPLE_CUBE_MESH));
}

/** A minimal embroidery design with a few stitches and an end marker. */
const SAMPLE_DESIGN: EmbroideryDesign = {
  stitches: [
    { x: 0, y: 0, command: StitchCommand.NORMAL },
    { x: 100, y: 0, command: StitchCommand.NORMAL },
    { x: 100, y: 100, command: StitchCommand.NORMAL },
    { x: 0, y: 100, command: StitchCommand.NORMAL },
    { x: 0, y: 0, command: StitchCommand.END },
  ],
};

export function makeTinyDst(): Uint8Array { return new Uint8Array(buildDst(SAMPLE_DESIGN)); }
export function makeTinyPes(): Uint8Array { return new Uint8Array(buildPes(SAMPLE_DESIGN)); }
export function makeTinyJef(): Uint8Array { return new Uint8Array(buildJef(SAMPLE_DESIGN)); }
export function makeTinyExp(): Uint8Array { return new Uint8Array(buildExp(SAMPLE_DESIGN)); }

/** A trivial valid ZIP containing a single text file. Used as a stand-in
 *  for any "X is a zip" format we want to smoke-test (epub, docx, ase
 *  is NOT a zip but iWork/EPUB are). */
export async function makeTinyZip(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = new JSZip();
  zip.file("hello.txt", "world");
  const buf = await zip.generateAsync({ type: "uint8array" });
  return buf;
}

/** Wrap a Uint8Array as a File. */
export function fileFromBytes(name: string, bytes: Uint8Array, type = "application/octet-stream"): File {
  // Copy bytes into a fresh ArrayBuffer so File doesn't capture an
  // arbitrary BufferSource.
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new File([buf], name, { type });
}
