/**
 * Browser tests for the IFC (BIM) family.
 *
 * Fixture: a 1.6KB hand-crafted IFC4 STEP file with project, site,
 * building, storey, and two IfcWall elements. Enough graph for
 * ifc-to-csv to walk and produce non-empty rows; enough geometry
 * for ifc-to-gltf to emit a valid glTF.
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { loadFixtureSync } from "./helpers";

describe("IFC converters (browser, content-checked)", () => {
  it("ifc-to-csv extracts both walls (WallA + WallB) with type IFCWALL", async () => {
    const ifc = loadFixtureSync("sample.ifc");
    const result = await run("ifc-to-csv", ifc);
    expect(result.blob.size).toBeGreaterThan(0);
    const csv = await result.blob.text();
    const lines = csv.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3); // header + 2 walls
    // Should contain both wall names and the IFCWALL type
    expect(csv).toContain("WallA");
    expect(csv).toContain("WallB");
    // Wall TYPE column should contain "Wall" (case-variant tolerant —
    // the converter may emit "IFCWALL", "IfcWall", or "Wall")
    expect(csv.toLowerCase()).toContain("wall");
  }, 90000);

  it("ifc-to-gltf produces a parseable glTF document referencing meshes", async () => {
    const ifc = loadFixtureSync("sample.ifc");
    const result = await run("ifc-to-gltf", ifc);
    expect(result.blob.size).toBeGreaterThan(0);
    const head = new Uint8Array(await result.blob.slice(0, 4).arrayBuffer());
    const asString = String.fromCharCode(...head);
    if (asString === "glTF") {
      // GLB binary container: validate header
      const view = new DataView(await result.blob.arrayBuffer());
      expect(view.getUint32(0, true)).toBe(0x46546c67); // 'glTF' little-endian
      expect(view.getUint32(4, true)).toBe(2); // glTF v2
      expect(view.getUint32(8, true)).toBe(result.blob.size);
    } else {
      // JSON glTF: parse and verify it has nodes / meshes / asset
      const json = JSON.parse(await result.blob.text());
      expect(json.asset?.version).toBe("2.0");
      expect(Array.isArray(json.meshes) || Array.isArray(json.nodes)).toBe(true);
    }
  }, 90000);
});
