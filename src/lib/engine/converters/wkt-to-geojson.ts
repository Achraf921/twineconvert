import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * WKT (Well-Known Text) → GeoJSON. WKT is the OGC text encoding used
 * by PostGIS, Oracle Spatial, and most GIS engines for geometry literals.
 * GeoJSON is the JSON encoding most web maps (Leaflet, Mapbox) consume.
 *
 * Supports Point, LineString, Polygon, Multi*, and GeometryCollection.
 * Output is wrapped as a single Feature so it drops into a Leaflet
 * `L.geoJSON(...)` call with no further reshaping.
 */
const wktToGeojson: Converter = {
  id: "wkt-to-geojson",
  label: "WKT → GeoJSON",
  fromMime: ["text/plain", "application/wkt", "text/wkt"],
  accept: [".wkt", ".txt"],
  toMime: "application/geo+json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const wk = await import("wellknown");
      const text = (await input.text()).trim();
      const parser = "default" in wk ? wk.default : wk;
      const geom = (parser as { parse: (s: string) => unknown }).parse(text);
      if (!geom) {
        throw new Error(
          "Could not parse the input as WKT. The geometry literal may be malformed; try validating it in a GIS tool first.",
        );
      }
      json = JSON.stringify(
        { type: "Feature", properties: {}, geometry: geom },
        null,
        2,
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert WKT to GeoJSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/geo+json;charset=utf-8" }),
      filename: swapExtension(input.name, "geojson"),
    };
  },
};

export default wktToGeojson;
