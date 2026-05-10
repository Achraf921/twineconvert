/**
 * Minimal mesh parsers/writers for STL and 3MF, skipping three.js to
 * keep the per-route bundle small. The mesh interchange we care about
 * is just "triangles in 3D space," so the in-memory model is flat
 * vertex/triangle arrays.
 */

import type JSZipType from "jszip";

export interface Mesh {
  /** Flat vertex array: [x0, y0, z0, x1, y1, z1, ...]. */
  vertices: Float32Array;
  /** Flat triangle index array: [a0, b0, c0, a1, b1, c1, ...]. */
  triangles: Uint32Array;
}

// ---- STL (binary + ASCII) ---------------------------------------------

/**
 * STL file detection: ASCII files start with "solid"; binary files have
 * an 80-byte header followed by a uint32 triangle count. Some ASCII STLs
 * also start with "solid" but have a binary body, we detect via file
 * size: binary = 84 + N * 50 bytes for N triangles.
 */
export function parseStl(buf: ArrayBuffer): Mesh {
  // Try ASCII detection first (cheap)
  const head = new Uint8Array(buf, 0, Math.min(buf.byteLength, 80));
  let asAscii = true;
  for (const b of head) {
    if (b > 127 || (b < 32 && b !== 9 && b !== 10 && b !== 13)) {
      asAscii = false;
      break;
    }
  }
  if (asAscii) {
    const decoder = new TextDecoder("ascii");
    const text = decoder.decode(buf);
    if (text.trimStart().startsWith("solid") && text.includes("facet")) {
      return parseAsciiStl(text);
    }
  }
  return parseBinaryStl(buf);
}

function parseBinaryStl(buf: ArrayBuffer): Mesh {
  const view = new DataView(buf);
  if (buf.byteLength < 84) throw new Error("STL too small to be valid binary");
  const triCount = view.getUint32(80, true);
  const expectedSize = 84 + triCount * 50;
  if (buf.byteLength < expectedSize) {
    throw new Error(`STL truncated: expected ${expectedSize} bytes for ${triCount} triangles, got ${buf.byteLength}`);
  }
  const vertices = new Float32Array(triCount * 9);
  const triangles = new Uint32Array(triCount * 3);
  let off = 84;
  for (let t = 0; t < triCount; t++) {
    // Skip the 12-byte normal (we recompute on write)
    off += 12;
    for (let v = 0; v < 9; v++) {
      vertices[t * 9 + v] = view.getFloat32(off, true);
      off += 4;
    }
    triangles[t * 3] = t * 3;
    triangles[t * 3 + 1] = t * 3 + 1;
    triangles[t * 3 + 2] = t * 3 + 2;
    // Skip the 2-byte attribute count
    off += 2;
  }
  return { vertices, triangles };
}

function parseAsciiStl(text: string): Mesh {
  const verts: number[] = [];
  // Match every "vertex x y z" line.
  const re = /vertex\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)/g;
  for (const m of text.matchAll(re)) {
    verts.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  }
  const triCount = verts.length / 9;
  const triangles = new Uint32Array(triCount * 3);
  for (let i = 0; i < triCount * 3; i++) triangles[i] = i;
  return { vertices: Float32Array.from(verts), triangles };
}

export function buildBinaryStl(mesh: Mesh): ArrayBuffer {
  const triCount = mesh.triangles.length / 3;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  // Header (80 bytes, leave zero-filled apart from a tag).
  const tag = "client-conversion STL";
  for (let i = 0; i < tag.length && i < 80; i++) view.setUint8(i, tag.charCodeAt(i));
  view.setUint32(80, triCount, true);
  let off = 84;
  for (let t = 0; t < triCount; t++) {
    const a = mesh.triangles[t * 3];
    const b = mesh.triangles[t * 3 + 1];
    const c = mesh.triangles[t * 3 + 2];
    const ax = mesh.vertices[a * 3], ay = mesh.vertices[a * 3 + 1], az = mesh.vertices[a * 3 + 2];
    const bx = mesh.vertices[b * 3], by = mesh.vertices[b * 3 + 1], bz = mesh.vertices[b * 3 + 2];
    const cx = mesh.vertices[c * 3], cy = mesh.vertices[c * 3 + 1], cz = mesh.vertices[c * 3 + 2];
    // Compute normal via cross product
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const nlen = Math.hypot(nx, ny, nz) || 1;
    nx /= nlen; ny /= nlen; nz /= nlen;
    view.setFloat32(off, nx, true); off += 4;
    view.setFloat32(off, ny, true); off += 4;
    view.setFloat32(off, nz, true); off += 4;
    view.setFloat32(off, ax, true); off += 4;
    view.setFloat32(off, ay, true); off += 4;
    view.setFloat32(off, az, true); off += 4;
    view.setFloat32(off, bx, true); off += 4;
    view.setFloat32(off, by, true); off += 4;
    view.setFloat32(off, bz, true); off += 4;
    view.setFloat32(off, cx, true); off += 4;
    view.setFloat32(off, cy, true); off += 4;
    view.setFloat32(off, cz, true); off += 4;
    view.setUint16(off, 0, true); off += 2;
  }
  return buf;
}

