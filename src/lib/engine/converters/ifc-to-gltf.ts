import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { openIfcModel } from "../util/ifc-load";

/**
 * IFC → glTF (binary GLB).
 *
 * Approach:
 *   1. web-ifc's StreamAllMeshes walks every IFC element with geometry,
 *      handing back FlatMesh records that point at PlacedGeometry instances.
 *   2. Each PlacedGeometry has a transform matrix + a geometry id; we
 *      fetch the actual vertex/index buffers via GetGeometry.
 *   3. We bake all primitives into one big mesh per element (per IFC
 *      object), each as its own glTF "node" so consumers can isolate them.
 *
 * v1 limitations:
 *   - All meshes share a single neutral material (no per-element coloring).
 *   - We emit a `.glb` (binary glTF) which is what every modern viewer
 *     prefers; ASCII .gltf with separate buffer files is a 2x more
 *     complex multi-file output that doesn't fit our converter shape.
 */
const ifcToGltf: Converter = {
  id: "ifc-to-gltf",
  label: "IFC → glTF (.glb)",
  fromMime: ["application/x-step", "application/ifc", "text/plain"],
  accept: [".ifc"],
  toMime: "model/gltf-binary",
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let glb: ArrayBuffer;
    try {
      const { api, modelID } = await openIfcModel(input);
      opts?.onProgress?.(0.2);

      type CollectedMesh = {
        positions: Float32Array;
        indices: Uint32Array;
        transform: number[];
      };
      const meshes: CollectedMesh[] = [];

      api.StreamAllMeshes(modelID, (flatMesh) => {
        const placedGeoms = flatMesh.geometries;
        for (let i = 0; i < placedGeoms.size(); i++) {
          const placed = placedGeoms.get(i);
          const geom = api.GetGeometry(modelID, placed.geometryExpressID);
          // web-ifc returns interleaved [px, py, pz, nx, ny, nz] floats.
          const vertData = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
          const indexData = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
          const vertexCount = vertData.length / 6;
          const positions = new Float32Array(vertexCount * 3);
          for (let v = 0; v < vertexCount; v++) {
            positions[v * 3] = vertData[v * 6];
            positions[v * 3 + 1] = vertData[v * 6 + 1];
            positions[v * 3 + 2] = vertData[v * 6 + 2];
          }
          meshes.push({
            positions,
            indices: new Uint32Array(indexData),
            transform: Array.from(placed.flatTransformation),
          });
        }
      });

      opts?.onProgress?.(0.7);
      api.CloseModel(modelID);

      glb = buildGlb(meshes);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert IFC to glTF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([glb], { type: "model/gltf-binary" }),
      filename: swapExtension(input.name, "glb"),
    };
  },
};

interface GlbMesh {
  positions: Float32Array;
  indices: Uint32Array;
  transform: number[];
}

function buildGlb(meshes: GlbMesh[]): ArrayBuffer {
  let bufferLength = 0;
  for (const m of meshes) {
    bufferLength += m.positions.byteLength;
    bufferLength += m.indices.byteLength;
    if (bufferLength % 4 !== 0) bufferLength += 4 - (bufferLength % 4);
  }

  const binBuffer = new ArrayBuffer(bufferLength);
  const binView = new Uint8Array(binBuffer);
  let offset = 0;
  const accessors: Array<Record<string, unknown>> = [];
  const bufferViews: Array<Record<string, number>> = [];
  const meshDefs: Array<{ primitives: Array<{ attributes: { POSITION: number }; indices: number; mode: number }> }> = [];
  const nodes: Array<Record<string, unknown>> = [];

  for (const m of meshes) {
    if (m.positions.length === 0 || m.indices.length === 0) continue;

    const posBytes = new Uint8Array(m.positions.buffer, m.positions.byteOffset, m.positions.byteLength);
    binView.set(posBytes, offset);
    const posViewIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: m.positions.byteLength, target: 34962 });
    offset += m.positions.byteLength;
    if (offset % 4 !== 0) offset += 4 - (offset % 4);

    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let v = 0; v < m.positions.length; v += 3) {
      const x = m.positions[v], y = m.positions[v + 1], z = m.positions[v + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }

    const posAccessorIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: m.positions.length / 3,
      type: "VEC3",
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    });

    const idxBytes = new Uint8Array(m.indices.buffer, m.indices.byteOffset, m.indices.byteLength);
    binView.set(idxBytes, offset);
    const idxViewIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: m.indices.byteLength, target: 34963 });
    offset += m.indices.byteLength;
    if (offset % 4 !== 0) offset += 4 - (offset % 4);

    const idxAccessorIdx = accessors.length;
    accessors.push({
      bufferView: idxViewIdx,
      byteOffset: 0,
      componentType: 5125, // UNSIGNED_INT
      count: m.indices.length,
      type: "SCALAR",
    });

    const meshIdx = meshDefs.length;
    meshDefs.push({
      primitives: [{
        attributes: { POSITION: posAccessorIdx },
        indices: idxAccessorIdx,
        mode: 4, // TRIANGLES
      }],
    });

    nodes.push({
      mesh: meshIdx,
      // glTF uses column-major; web-ifc's flatTransformation is row-major,
      // so transpose. (4x4 matrix.)
      matrix: transposeMatrix(m.transform),
    });
  }

  const gltf = {
    asset: { version: "2.0", generator: "client-conversion" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: meshDefs,
    accessors,
    bufferViews,
    buffers: [{ byteLength: bufferLength }],
  };

  return packGlb(JSON.stringify(gltf), binBuffer);
}

function transposeMatrix(m: number[]): number[] {
  return [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
  ];
}

function packGlb(jsonStr: string, binBuffer: ArrayBuffer): ArrayBuffer {
  const enc = new TextEncoder();
  let jsonBytes = enc.encode(jsonStr);
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  if (jsonPad > 0) {
    const padded = new Uint8Array(jsonBytes.length + jsonPad);
    padded.set(jsonBytes);
    for (let i = 0; i < jsonPad; i++) padded[jsonBytes.length + i] = 0x20;
    jsonBytes = padded;
  }
  const binBytes = new Uint8Array(binBuffer);
  const binPad = (4 - (binBytes.length % 4)) % 4;

  const totalLength = 12 + 8 + jsonBytes.length + 8 + binBytes.length + binPad;
  const out = new ArrayBuffer(totalLength);
  const view = new DataView(out);
  const u8 = new Uint8Array(out);

  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);

  view.setUint32(12, jsonBytes.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  u8.set(jsonBytes, 20);

  const binChunkOffset = 20 + jsonBytes.length;
  view.setUint32(binChunkOffset, binBytes.length + binPad, true);
  view.setUint32(binChunkOffset + 4, 0x004e4942, true);
  u8.set(binBytes, binChunkOffset + 8);

  return out;
}

export default ifcToGltf;
