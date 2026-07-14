/**
 * glTF 2.0 support: GLB container parse/build, .gltf JSON parse/build, and
 * lossless GLB <-> .gltf container repacks. Bypasses heavyweight 3D libraries;
 * the spec is small enough to implement directly, which keeps the per-route
 * bundle tiny for converters that only ever do mesh <-> mesh.
 *
 * Wire format reference:
 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
 *
 * GLB structure:
 *   [12-byte header]
 *     uint32 magic    = 0x46546C67 ("glTF")
 *     uint32 version  = 2
 *     uint32 length   = total file length
 *   [JSON chunk]
 *     uint32 length   = JSON byte length (padded to multiple of 4)
 *     uint32 type     = 0x4E4F534A ("JSON")
 *   [BIN chunk] (optional)
 *     uint32 length   = BIN byte length (padded to multiple of 4)
 *     uint32 type     = 0x004E4942 ("BIN\0")
 *
 * Geometry extraction walks the scene graph applying node transforms
 * (matrix or TRS) and merges every triangle primitive it can read, honoring
 * accessor byteOffset, bufferView byteStride (interleaved layouts), all index
 * component types, and normalized quantized attributes. Draco-compressed and
 * external-file references produce actionable errors instead of garbage.
 */

import type { Mesh } from "./mesh";

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_TYPE_JSON = 0x4e4f534a; // "JSON"
const CHUNK_TYPE_BIN = 0x004e4942; // "BIN\0"

const COMPONENT_TYPE_UNSIGNED_INT = 5125;
const COMPONENT_TYPE_FLOAT = 5126;
const PRIMITIVE_MODE_TRIANGLES = 4;

const DRACO_EXTENSION = "KHR_draco_mesh_compression";

/** Pad a length up to the next multiple of 4 bytes (GLB chunk requirement). */
function padTo4(n: number): number {
  return (n + 3) & ~3;
}

// ---- shared glTF document types -----------------------------------------

interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  normalized?: boolean;
  count: number;
  type: string;
  sparse?: unknown;
}

interface GltfBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}

interface GltfBuffer {
  byteLength: number;
  uri?: string;
}

interface GltfPrimitive {
  attributes?: Record<string, number>;
  indices?: number;
  mode?: number;
  extensions?: Record<string, unknown>;
}

interface GltfNode {
  mesh?: number;
  children?: number[];
  matrix?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
}

interface GltfDoc {
  asset?: { version?: string; generator?: string };
  scene?: number;
  scenes?: Array<{ nodes?: number[] }>;
  nodes?: GltfNode[];
  meshes?: Array<{ primitives?: GltfPrimitive[] }>;
  accessors?: GltfAccessor[];
  bufferViews?: GltfBufferView[];
  buffers?: GltfBuffer[];
  images?: Array<{ uri?: string; bufferView?: number }>;
  extensionsRequired?: string[];
  [key: string]: unknown;
}

// ---- base64 helpers (chunked; large model buffers overflow call stacks) --

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeDataUri(uri: string): Uint8Array {
  const comma = uri.indexOf(",");
  if (comma < 0) throw new Error("Malformed data: URI in glTF buffer");
  const meta = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  if (/;base64$/i.test(meta)) return base64ToBytes(payload);
  // Percent-encoded data URIs are legal but vanishingly rare for buffers.
  return new TextEncoder().encode(decodeURIComponent(payload));
}

// ---- 4x4 column-major matrix math (matches glTF's node.matrix layout) ----

