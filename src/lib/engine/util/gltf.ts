/**
 * Minimal glTF 2.0 binary container (.glb) parser + writer for triangle
 * meshes. Bypasses heavyweight 3D libraries — the spec is simple enough
 * to implement in a few hundred lines, which is cheaper than shipping
 * @gltf-transform/core (~200KB) or three.js (~600KB) for a converter
 * that only ever does mesh ↔ mesh.
 *
 * Wire format reference:
 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#binary-gltf-layout
 *
 * GLB structure:
 *   [12-byte header]
 *     uint32 magic    = 0x46546C67 ("glTF")
 *     uint32 version  = 2
 *     uint32 length   = total file length
 *   [JSON chunk]
 *     uint32 length   = JSON byte length (padded to multiple of 4)
 *     uint32 type     = 0x4E4F534A ("JSON")
 *     N bytes JSON    (ASCII-encoded glTF document)
 *   [BIN chunk] (optional)
 *     uint32 length   = BIN byte length (padded to multiple of 4)
 *     uint32 type     = 0x004E4942 ("BIN\0")
 *     M bytes binary  (vertex + index data referenced by bufferViews)
 *
 * For a triangle mesh we emit:
 *   - 1 buffer (the BIN chunk)
 *   - 2 bufferViews (positions, indices)
 *   - 2 accessors (POSITION VEC3 FLOAT, indices SCALAR UNSIGNED_INT)
 *   - 1 mesh with 1 primitive (mode 4 = TRIANGLES)
 *   - 1 node referencing that mesh
 *   - 1 scene referencing that node
 */

import type { Mesh } from "./mesh";

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_TYPE_JSON = 0x4e4f534a; // "JSON"
const CHUNK_TYPE_BIN = 0x004e4942; // "BIN\0"

const COMPONENT_TYPE_UNSIGNED_INT = 5125;
const COMPONENT_TYPE_FLOAT = 5126;
const PRIMITIVE_MODE_TRIANGLES = 4;

/** Pad a length up to the next multiple of 4 bytes (GLB chunk requirement). */
function padTo4(n: number): number {
  return (n + 3) & ~3;
}

/**
 * Build a single GLB binary blob from a Mesh.
 *
 * Positions are emitted as little-endian Float32, indices as
 * little-endian Uint32 (every glTF 2.0 viewer supports 32-bit indices;
 * we don't downgrade to Uint16 since meshes from CAD/3D-print exports
 * routinely exceed 65535 vertices).
 */
export function buildGlb(mesh: Mesh): ArrayBuffer {
  const { vertices, triangles } = mesh;
  const vertexCount = vertices.length / 3;
  const indexCount = triangles.length;

  // Compute axis-aligned bounding box (glTF requires POSITION accessor
  // to include min/max for frustum-cull-friendly viewers).
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

  // Lay out BIN: positions first (12 bytes per vertex), then indices
  // (4 bytes each), each section padded to a 4-byte boundary.
  const posByteLen = vertexCount * 3 * 4;
  const posByteLenPadded = padTo4(posByteLen);
  const idxByteLen = indexCount * 4;
  const idxByteLenPadded = padTo4(idxByteLen);
  const binByteLen = posByteLenPadded + idxByteLenPadded;

  const gltf = {
    asset: { version: "2.0", generator: "twineconvert" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            mode: PRIMITIVE_MODE_TRIANGLES,
          },
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
      },
      {
        bufferView: 1,
        componentType: COMPONENT_TYPE_UNSIGNED_INT,
        count: indexCount,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posByteLen, target: 34962 /* ARRAY_BUFFER */ },
      {
        buffer: 0,
        byteOffset: posByteLenPadded,
        byteLength: idxByteLen,
        target: 34963 /* ELEMENT_ARRAY_BUFFER */,
      },
    ],
    buffers: [{ byteLength: binByteLen }],
  };

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(gltf));
  // JSON chunk must be padded with SPACE characters (0x20) to a 4-byte
  // boundary; BIN chunk gets zero-padded. Some validators reject other
  // pad bytes in the JSON region.
  const jsonByteLenPadded = padTo4(jsonBytes.length);
  const jsonPadCount = jsonByteLenPadded - jsonBytes.length;

  // Total file = 12-byte header + 8-byte JSON chunk header + JSON body
  // + 8-byte BIN chunk header + BIN body.
  const totalLen = 12 + 8 + jsonByteLenPadded + 8 + binByteLen;
  const buf = new ArrayBuffer(totalLen);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // Header
  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLen, true);

  // JSON chunk
  view.setUint32(12, jsonByteLenPadded, true);
  view.setUint32(16, CHUNK_TYPE_JSON, true);
  bytes.set(jsonBytes, 20);
  for (let i = 0; i < jsonPadCount; i++) bytes[20 + jsonBytes.length + i] = 0x20;

  // BIN chunk
  const binChunkHeaderOffset = 20 + jsonByteLenPadded;
  view.setUint32(binChunkHeaderOffset, binByteLen, true);
  view.setUint32(binChunkHeaderOffset + 4, CHUNK_TYPE_BIN, true);
  const binBodyOffset = binChunkHeaderOffset + 8;

  // Positions
  const posView = new Float32Array(buf, binBodyOffset, vertexCount * 3);
  posView.set(vertices);

  // Indices (padded section follows positions)
  const idxView = new Uint32Array(buf, binBodyOffset + posByteLenPadded, indexCount);
  idxView.set(triangles);

  return buf;
}