// ---- 3MF ---------------------------------------------------------------

/**
 * 3MF (3D Manufacturing Format) is a zip containing:
 *   [Content_Types].xml , MIME map
 *   _rels/.rels         , package relationships
 *   3D/3dmodel.model    , the actual mesh as XML
 *
 * The model XML uses millimeter units by default; mesh data is just
 * vertices and triangles. We omit materials and components (the
 * mainstream Bambu/Prusa workflow doesn't need them for plain meshes).
 */

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

function buildModelXml(mesh: Mesh): string {
  const vCount = mesh.vertices.length / 3;
  const tCount = mesh.triangles.length / 3;
  const verts: string[] = new Array(vCount);
  for (let i = 0; i < vCount; i++) {
    verts[i] = `<vertex x="${mesh.vertices[i * 3]}" y="${mesh.vertices[i * 3 + 1]}" z="${mesh.vertices[i * 3 + 2]}"/>`;
  }
  const tris: string[] = new Array(tCount);
  for (let i = 0; i < tCount; i++) {
    tris[i] = `<triangle v1="${mesh.triangles[i * 3]}" v2="${mesh.triangles[i * 3 + 1]}" v3="${mesh.triangles[i * 3 + 2]}"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>${verts.join("")}</vertices>
        <triangles>${tris.join("")}</triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`;
}

export async function buildThreeMf(mesh: Mesh): Promise<Blob> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.file("_rels/.rels", RELS_XML);
  zip.file("3D/3dmodel.model", buildModelXml(mesh));
  return zip.generateAsync({ type: "blob", mimeType: "model/3mf" });
}

export async function parseThreeMf(input: File | Blob): Promise<Mesh> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(await input.arrayBuffer());
  const modelEntry = zip.file("3D/3dmodel.model") ?? zip.file(/3dmodel\.model$/i)[0];
  if (!modelEntry) throw new Error("3MF: no 3dmodel.model found inside the zip");
  const xml = await modelEntry.async("string");
  if (typeof DOMParser === "undefined") throw new Error("DOMParser unavailable");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const vertNodes = doc.getElementsByTagName("vertex");
  const triNodes = doc.getElementsByTagName("triangle");

  const vertices = new Float32Array(vertNodes.length * 3);
  for (let i = 0; i < vertNodes.length; i++) {
    vertices[i * 3] = parseFloat(vertNodes[i].getAttribute("x") ?? "0");
    vertices[i * 3 + 1] = parseFloat(vertNodes[i].getAttribute("y") ?? "0");
    vertices[i * 3 + 2] = parseFloat(vertNodes[i].getAttribute("z") ?? "0");
  }
  const triangles = new Uint32Array(triNodes.length * 3);
  for (let i = 0; i < triNodes.length; i++) {
    triangles[i * 3] = parseInt(triNodes[i].getAttribute("v1") ?? "0", 10);
    triangles[i * 3 + 1] = parseInt(triNodes[i].getAttribute("v2") ?? "0", 10);
    triangles[i * 3 + 2] = parseInt(triNodes[i].getAttribute("v3") ?? "0", 10);
  }
  return { vertices, triangles };
}

// ---- OBJ → mesh (input only) ------------------------------------------

export function parseObj(text: string): Mesh {
  const verts: number[] = [];
  const tris: number[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("v ")) {
      const parts = line.slice(2).trim().split(/\s+/).map(parseFloat);
      verts.push(parts[0], parts[1], parts[2]);
    } else if (line.startsWith("f ")) {
      // Face line: f a/_/_ b/_/_ c/_/_  (also supports d for quad, we triangulate)
      const idx = line.slice(2).trim().split(/\s+/).map((tok) => parseInt(tok.split("/")[0], 10) - 1);
      // Triangulate fan-style for n-gons
      for (let i = 1; i < idx.length - 1; i++) {
        tris.push(idx[0], idx[i], idx[i + 1]);
      }
    }
  }
  return { vertices: Float32Array.from(verts), triangles: Uint32Array.from(tris) };
}
