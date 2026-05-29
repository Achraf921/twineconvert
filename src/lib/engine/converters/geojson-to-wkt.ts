import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * GeoJSON → WKT. Accepts a Feature, FeatureCollection, or bare Geometry.
 * For FeatureCollection input, every feature's geometry is emitted on
 * its own line so the output is one WKT literal per row (suitable for
 * pasting into PostGIS COPY or feeding into a spreadsheet column).
 */
const geojsonToWkt: Converter = {
  id: "geojson-to-wkt",
  label: "GeoJSON → WKT",
  fromMime: ["application/geo+json", "application/json", "text/plain"],
  accept: [".geojson", ".json"],
  toMime: "text/plain",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const wk = await import("wellknown");
      const stringify = (
        "default" in wk ? wk.default : wk
      ) as { stringify: (g: unknown) => string };
      const parsed: unknown = JSON.parse(await input.text());
      const geoms = extractGeometries(parsed);
      if (geoms.length === 0) {
        throw new Error(
          "No GeoJSON geometries found. Expected a Feature, FeatureCollection, or bare Geometry object.",
        );
      }
      out = geoms.map((g) => stringify.stringify(g)).join("\n");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GeoJSON to WKT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "wkt"),
    };
  },
};

function extractGeometries(input: unknown): unknown[] {
  if (!input || typeof input !== "object") return [];
  const obj = input as { type?: string; geometry?: unknown; features?: unknown[] };
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    return obj.features
      .map((f) => (f as { geometry?: unknown }).geometry)
      .filter((g): g is object => !!g);
  }
  if (obj.type === "Feature" && obj.geometry) return [obj.geometry];
  if (typeof obj.type === "string") return [obj];
  return [];
}

export default geojsonToWkt;
