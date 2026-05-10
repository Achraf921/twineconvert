import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { openIfcModel } from "../util/ifc-load";

interface ElementRow {
  globalId: string;
  type: string;
  name: string;
  material: string;
  netVolume: string;
  netArea: string;
  length: string;
  width: string;
  height: string;
  storey: string;
}

/**
 * IFC → CSV (quantity takeoff). Walks every building element in the
 * IFC file and extracts the fields a typical AEC quantity-takeoff
 * spreadsheet needs: type, name, material, volume/area/length/etc.
 *
 * IFC's data model is graph-shaped: an element doesn't directly own
 * its quantities — it's connected via IfcRelDefinesByProperties to an
 * IfcElementQuantity, which holds IfcQuantityVolume / IfcQuantityArea /
 * IfcQuantityLength children. We walk those relationships per element.
 *
 * Element types covered: Wall, Slab, Beam, Column, Door, Window, Roof,
 * Stair, Space, Plate, Member, Footing, Pile. The "Building Element"
 * superclass covers the rest implicitly via web-ifc's includeInherited.
 */
const ifcToCsv: Converter = {
  id: "ifc-to-csv",
  label: "IFC → CSV (quantity takeoff)",
  fromMime: ["application/x-step", "application/ifc", "text/plain"],
  accept: [".ifc"],
  toMime: "text/csv",
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let csv: string;
    try {
      const { api, modelID } = await openIfcModel(input);
      opts?.onProgress?.(0.3);

      // IfcBuildingElement type id (from web-ifc's schema constants).
      // Using GetLineIDsWithType with includeInherited collects every subclass.
      const webIfc = await import("web-ifc");
      const elementIds = api.GetLineIDsWithType(modelID, webIfc.IFCBUILDINGELEMENT, true);
      const spaceIds = api.GetLineIDsWithType(modelID, webIfc.IFCSPACE, true);

      const rows: ElementRow[] = [];
      const total = elementIds.size() + spaceIds.size();
      let processed = 0;

      const handleElement = (id: number) => {
        const line = api.GetLine(modelID, id);
        const row: ElementRow = {
          globalId: String(line?.GlobalId?.value ?? ""),
          type: String(api.GetLineType(modelID, id) ?? ""),
          name: String(line?.Name?.value ?? ""),
          material: extractMaterial(api, modelID, id, webIfc) ?? "",
          netVolume: "",
          netArea: "",
          length: "",
          width: "",
          height: "",
          storey: "",
        };
        const quantities = extractQuantities(api, modelID, id, webIfc);
        if (quantities.netVolume !== undefined) row.netVolume = quantities.netVolume.toFixed(4);
        if (quantities.netArea !== undefined) row.netArea = quantities.netArea.toFixed(4);
        if (quantities.length !== undefined) row.length = quantities.length.toFixed(4);
        if (quantities.width !== undefined) row.width = quantities.width.toFixed(4);
        if (quantities.height !== undefined) row.height = quantities.height.toFixed(4);
        rows.push(row);
        processed++;
        if (processed % 50 === 0) {
          opts?.onProgress?.(0.3 + (processed / total) * 0.6);
        }
      };

      for (let i = 0; i < elementIds.size(); i++) handleElement(elementIds.get(i));
      for (let i = 0; i < spaceIds.size(); i++) handleElement(spaceIds.get(i));

      api.CloseModel(modelID);

      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(rows);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse IFC",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

function extractMaterial(
  api: import("web-ifc").IfcAPI,
  modelID: number,
  elementId: number,
  webIfc: typeof import("web-ifc"),
): string | undefined {
  // Walk IfcRelAssociatesMaterial to find the material assigned to this element.
  const relIds = api.GetLineIDsWithType(modelID, webIfc.IFCRELASSOCIATESMATERIAL);
  for (let i = 0; i < relIds.size(); i++) {
    const rel = api.GetLine(modelID, relIds.get(i));
    const objects = rel?.RelatedObjects ?? [];
    const matches = Array.isArray(objects) && objects.some((o: { value: number }) => o.value === elementId);
    if (matches) {
      const mat = api.GetLine(modelID, rel.RelatingMaterial?.value);
      if (mat?.Name?.value) return String(mat.Name.value);
      if (mat?.ForLayerSet?.value) {
        const layerSet = api.GetLine(modelID, mat.ForLayerSet.value);
        if (layerSet?.LayerSetName?.value) return String(layerSet.LayerSetName.value);
      }
      return mat?.constructor?.name ?? "(complex material)";
    }
  }
  return undefined;
}

function extractQuantities(
  api: import("web-ifc").IfcAPI,
  modelID: number,
  elementId: number,
  webIfc: typeof import("web-ifc"),
): { netVolume?: number; netArea?: number; length?: number; width?: number; height?: number } {
  const out: { netVolume?: number; netArea?: number; length?: number; width?: number; height?: number } = {};
  const relIds = api.GetLineIDsWithType(modelID, webIfc.IFCRELDEFINESBYPROPERTIES);
  for (let i = 0; i < relIds.size(); i++) {
    const rel = api.GetLine(modelID, relIds.get(i));
    const objects = rel?.RelatedObjects ?? [];
    const matches = Array.isArray(objects) && objects.some((o: { value: number }) => o.value === elementId);
    if (!matches) continue;
    const props = api.GetLine(modelID, rel.RelatingPropertyDefinition?.value);
    if (!props) continue;
    // We only care about IfcElementQuantity (ignore IfcPropertySet here).
    const quantities = props.Quantities ?? [];
    if (!Array.isArray(quantities)) continue;
    for (const qRef of quantities) {
      const q = api.GetLine(modelID, qRef.value);
      if (!q) continue;
      const name = String(q.Name?.value ?? "").toLowerCase();
      const value =
        q.VolumeValue?.value ??
        q.AreaValue?.value ??
        q.LengthValue?.value ??
        q.WeightValue?.value;
      if (typeof value !== "number") continue;
      if (name.includes("netvolume")) out.netVolume = value;
      else if (name.includes("grossvolume") && out.netVolume === undefined) out.netVolume = value;
      else if (name.includes("netarea") || name.includes("netsidearea")) out.netArea = value;
      else if (name.includes("grossarea") && out.netArea === undefined) out.netArea = value;
      else if (name === "length") out.length = value;
      else if (name === "width") out.width = value;
      else if (name === "height") out.height = value;
    }
  }
  return out;
}

export default ifcToCsv;
