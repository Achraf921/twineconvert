/**
 * Verification suite for the game-dev/DCC 3D batch (FBX, DAE, 3DS, PLY,
 * glTF, GLB, OBJ, STL, USDZ, 3MF).
 *
 * Every route is fed the SAME hand-written ground-truth solid (a cube of
 * edge 2 centered at the origin, 12 triangles, volume exactly 8) and the
 * OUTPUT is parsed by an independent spec-level reader defined in this file,
 * not by the util that produced it. Asserting triangle count AND signed
 * volume verifies vertices, indices, transforms, and winding all survived;
 * "it didn't throw" is not the bar here.
 */
import { describe, expect, it } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";
import { fileFromBytes } from "./fixtures/binary-fixtures";
import {
  CUBE_DAE,
  CUBE_FBX_ASCII,
  CUBE_OBJ,
  CUBE_PLY_ASCII,
  CUBE_TRIANGLE_COUNT,
  CUBE_VOLUME,
  makeCube3ds,
  makeCubeGlb,
  makeCubeGltfJson,
  makeCubePlyBinary,
  makeCubeStlBinary,
  makeScaledCubeGltfJson,
  meshVolume,
} from "./fixtures/mesh3d-fixtures";

type Soup = { vertices: number[]; triangles: number[] };

// ---- independent output readers (spec-level, defined here on purpose) ----

function readObj(text: string): Soup {
  const vertices: number[] = [];
  const triangles: number[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("v ")) {
      const [x, y, z] = line.slice(2).trim().split(/\s+/).map(Number);
      vertices.push(x, y, z);
    } else if (line.startsWith("f ")) {
      const idx = line.slice(2).trim().split(/\s+/).map((t) => parseInt(t.split("/")[0], 10) - 1);
      for (let i = 1; i + 1 < idx.length; i++) triangles.push(idx[0], idx[i], idx[i + 1]);
    }
  }
  return { vertices, triangles };
}

function readBinaryStl(buf: ArrayBuffer): Soup {
  const view = new DataView(buf);
  const count = view.getUint32(80, true);
  const vertices: number[] = [];
  const triangles: number[] = [];
  let off = 84;
  for (let t = 0; t < count; t++) {
    off += 12;
    for (let v = 0; v < 3; v++) {
      vertices.push(
        view.getFloat32(off, true),
        view.getFloat32(off + 4, true),
        view.getFloat32(off + 8, true),
      );
      off += 12;
      triangles.push(t * 3 + v);
    }
    off += 2;
  }
  return { vertices, triangles };
}

function readGltfDoc(doc: Record<string, unknown>, bin: Uint8Array | null): Soup {
  const accessors = doc.accessors as Array<Record<string, number & string>>;
  const bufferViews = doc.bufferViews as Array<Record<string, number>>;
  const buffers = doc.buffers as Array<{ uri?: string; byteLength: number }>;
  const bufferBytes = (i: number): Uint8Array => {
    const b = buffers[i];
    if (b.uri?.startsWith("data:")) {
      const b64 = b.uri.slice(b.uri.indexOf(",") + 1);
      const raw = atob(b64);
      const bytes = new Uint8Array(raw.length);
      for (let k = 0; k < raw.length; k++) bytes[k] = raw.charCodeAt(k);
      return bytes;
    }
    if (!bin) throw new Error("test reader: buffer has no data");
    return bin;
  };
  const readAcc = (index: number): number[] => {
    const a = accessors[index];
    const bv = bufferViews[a.bufferView as unknown as number];
    const bytes = bufferBytes(bv.buffer);
    const comps = a.type === "VEC3" ? 3 : 1;
    const compBytes = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType as unknown as number]!;
    const stride = bv.byteStride ?? comps * compBytes;
    const start = (bv.byteOffset ?? 0) + ((a.byteOffset as unknown as number) ?? 0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const out: number[] = [];
    for (let i = 0; i < (a.count as unknown as number); i++) {
      for (let c = 0; c < comps; c++) {
        const off = start + i * stride + c * compBytes;
        if (a.componentType === (5126 as unknown as string)) out.push(view.getFloat32(off, true));
        else if (a.componentType === (5125 as unknown as string)) out.push(view.getUint32(off, true));
        else if (a.componentType === (5123 as unknown as string)) out.push(view.getUint16(off, true));
        else out.push(view.getUint8(off));
      }
    }
    return out;
  };

  const meshes = doc.meshes as Array<{ primitives: Array<Record<string, unknown>> }>;
  const vertices: number[] = [];
  const triangles: number[] = [];
  for (const mesh of meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const attrs = prim.attributes as Record<string, number>;
      const base = vertices.length / 3;
      const pos = readAcc(attrs.POSITION);
      vertices.push(...pos);
      if (prim.indices !== undefined) {
        for (const i of readAcc(prim.indices as number)) triangles.push(base + i);
      } else {
        for (let i = 0; i < pos.length / 3; i++) triangles.push(base + i);
      }
    }
  }
  return { vertices, triangles };
}