const MAT4_IDENTITY: readonly number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function mat4Multiply(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array<number>(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

/** Compose T * R * S from glTF node TRS fields (same math as three's Matrix4.compose). */
function mat4FromTrs(t?: number[], r?: number[], s?: number[]): number[] {
  const [tx, ty, tz] = t ?? [0, 0, 0];
  const [qx, qy, qz, qw] = r ?? [0, 0, 0, 1];
  const [sx, sy, sz] = s ?? [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function nodeLocalMatrix(node: GltfNode): readonly number[] {
  if (node.matrix && node.matrix.length === 16) return node.matrix;
  if (node.translation || node.rotation || node.scale) {
    return mat4FromTrs(node.translation, node.rotation, node.scale);
  }
  return MAT4_IDENTITY;
}

// ---- accessor reading (stride/offset/normalized aware) --------------------

const COMPONENT_BYTES: Record<number, number> = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
};

const TYPE_COMPONENTS: Record<string, number> = {
  SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16,
};

type BufferResolver = (index: number) => Uint8Array;

/** Read one accessor into a flat number array (count * components values). */
function readAccessor(gltf: GltfDoc, getBuffer: BufferResolver, index: number): number[] {
  const a = (gltf.accessors ?? [])[index];
  if (!a) throw new Error(`glTF references missing accessor ${index}`);
  if (a.sparse) {
    throw new Error("glTF sparse accessors are not supported yet; re-export without sparse encoding");
  }
  const components = TYPE_COMPONENTS[a.type];
  const compBytes = COMPONENT_BYTES[a.componentType];
  if (!components || !compBytes) {
    throw new Error(`glTF accessor has unsupported type ${a.type}/${a.componentType}`);
  }
  const out = new Array<number>(a.count * components);
  if (a.bufferView === undefined) {
    out.fill(0); // spec: accessor without bufferView reads as zeros
    return out;
  }
  const bv = (gltf.bufferViews ?? [])[a.bufferView];
  if (!bv) throw new Error(`glTF references missing bufferView ${a.bufferView}`);
  const bytes = getBuffer(bv.buffer);
  const elementBytes = components * compBytes;
  const stride = bv.byteStride ?? elementBytes;
  const start = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const needed = a.count === 0 ? 0 : (a.count - 1) * stride + elementBytes;
  if (start + needed > (bv.byteOffset ?? 0) + bv.byteLength || start + needed > bytes.byteLength) {
    throw new Error("glTF accessor reads past the end of its buffer (corrupt file)");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < a.count; i++) {
    for (let c = 0; c < components; c++) {
      const off = start + i * stride + c * compBytes;
      let v: number;
      switch (a.componentType) {
        case 5120: v = view.getInt8(off); if (a.normalized) v = Math.max(v / 127, -1); break;
        case 5121: v = view.getUint8(off); if (a.normalized) v = v / 255; break;
        case 5122: v = view.getInt16(off, true); if (a.normalized) v = Math.max(v / 32767, -1); break;
        case 5123: v = view.getUint16(off, true); if (a.normalized) v = v / 65535; break;
        case 5125: v = view.getUint32(off, true); break;
        default: v = view.getFloat32(off, true); break; // 5126 FLOAT
      }
      out[i * components + c] = v;
    }
  }
  return out;
}

// ---- geometry extraction ---------------------------------------------------

function transformPoint(m: readonly number[], x: number, y: number, z: number): [number, number, number] {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

/**
 * Merge every triangle primitive reachable from the glTF scene graph into one
 * mesh, baking node transforms into the vertices. Files whose meshes are not
 * referenced by any scene fall back to walking all meshes untransformed.
 */
function extractMeshFromGltfDoc(gltf: GltfDoc, getBuffer: BufferResolver): Mesh {
  if (gltf.extensionsRequired?.includes(DRACO_EXTENSION)) {
    throw new Error(
      "This glTF uses Draco mesh compression, which is not supported yet. Re-export the model without Draco compression (in Blender: uncheck Compression in the glTF export options).",
    );
  }

  const vertices: number[] = [];
  const triangles: number[] = [];
  const skippedModes = new Set<number>();

  const appendPrimitive = (prim: GltfPrimitive, world: readonly number[]) => {
    if (prim.extensions && DRACO_EXTENSION in prim.extensions) {
      throw new Error(
        "This glTF uses Draco mesh compression, which is not supported yet. Re-export the model without Draco compression (in Blender: uncheck Compression in the glTF export options).",
      );
    }
    const mode = prim.mode ?? PRIMITIVE_MODE_TRIANGLES;
    if (mode !== PRIMITIVE_MODE_TRIANGLES) {
      skippedModes.add(mode);
      return;
    }
    const posIndex = prim.attributes?.POSITION;
    if (posIndex === undefined) return;
    const posAccessor = (gltf.accessors ?? [])[posIndex];
    if (!posAccessor || posAccessor.type !== "VEC3") return;
    const pos = readAccessor(gltf, getBuffer, posIndex);
    const base = vertices.length / 3;
    const vertexCount = pos.length / 3;
    for (let i = 0; i < vertexCount; i++) {
      const [x, y, z] = transformPoint(world, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      vertices.push(x, y, z);
    }
    if (prim.indices === undefined) {
      for (let i = 0; i < vertexCount; i++) triangles.push(base + i);
    } else {
      const idx = readAccessor(gltf, getBuffer, prim.indices);
      for (const value of idx) {
        if (!Number.isFinite(value) || value < 0 || value >= vertexCount) {
          throw new Error("glTF index accessor references a vertex outside the primitive");
        }
        triangles.push(base + value);
      }
    }
  };

  const visitMesh = (meshIndex: number, world: readonly number[]) => {
    const mesh = (gltf.meshes ?? [])[meshIndex];
    for (const prim of mesh?.primitives ?? []) appendPrimitive(prim, world);
  };

  const nodes = gltf.nodes ?? [];
  const visited = new Set<number>();
  const visitNode = (nodeIndex: number, parent: readonly number[], depth: number) => {
    if (depth > 256 || visited.has(nodeIndex)) return; // malformed-cycle guard
    const node = nodes[nodeIndex];
    if (!node) return;
    visited.add(nodeIndex);
    const world = mat4Multiply(parent, nodeLocalMatrix(node));
    if (typeof node.mesh === "number") visitMesh(node.mesh, world);
    for (const child of node.children ?? []) visitNode(child, world, depth + 1);
    visited.delete(nodeIndex); // nodes may legally be reused across branches
  };

  const scenes = gltf.scenes ?? [];
  const sceneIdx = gltf.scene ?? 0;
  for (const ni of scenes[sceneIdx]?.nodes ?? []) visitNode(ni, MAT4_IDENTITY, 0);

  // Fallback: meshes not referenced by any scene (some exporters omit scenes).
  if (triangles.length === 0 && skippedModes.size === 0) {
    for (let i = 0; i < (gltf.meshes ?? []).length; i++) visitMesh(i, MAT4_IDENTITY);
  }

  if (triangles.length === 0) {
    if (skippedModes.size > 0) {
      throw new Error(
        `Only triangle meshes (mode 4) are supported; this file uses primitive mode ${[...skippedModes].join(", ")}`,
      );
    }
    throw new Error("glTF has no triangle mesh geometry");
  }
  return { vertices: Float32Array.from(vertices), triangles: Uint32Array.from(triangles) };
}

/** Resolve glTF buffers: data URIs decode; buffer 0 may map to the GLB BIN chunk. */
function makeBufferResolver(gltf: GltfDoc, binChunk: Uint8Array | null): BufferResolver {
  const cache = new Map<number, Uint8Array>();
  return (index: number): Uint8Array => {
    const hit = cache.get(index);
    if (hit) return hit;
    const buffer = (gltf.buffers ?? [])[index];
    if (!buffer) throw new Error(`glTF references missing buffer ${index}`);
    let bytes: Uint8Array;
    if (buffer.uri === undefined) {
      if (index === 0 && binChunk) {
        bytes = binChunk.subarray(0, buffer.byteLength);
      } else {
        throw new Error("glTF buffer has no data (missing BIN chunk or uri)");
      }
    } else if (buffer.uri.startsWith("data:")) {
      bytes = decodeDataUri(buffer.uri);
    } else {
      throw new Error(
        `This glTF references an external buffer file ("${buffer.uri}") that was not uploaded. Use a self-contained glTF (embedded buffers) or a .glb instead.`,
      );
    }
    cache.set(index, bytes);
    return bytes;
  };
}

// ---- GLB container read/write ---------------------------------------------

function readGlbContainer(buf: ArrayBuffer): { gltf: GltfDoc; bin: Uint8Array | null } {
  if (buf.byteLength < 20) throw new Error("GLB too short to be a valid container");
  const view = new DataView(buf);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    const first = new Uint8Array(buf, 0, 1)[0];
    if (first === 0x7b) {
      throw new Error(
        "This looks like an embedded .gltf JSON, not a binary .glb. Save your mesh as binary glTF first.",
      );
    }
    throw new Error('Not a valid GLB file (magic bytes don\'t match "glTF")');
  }
  if (view.getUint32(4, true) !== 2) {
    throw new Error("Only glTF 2.0 GLB files are supported");
  }
  const jsonLen = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_TYPE_JSON) {
    throw new Error("First chunk must be JSON in a GLB file");
  }
  if (20 + jsonLen > buf.byteLength) throw new Error("GLB JSON chunk is truncated");
  const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen))) as GltfDoc;

  let bin: Uint8Array | null = null;
  const binHeaderOffset = 20 + jsonLen;
  if (binHeaderOffset + 8 <= buf.byteLength) {
    const binLen = view.getUint32(binHeaderOffset, true);
    const binType = view.getUint32(binHeaderOffset + 4, true);
    if (binType === CHUNK_TYPE_BIN) {
      if (binHeaderOffset + 8 + binLen > buf.byteLength) {
        throw new Error("GLB BIN chunk is truncated");
      }
      bin = new Uint8Array(buf, binHeaderOffset + 8, binLen);
    }
  }
  return { gltf, bin };
}

