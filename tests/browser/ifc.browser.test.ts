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

describe("IFC converters (browser, hand-crafted IFC4 fixture)", () => {
  it("ifc-to-csv produces non-empty CSV", async () => {
    const ifc = loadFixtureSync("sample.ifc");
    const result = await run("ifc-to-csv", ifc);
    expect(result.blob.size).toBeGreaterThan(0);
    const csv = await result.blob.text();
    expect(csv.split("\n").length).toBeGreaterThanOrEqual(2);
  }, 90000);

  it("ifc-to-gltf produces a glTF or GLB", async () => {
    const ifc = loadFixtureSync("sample.ifc");
    const result = await run("ifc-to-gltf", ifc);
    expect(result.blob.size).toBeGreaterThan(0);
    const head = new Uint8Array(await result.blob.slice(0, 4).arrayBuffer());
    const asString = String.fromCharCode(...head);
    expect(asString === "glTF" || asString.startsWith("{")).toBe(true);
  }, 90000);
});