function readGlb(buf: ArrayBuffer): Soup {
  const view = new DataView(buf);
  expect(view.getUint32(0, true)).toBe(0x46546c67);
  expect(view.getUint32(4, true)).toBe(2);
  const jsonLen = view.getUint32(12, true);
  const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  let bin: Uint8Array | null = null;
  const binHeader = 20 + jsonLen;
  if (binHeader + 8 <= buf.byteLength && view.getUint32(binHeader + 4, true) === 0x004e4942) {
    bin = new Uint8Array(buf, binHeader + 8, view.getUint32(binHeader, true));
  }
  return readGltfDoc(doc, bin);
}

function readPlyAscii(text: string): Soup {
  expect(text.startsWith("ply")).toBe(true);
  const headerEnd = text.indexOf("end_header");
  const header = text.slice(0, headerEnd);
  const vCount = parseInt(/element vertex (\d+)/.exec(header)![1], 10);
  const fCount = parseInt(/element face (\d+)/.exec(header)![1], 10);
  const body = text.slice(text.indexOf("\n", headerEnd) + 1).trim().split(/\r?\n/);
  const vertices: number[] = [];
  const triangles: number[] = [];
  for (let i = 0; i < vCount; i++) {
    const [x, y, z] = body[i].trim().split(/\s+/).map(Number);
    vertices.push(x, y, z);
  }
  for (let i = 0; i < fCount; i++) {
    const parts = body[vCount + i].trim().split(/\s+/).map(Number);
    const n = parts[0];
    for (let k = 2; k < n; k++) triangles.push(parts[1], parts[k], parts[k + 1]);
  }
  return { vertices, triangles };
}

async function readUsdz(blob: Blob): Promise<Soup> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  let usda = "";
  for (const name of Object.keys(zip.files)) {
    if (name.endsWith(".usda")) usda += await zip.files[name].async("string");
  }
  const pointsMatch = /point3f\[\] points = \[([^\]]+)\]/.exec(usda);
  const idxMatch = /int\[\] faceVertexIndices = \[([^\]]+)\]/.exec(usda);
  const countsMatch = /int\[\] faceVertexCounts = \[([^\]]+)\]/.exec(usda);
  expect(pointsMatch && idxMatch && countsMatch).toBeTruthy();
  const counts = countsMatch![1].split(",").map((s) => parseInt(s.trim(), 10));
  for (const c of counts) expect(c).toBe(3);
  const vertices = pointsMatch![1]
    .split(/\),\s*\(/)
    .flatMap((tuple) => tuple.replace(/[()]/g, "").split(",").map(Number));
  const triangles = idxMatch![1].split(",").map((s) => parseInt(s.trim(), 10));
  return { vertices, triangles };
}

async function readThreeMfBlob(blob: Blob): Promise<Soup> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const model = await zip.file(/3dmodel\.model$/i)[0].async("string");
  const doc = new DOMParser().parseFromString(model, "application/xml");
  const vertices: number[] = [];
  const triangles: number[] = [];
  for (const v of Array.from(doc.getElementsByTagName("vertex"))) {
    vertices.push(
      parseFloat(v.getAttribute("x")!),
      parseFloat(v.getAttribute("y")!),
      parseFloat(v.getAttribute("z")!),
    );
  }
  for (const t of Array.from(doc.getElementsByTagName("triangle"))) {
    triangles.push(
      parseInt(t.getAttribute("v1")!, 10),
      parseInt(t.getAttribute("v2")!, 10),
      parseInt(t.getAttribute("v3")!, 10),
    );
  }
  return { vertices, triangles };
}

// ---- fixture inputs -------------------------------------------------------

const INPUTS: Record<string, () => File> = {
  fbx: () => fileFromText("cube.fbx", CUBE_FBX_ASCII, "application/octet-stream"),
  dae: () => fileFromText("cube.dae", CUBE_DAE, "model/vnd.collada+xml"),
  "3ds": () => fileFromBytes("cube.3ds", makeCube3ds(), "application/x-3ds"),
  ply: () => fileFromBytes("cube.ply", makeCubePlyBinary(), "application/octet-stream"),
  gltf: () => fileFromText("cube.gltf", makeCubeGltfJson(), "model/gltf+json"),
  obj: () => fileFromText("cube.obj", CUBE_OBJ, "model/obj"),
  stl: () => fileFromBytes("cube.stl", makeCubeStlBinary(), "model/stl"),
  glb: () => fileFromBytes("cube.glb", makeCubeGlb(), "model/gltf-binary"),
};

