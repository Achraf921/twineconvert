/**
 * PLY (Stanford Polygon File Format) parser + writer.
 *
 * PLY is the mesh/point-cloud interchange format from Stanford's 3D scanning
 * lab (Turk & Levoy, 1994), still the standard output of photogrammetry and
 * scanning tools and a first-class Blender import/export format. Three body
 * encodings exist and all appear in the wild: ascii, binary_little_endian,
 * binary_big_endian. The header is always ASCII and fully describes the body
 * layout (elements in order, each with typed properties), so a correct parser
 * must honor the header rather than assume x/y/z come first.
 *
 * We extract vertex positions (properties named x, y, z, any numeric type)
 * and faces (the list property named vertex_indices or vertex_index),
 * fan-triangulating n-gons. Extra properties (normals, colors, UVs,
 * confidence, custom scalars) and extra elements (edge, material, camera) are
 * skipped by walking their declared sizes, so real-world scanner output
 * parses instead of erroring. Files with zero faces are accepted only if the
 * caller opts in (point clouds cannot become a surface mesh honestly).
 *
 * The writer emits ascii PLY: universally readable back into Blender,
 * MeshLab, CloudCompare, and trivially inspectable by the user.
 */

import type { Mesh } from "./mesh";

type PlyScalarType =
  | "char" | "int8"
  | "uchar" | "uint8"
  | "short" | "int16"
  | "ushort" | "uint16"
  | "int" | "int32"
  | "uint" | "uint32"
  | "float" | "float32"
  | "double" | "float64";

const SCALAR_BYTES: Record<PlyScalarType, number> = {
  char: 1, int8: 1,
  uchar: 1, uint8: 1,
  short: 2, int16: 2,
  ushort: 2, uint16: 2,
  int: 4, int32: 4,
  uint: 4, uint32: 4,
  float: 4, float32: 4,
  double: 8, float64: 8,
};

interface PlyProperty {
  name: string;
  /** Scalar type, or the item type for list properties. */
  type: PlyScalarType;
  /** Set when this is a list property; the type of the leading count. */
  countType?: PlyScalarType;
}

interface PlyElement {
  name: string;
  count: number;
  properties: PlyProperty[];
}

interface PlyHeader {
  format: "ascii" | "binary_little_endian" | "binary_big_endian";
  elements: PlyElement[];
  /** Byte offset where the body starts (right after the end_header line). */
  bodyOffset: number;
}

function isScalarType(tok: string): tok is PlyScalarType {
  return tok in SCALAR_BYTES;
}

function parseHeader(buf: ArrayBuffer): PlyHeader {
  // The header is ASCII and ends with "end_header\n" (or \r\n). Decode a
  // window from the front; 64 KiB is far beyond any real header.
  const windowBytes = new Uint8Array(buf, 0, Math.min(buf.byteLength, 65536));
  const text = new TextDecoder("latin1").decode(windowBytes);
  const endMatch = /end_header\r?\n/.exec(text);
  if (!text.startsWith("ply") || !endMatch) {
    throw new Error("Not a valid PLY file (missing ply magic or end_header)");
  }
  const bodyOffset = endMatch.index + endMatch[0].length;
  const headerText = text.slice(0, endMatch.index);

  let format: PlyHeader["format"] | null = null;
  const elements: PlyElement[] = [];
  for (const rawLine of headerText.split(/\r?\n/)) {
    const parts = rawLine.trim().split(/\s+/);
    switch (parts[0]) {
      case "format": {
        if (parts[1] === "ascii" || parts[1] === "binary_little_endian" || parts[1] === "binary_big_endian") {
          format = parts[1];
        } else {
          throw new Error(`Unsupported PLY format "${parts[1]}"`);
        }
        break;
      }
      case "element": {
        const count = parseInt(parts[2], 10);
        if (!parts[1] || !Number.isFinite(count) || count < 0) {
          throw new Error(`Malformed PLY element declaration: "${rawLine.trim()}"`);
        }
        elements.push({ name: parts[1], count, properties: [] });
        break;
      }
      case "property": {
        const el = elements[elements.length - 1];
        if (!el) throw new Error("PLY property declared before any element");
        if (parts[1] === "list") {
          const [, , countType, type, name] = parts;
          if (!isScalarType(countType) || !isScalarType(type) || !name) {
            throw new Error(`Malformed PLY list property: "${rawLine.trim()}"`);
          }
          el.properties.push({ name, type, countType });
        } else {
          const [, type, name] = parts;
          if (!isScalarType(type) || !name) {
            throw new Error(`Malformed PLY property: "${rawLine.trim()}"`);
          }
          el.properties.push({ name, type });
        }
        break;
      }
      // "ply", "comment", "obj_info", blank lines: ignore
    }
  }
  if (!format) throw new Error("PLY header is missing the format line");
  return { format, elements, bodyOffset };
}

