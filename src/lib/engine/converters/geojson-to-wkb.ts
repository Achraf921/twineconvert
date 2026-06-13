import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * GeoJSON → WKB. Emits a single binary WKB blob for the first geometry
 * in the input (Feature.geometry, FeatureCollection.features[0].geometry,
 * or a bare Geometry). For multi-geometry inputs callers typically iterate
 * row-by-row in their database client, so we don't try to concatenate.
 */
const geojsonToWkb: Converter = {
  id: "geojson-to-wkb",
  label: "GeoJSON → WKB",
  fromMime: ["application/geo+json", "application/json", "text/plain"],
  accept: [".geojson", ".json"],
  toMime: "application/octet-stream",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const wkx = await import("wkx");
      const Geometry = (
        "default" in wkx
          ? (wkx.default as { Geometry: unknown }).Geometry
          : (wkx as { Geometry: unknown }).Geometry
      ) as { parseGeoJSON: (g: unknown) => { toWkb: () => Buffer } };
      const parsed: unknown = parseJsonInput(await input.text());
      const geom = extractFirstGeometry(parsed);
      if (!geom) {
        throw new Error(
          "No GeoJSON geometry found. Expected a Feature, FeatureCollection, or bare Geometry object.",
        );
      }
      const buf = Geometry.parseGeoJSON(geom).toWkb();
      // Copy into a fresh ArrayBuffer so Blob accepts the TypedArray on all
      // TS lib targets (avoids the SharedArrayBuffer-union inference issue).
      const ab = new ArrayBuffer(buf.length);
      new Uint8Array(ab).set(buf);
      blob = new Blob([ab], { type: "application/octet-stream" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode GeoJSON as WKB",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob,
      filename: swapExtension(input.name, "wkb"),
    };
  },
};

function extractFirstGeometry(input: unknown): unknown | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as { type?: string; geometry?: unknown; features?: unknown[] };
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    const first = obj.features[0] as { geometry?: unknown } | undefined;
    return first?.geometry ?? null;
  }
  if (obj.type === "Feature") return obj.geometry ?? null;
  if (typeof obj.type === "string") return obj;
  return null;
}

export default geojsonToWkb;