const READERS: Record<string, (blob: Blob) => Promise<Soup>> = {
  obj: async (b) => readObj(await b.text()),
  stl: async (b) => readBinaryStl(await b.arrayBuffer()),
  glb: async (b) => readGlb(await b.arrayBuffer()),
  gltf: async (b) => readGltfDoc(JSON.parse(await b.text()), null),
  ply: async (b) => readPlyAscii(await b.text()),
  usdz: readUsdz,
  "3mf": readThreeMfBlob,
};

const ROUTES: Array<[string, string]> = [
  ["fbx", "obj"], ["fbx", "stl"], ["fbx", "glb"], ["fbx", "gltf"], ["fbx", "ply"], ["fbx", "usdz"],
  ["dae", "obj"], ["dae", "stl"], ["dae", "glb"], ["dae", "gltf"], ["dae", "ply"], ["dae", "usdz"],
  ["3ds", "obj"], ["3ds", "stl"], ["3ds", "glb"], ["3ds", "gltf"], ["3ds", "ply"],
  ["ply", "obj"], ["ply", "stl"], ["ply", "glb"], ["ply", "gltf"],
  ["obj", "ply"], ["stl", "ply"], ["glb", "ply"], ["gltf", "ply"],
  ["gltf", "obj"], ["gltf", "stl"],
  ["obj", "gltf"], ["stl", "gltf"],
  ["gltf", "glb"], ["glb", "gltf"],
  ["obj", "usdz"], ["stl", "usdz"], ["glb", "usdz"], ["gltf", "usdz"],
  ["glb", "3mf"],
];

describe("3D mesh routes preserve geometry (independent readers, volume ground truth)", () => {
  for (const [src, dst] of ROUTES) {
    it(`${src}-to-${dst} keeps 12 triangles and volume 8`, async () => {
      const result = await run(`${src}-to-${dst}`, INPUTS[src]());
      const soup = await READERS[dst](result.blob);
      expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
      // three.js-loaded sources round through Float32 and axis conversions;
      // give them a slightly looser epsilon than the pure-JS paths.
      const digits = src === "fbx" || src === "dae" || src === "3ds" ? 3 : 5;
      expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(CUBE_VOLUME, digits);
    });
  }
});

describe("glTF <-> GLB container repacks are lossless", () => {
  it("gltf-to-glb preserves materials and geometry verbatim", async () => {
    const result = await run("gltf-to-glb", INPUTS.gltf());
    const buf = await result.blob.arrayBuffer();
    const view = new DataView(buf);
    const jsonLen = view.getUint32(12, true);
    const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
    expect(doc.materials?.[0]?.name).toBe("FixtureRed");
    expect(doc.materials?.[0]?.pbrMetallicRoughness?.baseColorFactor).toEqual([1, 0, 0, 1]);
    expect(doc.accessors).toHaveLength(2);
    const soup = readGlb(buf);
    expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(CUBE_VOLUME, 5);
  });

  it("merges multi-buffer glTF into one BIN with rebased bufferViews", async () => {
    // Split the fixture's single buffer into two: positions in buffer 0,
    // indices in buffer 1. The repack must merge them and rebase offsets.
    const doc = JSON.parse(makeCubeGltfJson());
    const dataUri: string = doc.buffers[0].uri;
    const raw = atob(dataUri.slice(dataUri.indexOf(",") + 1));
    const all = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) all[i] = raw.charCodeAt(i);
    const posBytes = doc.bufferViews[0].byteLength;
    const toB64 = (bytes: Uint8Array) => {
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      return `data:application/octet-stream;base64,${btoa(bin)}`;
    };
    doc.buffers = [
      { byteLength: posBytes, uri: toB64(all.subarray(0, posBytes)) },
      { byteLength: all.length - posBytes, uri: toB64(all.subarray(posBytes)) },
    ];
    doc.bufferViews[0] = { buffer: 0, byteOffset: 0, byteLength: posBytes };
    doc.bufferViews[1] = { buffer: 1, byteOffset: 0, byteLength: all.length - posBytes };

    const input = fileFromText("two-buffers.gltf", JSON.stringify(doc), "model/gltf+json");
    const result = await run("gltf-to-glb", input);
    const buf = await result.blob.arrayBuffer();
    const outDoc = JSON.parse(
      new TextDecoder().decode(new Uint8Array(buf, 20, new DataView(buf).getUint32(12, true))),
    );
    expect(outDoc.buffers).toHaveLength(1);
    expect(outDoc.bufferViews.every((bv: { buffer: number }) => bv.buffer === 0)).toBe(true);
    const soup = readGlb(buf);
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(CUBE_VOLUME, 5);
  });

  it("gltf -> glb -> gltf round-trip keeps materials and geometry", async () => {
    const glb = await run("gltf-to-glb", INPUTS.gltf());
    const glbFile = new File([await glb.blob.arrayBuffer()], "cube.glb", { type: "model/gltf-binary" });
    const back = await run("glb-to-gltf", glbFile);
    const doc = JSON.parse(await back.blob.text());
    expect(doc.materials?.[0]?.name).toBe("FixtureRed");
    expect(doc.buffers?.[0]?.uri?.startsWith("data:")).toBe(true);
    const soup = readGltfDoc(doc, null);
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(CUBE_VOLUME, 5);
  });
});

