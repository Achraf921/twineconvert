/**
 * three.js bridge for the DCC/game-engine formats whose parsers are too
 * complex to hand-roll responsibly: FBX (Autodesk / Unreal / Fab), COLLADA
 * (.dae), 3DS (legacy 3D Studio), and USDZ output (Apple AR Quick Look /
 * USD ecosystems). Everything is lazily imported so only the routes that
 * need three.js pay its bundle cost; the simple formats (OBJ, STL, PLY,
 * glTF) keep their small hand-written parsers in util/mesh.ts et al.
 *
 * The bridge flattens whatever scene the loader returns into the engine's
 * Mesh interchange (flat vertex + triangle arrays): every THREE.Mesh in the
 * tree is baked through its world matrix and merged, so multi-part models
 * (the norm in FBX/DAE exports) come out whole rather than losing all but
 * the first part. Materials, rigs, and animations are not carried over;
 * the geometry targets we convert to (OBJ/STL/PLY/GLB geometry) cannot
 * represent them anyway.
 */

import type { Object3D, Mesh as ThreeMeshType } from "three";
import type { Mesh } from "./mesh";

/** Flatten a three.js object tree into merged world-space triangles. */
async function object3dToMesh(root: Object3D): Promise<Mesh> {
  const { Vector3 } = await import("three");
  const vertices: number[] = [];
  const triangles: number[] = [];
  const v = new Vector3();

  root.updateMatrixWorld(true);
  root.traverse((node) => {
    const mesh = node as ThreeMeshType;
    if (!mesh.isMesh) return;
    const geom = mesh.geometry;
    const pos = geom?.getAttribute("position");
    if (!pos) return;
    const base = vertices.length / 3;
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld);
      vertices.push(v.x, v.y, v.z);
    }
    const index = geom.index;
    if (index) {
      for (let i = 0; i < index.count; i++) triangles.push(base + index.getX(i));
    } else {
      for (let i = 0; i < pos.count; i++) triangles.push(base + i);
    }
  });

  if (triangles.length < 3) {
    throw new Error("The file contains no triangle mesh geometry to convert");
  }
  return { vertices: Float32Array.from(vertices), triangles: Uint32Array.from(triangles) };
}

/**
 * Parse an FBX file (binary or ASCII, version 7000+) into a Mesh.
 * Texture references inside the FBX are ignored; geometry does not need them.
 */
export async function meshFromFbx(buf: ArrayBuffer): Promise<Mesh> {
  const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
  const group = new FBXLoader().parse(buf, "");
  return object3dToMesh(group);
}

/** Parse a COLLADA (.dae) document into a Mesh. */
export async function meshFromDae(text: string): Promise<Mesh> {
  const { ColladaLoader } = await import("three/examples/jsm/loaders/ColladaLoader.js");
  const collada = new ColladaLoader().parse(text, "");
  if (!collada?.scene) throw new Error("Could not parse the COLLADA document");
  return object3dToMesh(collada.scene);
}

/** Parse a 3DS (Autodesk 3D Studio) file into a Mesh. */
export async function meshFrom3ds(buf: ArrayBuffer): Promise<Mesh> {
  const { TDSLoader } = await import("three/examples/jsm/loaders/TDSLoader.js");
  const group = new TDSLoader().parse(buf, "");
  return object3dToMesh(group);
}

/**
 * Build a USDZ archive (the Pixar USD zip flavor Apple AR Quick Look reads)
 * from a Mesh, via three's USDZExporter, which handles the USDZ zip
 * alignment rules (uncompressed entries, 64-byte data alignment).
 */
export async function buildUsdz(mesh: Mesh): Promise<Blob> {
  const three = await import("three");
  const { USDZExporter } = await import("three/examples/jsm/exporters/USDZExporter.js");

  const geom = new three.BufferGeometry();
  geom.setAttribute("position", new three.BufferAttribute(Float32Array.from(mesh.vertices), 3));
  geom.setIndex(new three.BufferAttribute(Uint32Array.from(mesh.triangles), 1));
  geom.computeVertexNormals();

  const object = new three.Mesh(
    geom,
    new three.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.7, metalness: 0.1 }),
  );
  object.name = "Model";
  const scene = new three.Scene();
  scene.add(object);

  const bytes = await new USDZExporter().parseAsync(scene);
  return new Blob([bytes as BlobPart], { type: "model/vnd.usdz+zip" });
}