/** Sequential binary reader honoring the header's endianness. */
class BinaryCursor {
  private view: DataView;
  offset: number;
  private little: boolean;

  constructor(buf: ArrayBuffer, offset: number, littleEndian: boolean) {
    this.view = new DataView(buf);
    this.offset = offset;
    this.little = littleEndian;
  }

  read(type: PlyScalarType): number {
    const o = this.offset;
    this.offset += SCALAR_BYTES[type];
    if (this.offset > this.view.byteLength) throw new Error("PLY body is truncated");
    switch (type) {
      case "char": case "int8": return this.view.getInt8(o);
      case "uchar": case "uint8": return this.view.getUint8(o);
      case "short": case "int16": return this.view.getInt16(o, this.little);
      case "ushort": case "uint16": return this.view.getUint16(o, this.little);
      case "int": case "int32": return this.view.getInt32(o, this.little);
      case "uint": case "uint32": return this.view.getUint32(o, this.little);
      case "float": case "float32": return this.view.getFloat32(o, this.little);
      case "double": case "float64": return this.view.getFloat64(o, this.little);
    }
  }
}

/** Sequential ASCII token reader for ascii-format bodies. */
class TokenCursor {
  private tokens: string[];
  private i = 0;

  constructor(text: string) {
    this.tokens = text.split(/\s+/).filter((t) => t.length > 0);
  }

  read(): number {
    if (this.i >= this.tokens.length) throw new Error("PLY body is truncated");
    return parseFloat(this.tokens[this.i++]);
  }
}

export interface ParsePlyOptions {
  /** Accept files with zero faces (point clouds). Default false. */
  allowPointCloud?: boolean;
}

export function parsePly(buf: ArrayBuffer, options?: ParsePlyOptions): Mesh {
  const header = parseHeader(buf);
  const ascii = header.format === "ascii";
  const bin = ascii
    ? null
    : new BinaryCursor(buf, header.bodyOffset, header.format === "binary_little_endian");
  const tok = ascii
    ? new TokenCursor(new TextDecoder("latin1").decode(new Uint8Array(buf, header.bodyOffset)))
    : null;
  const next = (type: PlyScalarType): number => (ascii ? tok!.read() : bin!.read(type));

  const verts: number[] = [];
  const tris: number[] = [];

  for (const el of header.elements) {
    const isVertex = el.name === "vertex";
    const isFace = el.name === "face";
    for (let i = 0; i < el.count; i++) {
      let x = 0, y = 0, z = 0;
      for (const prop of el.properties) {
        if (prop.countType) {
          // List property: leading count then that many items.
          const n = next(prop.countType);
          if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
            throw new Error("PLY face list has an invalid item count");
          }
          const isFaceIndices =
            isFace && (prop.name === "vertex_indices" || prop.name === "vertex_index");
          const items: number[] = new Array(n);
          for (let k = 0; k < n; k++) items[k] = next(prop.type);
          if (isFaceIndices) {
            // Fan-triangulate the polygon.
            for (let k = 1; k + 1 < n; k++) {
              tris.push(items[0], items[k], items[k + 1]);
            }
          }
        } else {
          const value = next(prop.type);
          if (isVertex) {
            if (prop.name === "x") x = value;
            else if (prop.name === "y") y = value;
            else if (prop.name === "z") z = value;
          }
        }
      }
      if (isVertex) verts.push(x, y, z);
    }
  }

  if (verts.length === 0) throw new Error("PLY contains no vertices");
  if (tris.length === 0 && !options?.allowPointCloud) {
    throw new Error(
      "PLY contains no faces (it looks like a point cloud, which has no surface to convert)",
    );
  }
  const vertexCount = verts.length / 3;
  for (const idx of tris) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= vertexCount) {
      throw new Error("PLY face references a vertex index outside the vertex list");
    }
  }
  return { vertices: Float32Array.from(verts), triangles: Uint32Array.from(tris) };
}

/** Build an ascii PLY from a mesh. */
export function buildPly(mesh: Mesh): string {
  const vCount = mesh.vertices.length / 3;
  const tCount = mesh.triangles.length / 3;
  const lines: string[] = [
    "ply",
    "format ascii 1.0",
    "comment generated by twineconvert",
    `element vertex ${vCount}`,
    "property float x",
    "property float y",
    "property float z",
    `element face ${tCount}`,
    "property list uchar int vertex_indices",
    "end_header",
  ];
  for (let i = 0; i < vCount; i++) {
    lines.push(
      `${mesh.vertices[i * 3]} ${mesh.vertices[i * 3 + 1]} ${mesh.vertices[i * 3 + 2]}`,
    );
  }
  for (let i = 0; i < tCount; i++) {
    lines.push(
      `3 ${mesh.triangles[i * 3]} ${mesh.triangles[i * 3 + 1]} ${mesh.triangles[i * 3 + 2]}`,
    );
  }
  return lines.join("\n") + "\n";
}