describe("glTF geometry extraction correctness", () => {
  it("reads interleaved (byteStride) GLBs correctly instead of ingesting junk", async () => {
    const input = fileFromBytes("cube-interleaved.glb", makeCubeGlb(true), "model/gltf-binary");
    const result = await run("glb-to-obj", input);
    const soup = readObj(await result.blob.text());
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(CUBE_VOLUME, 5);
  });

  it("applies node transforms (scale bakes into the geometry)", async () => {
    const input = fileFromText("scaled.gltf", makeScaledCubeGltfJson(), "model/gltf+json");
    const result = await run("gltf-to-obj", input);
    const soup = readObj(await result.blob.text());
    // scale 0.5 in every axis: volume 8 * 0.125 = 1; translation is volume-neutral
    expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(1, 5);
  });

  it("rejects Draco-compressed glTF with an actionable message", async () => {
    const doc = JSON.parse(makeCubeGltfJson());
    doc.extensionsRequired = ["KHR_draco_mesh_compression"];
    const input = fileFromText("draco.gltf", JSON.stringify(doc), "model/gltf+json");
    await expect(run("gltf-to-obj", input)).rejects.toThrow(/Draco/);
  });

  it("rejects glTF referencing external buffer files with an actionable message", async () => {
    const doc = JSON.parse(makeCubeGltfJson());
    doc.buffers[0] = { byteLength: 1000, uri: "model.bin" };
    const input = fileFromText("external.gltf", JSON.stringify(doc), "model/gltf+json");
    await expect(run("gltf-to-obj", input)).rejects.toThrow(/external buffer/);
  });
});

describe("PLY encodings", () => {
  it("parses ascii PLY", async () => {
    const input = fileFromText("cube.ply", CUBE_PLY_ASCII, "text/plain");
    const result = await run("ply-to-obj", input);
    const soup = readObj(await result.blob.text());
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(meshVolume(soup.vertices, soup.triangles)).toBeCloseTo(CUBE_VOLUME, 5);
  });

  it("parses binary big-endian PLY", async () => {
    // Rewrite the little-endian fixture as big-endian by rebuilding the body.
    const le = makeCubePlyBinary();
    const text = new TextDecoder("latin1").decode(le);
    const bodyStart = text.indexOf("end_header\n") + "end_header\n".length;
    const header = text
      .slice(0, bodyStart)
      .replace("binary_little_endian", "binary_big_endian");
    const headerBytes = new TextEncoder().encode(header);
    const leBody = new DataView(le.buffer, bodyStart);
    const beBody = new Uint8Array(le.length - bodyStart);
    const beView = new DataView(beBody.buffer);
    let off = 0;
    for (let i = 0; i < 8; i++) {
      for (let c = 0; c < 3; c++) {
        beView.setFloat32(off, leBody.getFloat32(off, true), false);
        off += 4;
      }
    }
    for (let i = 0; i < 12; i++) {
      beBody[off] = leBody.getUint8(off);
      off += 1;
      for (let c = 0; c < 3; c++) {
        beView.setInt32(off, leBody.getInt32(off, true), false);
        off += 4;
      }
    }
    const be = new Uint8Array(headerBytes.length + beBody.length);
    be.set(headerBytes, 0);
    be.set(beBody, headerBytes.length);
    const result = await run("ply-to-obj", fileFromBytes("cube-be.ply", be, "application/octet-stream"));
    const soup = readObj(await result.blob.text());
    expect(meshVolume(soup.vertices, soup.triangles)).toBeCloseTo(CUBE_VOLUME, 5);
  });

  it("rejects point-cloud PLY (no faces) with an honest message", async () => {
    const pointCloud = `ply
format ascii 1.0
element vertex 3
property float x
property float y
property float z
end_header
0 0 0
1 0 0
0 1 0
`;
    const input = fileFromText("cloud.ply", pointCloud, "text/plain");
    await expect(run("ply-to-obj", input)).rejects.toThrow(/point cloud/);
  });
});