function packGlbContainer(gltfJson: string, bin: Uint8Array | null): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(gltfJson);
  const jsonPadded = padTo4(jsonBytes.length);
  const binLen = bin ? bin.length : 0;
  const binPadded = padTo4(binLen);
  const totalLen = 12 + 8 + jsonPadded + (bin ? 8 + binPadded : 0);

  const buf = new ArrayBuffer(totalLen);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLen, true);

  view.setUint32(12, jsonPadded, true);
  view.setUint32(16, CHUNK_TYPE_JSON, true);
  bytes.set(jsonBytes, 20);
  // JSON chunk padding must be spaces (0x20); some validators reject others.
  for (let i = jsonBytes.length; i < jsonPadded; i++) bytes[20 + i] = 0x20;

  if (bin) {
    const binHeader = 20 + jsonPadded;
    view.setUint32(binHeader, binPadded, true);
    view.setUint32(binHeader + 4, CHUNK_TYPE_BIN, true);
    bytes.set(bin, binHeader + 8); // trailing zero padding is already there
  }
  return buf;
}

// ---- mesh -> glTF document -------------------------------------------------

/**
 * Build the glTF document + BIN payload for a triangle mesh: positions as
 * FLOAT VEC3, indices as UNSIGNED_INT (32-bit indices are universally
 * supported and CAD/scan exports routinely exceed 65535 vertices).
 */
