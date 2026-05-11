import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGpx, parseGeoJson } from "../util/geo";

const geoJsonToGpx: Converter = {
  id: "geojson-to-gpx",
  label: "GeoJSON → GPX",
  fromMime: ["application/geo+json", "application/json", "text/plain"],
  accept: [".geojson", ".json"],
  toMime: "application/gpx+xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = buildGpx(parseGeoJson(await input.text()));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GeoJSON to GPX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/gpx+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "gpx"),
    };
  },
};

export default geoJsonToGpx;