/**
 * Parse a GLB into a Mesh. Targets the common case: a single mesh with
 * a single primitive containing POSITION + indices. Multi-mesh files,
 * skinning, animations, and morph targets are out of scope — we extract
 * the first primitive of the first mesh, which is what 3D-print and
 * CAD-export GLB files almost always carry.
 */
export function parseGlb(buf: ArrayBuffer): Mesh {
  if (buf.byteLength < 28) throw new Error("GLB too short to be a valid container");
  const view = new DataView(buf);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    // Allow .gltf (raw JSON, no BIN) fallback by checking for "{"
    const first = new Uint8Array(buf, 0, 1)[0];
    if (first === 0x7b) {
      throw new Error(
        "This looks like an embedded .gltf JSON, not a binary .glb. Save your mesh as binary glTF first.",
      );
    }
    throw new Error("Not a valid GLB file (magic bytes don't match \"glTF\")");
  }
  if (view.getUint32(4, true) !== 2) {
    throw new Error("Only glTF 2.0 GLB files are supported");
  }

  // Read JSON chunk
  const jsonLen = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_TYPE_JSON) {
    throw new Error("First chunk must be JSON in a GLB file");
  }
  const jsonBytes = new Uint8Array(buf, 20, jsonLen);
  const decoder = new TextDecoder();
  const gltf = JSON.parse(decoder.decode(jsonBytes)) as Record<string, unknown>;

  // Read BIN chunk (if present)
  const binChunkHeaderOffset = 20 + jsonLen;
  let binBuf: ArrayBuffer | null = null;
  if (binChunkHeaderOffset + 8 <= buf.byteLength) {
    const binLen = view.getUint32(binChunkHeaderOffset, true);
    const binType = view.getUint32(binChunkHeaderOffset + 4, true);
    if (binType === CHUNK_TYPE_BIN) {
      binBuf = buf.slice(binChunkHeaderOffset + 8, binChunkHeaderOffset + 8 + binLen);
    }
  }
  if (!binBuf) {
    throw new Error("GLB has no BIN chunk; external .bin files are not supported");
  }

  // Walk the glTF tree: scene[0].nodes[0].mesh -> primitive[0].
  type GltfPrimitive = {
    attributes?: { POSITION?: number };
    indices?: number;
    mode?: number;
  };
  type GltfMesh = { primitives: GltfPrimitive[] };
  type GltfNode = { mesh?: number; children?: number[] };
  type GltfAccessor = {
    bufferView: number;
    componentType: number;
    count: number;
    type: string;
  };
  type GltfBufferView = { buffer: number; byteOffset?: number; byteLength: number };

  const meshes = (gltf.meshes ?? []) as GltfMesh[];
  const nodes = (gltf.nodes ?? []) as GltfNode[];
  const accessors = (gltf.accessors ?? []) as GltfAccessor[];
  const bufferViews = (gltf.bufferViews ?? []) as GltfBufferView[];

  // Find the first mesh actually used by the scene graph.
  let meshIdx = -1;
  const visit = (nodeIdx: number) => {
    if (meshIdx >= 0) return;
    const n = nodes[nodeIdx];
    if (!n) return;
    if (typeof n.mesh === "number") {
      meshIdx = n.mesh;
      return;
    }
    for (const child of n.children ?? []) visit(child);
  };
  const scenes = (gltf.scenes ?? []) as Array<{ nodes?: number[] }>;
  const sceneIdx = (gltf.scene ?? 0) as number;
  for (const ni of scenes[sceneIdx]?.nodes ?? []) visit(ni);
  // Fallback: just use mesh 0 if the scene graph didn't surface one.
  if (meshIdx < 0 && meshes.length > 0) meshIdx = 0;
  if (meshIdx < 0) throw new Error("GLB has no meshes");

  const primitive = meshes[meshIdx]?.primitives?.[0];
  if (!primitive) throw new Error("GLB mesh has no primitives");
  if (primitive.mode !== undefined && primitive.mode !== PRIMITIVE_MODE_TRIANGLES) {
    throw new Error(
      `Only triangle meshes (mode 4) are supported; this file uses primitive mode ${primitive.mode}`,
    );
  }
  const posAccessorIdx = primitive.attributes?.POSITION;
  if (posAccessorIdx === undefined) {
    throw new Error("Primitive is missing POSITION attribute");
  }
  const indexAccessorIdx = primitive.indices;

  const readAccessor = (idx: number) => {
    const a = accessors[idx];
    const bv = bufferViews[a.bufferView];
    const offset = bv.byteOffset ?? 0;
    return { accessor: a, view: new Uint8Array(binBuf!, offset, bv.byteLength) };
  };

  // POSITION: FLOAT VEC3
  const pos = readAccessor(posAccessorIdx);
  if (pos.accessor.componentType !== COMPONENT_TYPE_FLOAT || pos.accessor.type !== "VEC3") {
    throw new Error("POSITION accessor must be FLOAT VEC3");
  }
  const vertices = new Float32Array(
    pos.view.buffer,
    pos.view.byteOffset,
    pos.accessor.count * 3,
  );

  // Indices: UNSIGNED_INT, UNSIGNED_SHORT, or UNSIGNED_BYTE. If absent,
  // the primitive is non-indexed (every 3 positions form a triangle).
  let triangles: Uint32Array;
  if (indexAccessorIdx === undefined) {
    triangles = new Uint32Array(pos.accessor.count);
    for (let i = 0; i < triangles.length; i++) triangles[i] = i;
  } else {
    const idx = readAccessor(indexAccessorIdx);
    const count = idx.accessor.count;
    if (idx.accessor.componentType === COMPONENT_TYPE_UNSIGNED_INT) {
      triangles = new Uint32Array(idx.view.buffer, idx.view.byteOffset, count).slice();
    } else if (idx.accessor.componentType === 5123 /* UNSIGNED_SHORT */) {
      const src = new Uint16Array(idx.view.buffer, idx.view.byteOffset, count);
      triangles = new Uint32Array(count);
      for (let i = 0; i < count; i++) triangles[i] = src[i];
    } else if (idx.accessor.componentType === 5121 /* UNSIGNED_BYTE */) {
      const src = new Uint8Array(idx.view.buffer, idx.view.byteOffset, count);
      triangles = new Uint32Array(count);
      for (let i = 0; i < count; i++) triangles[i] = src[i];
    } else {
      throw new Error(`Unsupported index componentType ${idx.accessor.componentType}`);
    }
  }

  return { vertices: vertices.slice(), triangles };
}