function buildGltfDocAndBin(mesh: Mesh): { gltf: GltfDoc; bin: Uint8Array } {
  const { vertices, triangles } = mesh;
  const vertexCount = vertices.length / 3;
  const indexCount = triangles.length;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], y = vertices[i + 1], z = vertices[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  if (vertexCount === 0) {
    minX = minY = minZ = 0;
    maxX = maxY = maxZ = 0;
  }

  const posByteLen = vertexCount * 3 * 4;
  const posPadded = padTo4(posByteLen);
  const idxByteLen = indexCount * 4;
  const binByteLen = posPadded + padTo4(idxByteLen);

  const bin = new Uint8Array(binByteLen);
  new Float32Array(bin.buffer, 0, vertexCount * 3).set(vertices);
  new Uint32Array(bin.buffer, posPadded, indexCount).set(triangles);

  const gltf: GltfDoc = {
    asset: { version: "2.0", generator: "twineconvert" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: 0 }, indices: 1, mode: PRIMITIVE_MODE_TRIANGLES },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: COMPONENT_TYPE_FLOAT,
        count: vertexCount,
        type: "VEC3",
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      } as GltfAccessor & { min: number[]; max: number[] },
      {
        bufferView: 1,
        componentType: COMPONENT_TYPE_UNSIGNED_INT,
        count: indexCount,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posByteLen, target: 34962 } as GltfBufferView & { target: number },
      { buffer: 0, byteOffset: posPadded, byteLength: idxByteLen, target: 34963 } as GltfBufferView & { target: number },
    ],
    buffers: [{ byteLength: binByteLen }],
  };
  return { gltf, bin };
}

// ---- public API -------------------------------------------------------------

/** Build a single self-contained GLB binary from a Mesh. */
export function buildGlb(mesh: Mesh): ArrayBuffer {
  const { gltf, bin } = buildGltfDocAndBin(mesh);
  return packGlbContainer(JSON.stringify(gltf), bin);
}

