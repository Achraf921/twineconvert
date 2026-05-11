import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGeoJson, parseGpx } from "../util/geo";

const gpxToGeoJson: Converter = {
  id: "gpx-to-geojson",
  label: "GPX → GeoJSON",
  fromMime: ["application/gpx+xml", "application/xml", "text/xml"],
  accept: [".gpx"],
  toMime: "application/geo+json",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = buildGeoJson(parseGpx(await input.text()));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GPX to GeoJSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/geo+json;charset=utf-8" }),
      filename: swapExtension(input.name, "geojson"),
    };
  },
};

export default gpxToGeoJson;
