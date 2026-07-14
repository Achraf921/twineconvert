/**
 * Probes for the three.js pieces the 3D batch depends on, run against the
 * hand-written fixtures. These pin the load-bearing assumptions (loaders work
 * headlessly in the happy-dom tier, fixtures are spec-valid, geometry
 * survives with correct volume) independently of the converter plumbing.
 */
import { describe, expect, it } from "vitest";
import type { Mesh as ThreeMesh, Object3D } from "three";
import {
  CUBE_DAE,
  CUBE_FBX_ASCII,
  CUBE_TRIANGLE_COUNT,
  CUBE_VOLUME,
  makeCube3ds,
  meshVolume,
} from "./fixtures/mesh3d-fixtures";

/** Extract merged (vertices, triangles) from a three.js object tree. */
function extractSoup(root: Object3D): { vertices: number[]; triangles: number[] } {
  const vertices: number[] = [];
  const triangles: number[] = [];
  root.updateMatrixWorld(true);
  root.traverse((node) => {
    const mesh = node as ThreeMesh;
    if (!mesh.isMesh) return;
    const geom = mesh.geometry;
    const pos = geom.getAttribute("position");
    if (!pos) return;
    const base = vertices.length / 3;
    const v = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < pos.count; i++) {
      v.x = pos.getX(i);
      v.y = pos.getY(i);
      v.z = pos.getZ(i);
      const w = mesh.matrixWorld.elements;
      // apply matrixWorld manually to avoid importing Vector3 here
      const x = w[0] * v.x + w[4] * v.y + w[8] * v.z + w[12];
      const y = w[1] * v.x + w[5] * v.y + w[9] * v.z + w[13];
      const z = w[2] * v.x + w[6] * v.y + w[10] * v.z + w[14];
      vertices.push(x, y, z);
    }
    if (geom.index) {
      for (let i = 0; i < geom.index.count; i++) triangles.push(base + geom.index.getX(i));
    } else {
      for (let i = 0; i < pos.count; i++) triangles.push(base + i);
    }
  });
  return { vertices, triangles };
}

describe("three.js loader probes (fixtures + headless env)", () => {
  it("FBXLoader parses the ASCII FBX cube with correct volume", async () => {
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
    // FBXLoader.parse expects an ArrayBuffer; its binary sniff misbehaves on
    // raw strings, so feed it encoded bytes like a real file read would.
    const buf = new TextEncoder().encode(CUBE_FBX_ASCII).buffer as ArrayBuffer;
    const group = new FBXLoader().parse(buf, "");
    const soup = extractSoup(group);
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(meshVolume(soup.vertices, soup.triangles)).toBeCloseTo(CUBE_VOLUME, 3);
  });

  it("ColladaLoader parses the DAE cube with correct volume", async () => {
    const { ColladaLoader } = await import("three/examples/jsm/loaders/ColladaLoader.js");
    const collada = new ColladaLoader().parse(CUBE_DAE, "");
    expect(collada?.scene).toBeDefined();
    const soup = extractSoup(collada!.scene);
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(Math.abs(meshVolume(soup.vertices, soup.triangles))).toBeCloseTo(CUBE_VOLUME, 3);
  });

  it("TDSLoader parses the 3DS cube with correct volume", async () => {
    const { TDSLoader } = await import("three/examples/jsm/loaders/TDSLoader.js");
    const bytes = makeCube3ds();
    const group = new TDSLoader().parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
      "",
    );
    const soup = extractSoup(group);
    expect(soup.triangles.length / 3).toBe(CUBE_TRIANGLE_COUNT);
    expect(meshVolume(soup.vertices, soup.triangles)).toBeCloseTo(CUBE_VOLUME, 3);
  });

  it("USDZExporter produces a zip containing a usda mesh", async () => {
    const three = await import("three");
    const { USDZExporter } = await import("three/examples/jsm/exporters/USDZExporter.js");
    const geom = new three.BufferGeometry();
    const verts = new Float32Array(24);
    const tris = new Uint32Array(36);
    // reuse the fixture cube
    const { CUBE_VERTICES, CUBE_TRIANGLES } = await import("./fixtures/mesh3d-fixtures");
    CUBE_VERTICES.forEach((v, i) => verts.set(v, i * 3));
    CUBE_TRIANGLES.forEach((t, i) => tris.set(t, i * 3));
    geom.setAttribute("position", new three.BufferAttribute(verts, 3));
    geom.setIndex(new three.BufferAttribute(tris, 1));
    geom.computeVertexNormals();
    const mesh = new three.Mesh(geom, new three.MeshStandardMaterial());
    const scene = new three.Scene();
    scene.add(mesh);
    const bytes = await new USDZExporter().parseAsync(scene);
    // Zip magic "PK"
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    // Unzip and check the usda payload
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(bytes);
    // USDZExporter writes a root usda plus per-geometry usda files; aggregate
    // every usda payload before asserting the mesh made it in.
    const usdaNames = Object.keys(zip.files).filter((n) => n.endsWith(".usda"));
    expect(usdaNames.length).toBeGreaterThan(0);
    let usda = "";
    for (const name of usdaNames) usda += await zip.files[name].async("string");
    expect(usda).toContain("def Mesh");
    expect(usda).toContain("faceVertexIndices");
  });
});