/** Build a self-contained .gltf JSON (buffer embedded as a base64 data URI). */
export function buildGltfJson(mesh: Mesh): string {
  const { gltf, bin } = buildGltfDocAndBin(mesh);
  gltf.buffers = [
    {
      byteLength: bin.length,
      uri: `data:application/octet-stream;base64,${bytesToBase64(bin)}`,
    },
  ];
  return JSON.stringify(gltf, null, 2);
}

/** Parse a GLB into a merged triangle Mesh (transforms baked, all primitives). */
export function parseGlb(buf: ArrayBuffer): Mesh {
  const { gltf, bin } = readGlbContainer(buf);
  return extractMeshFromGltfDoc(gltf, makeBufferResolver(gltf, bin));
}

/** Parse a .gltf JSON document (embedded data-URI buffers) into a Mesh. */
export function parseGltfJson(text: string): Mesh {
  let gltf: GltfDoc;
  try {
    gltf = JSON.parse(text) as GltfDoc;
  } catch {
    throw new Error("Not a valid .gltf file (the JSON does not parse)");
  }
  const version = gltf.asset?.version;
  if (version && !version.startsWith("2")) {
    throw new Error(
      `glTF ${version} is not supported; re-export the model as glTF 2.0`,
    );
  }
  return extractMeshFromGltfDoc(gltf, makeBufferResolver(gltf, null));
}

/**
 * Lossless .gltf -> .glb container repack. Materials, animations, skins,
 * extensions, and images are preserved verbatim; embedded data-URI buffers are
 * merged into the single GLB BIN chunk with bufferViews rebased onto it.
 */
export function gltfJsonToGlb(text: string): ArrayBuffer {
  let gltf: GltfDoc;
  try {
    gltf = JSON.parse(text) as GltfDoc;
  } catch {
    throw new Error("Not a valid .gltf file (the JSON does not parse)");
  }
  const version = gltf.asset?.version;
  if (version && !version.startsWith("2")) {
    throw new Error(`glTF ${version} is not supported; re-export the model as glTF 2.0`);
  }
  for (const image of gltf.images ?? []) {
    if (image.uri && !image.uri.startsWith("data:")) {
      throw new Error(
        `This glTF references an external image ("${image.uri}") that was not uploaded. Embed textures in the glTF or convert with a desktop tool that has access to the texture files.`,
      );
    }
  }

  const buffers = gltf.buffers ?? [];
  const decoded: Uint8Array[] = [];
  const bases: number[] = [];
  let total = 0;
  for (let i = 0; i < buffers.length; i++) {
    const uri = buffers[i].uri;
    if (uri === undefined) {
      throw new Error("This .gltf declares a buffer without data; it may already be part of a GLB");
    }
    if (!uri.startsWith("data:")) {
      throw new Error(
        `This glTF references an external buffer file ("${uri}") that was not uploaded. Use a self-contained glTF (embedded buffers) instead.`,
      );
    }
    const bytes = decodeDataUri(uri);
    total = padTo4(total);
    bases[i] = total;
    decoded[i] = bytes;
    total += bytes.length;
  }

  const bin = new Uint8Array(total);
  for (let i = 0; i < decoded.length; i++) bin.set(decoded[i], bases[i]);

  const out: GltfDoc = {
    ...gltf,
    bufferViews: (gltf.bufferViews ?? []).map((bv) => ({
      ...bv,
      buffer: 0,
      byteOffset: (bv.byteOffset ?? 0) + bases[bv.buffer],
    })),
    buffers: buffers.length > 0 ? [{ byteLength: total }] : [],
  };
  return packGlbContainer(JSON.stringify(out), buffers.length > 0 ? bin : null);
}

/**
 * Lossless .glb -> .gltf container repack: the BIN chunk becomes an embedded
 * base64 data-URI buffer; everything else is preserved verbatim.
 */
export function glbToGltfJson(buf: ArrayBuffer): string {
  const { gltf, bin } = readGlbContainer(buf);
  const buffers = gltf.buffers ?? [];
  const out: GltfDoc = {
    ...gltf,
    buffers: buffers.map((b, i) => {
      if (b.uri === undefined && i === 0) {
        if (!bin) throw new Error("GLB declares a BIN-backed buffer but has no BIN chunk");
        return {
          ...b,
          uri: `data:application/octet-stream;base64,${bytesToBase64(bin.subarray(0, b.byteLength))}`,
        };
      }
      return b;
    }),
  };
  return JSON.stringify(out, null, 2);
}
