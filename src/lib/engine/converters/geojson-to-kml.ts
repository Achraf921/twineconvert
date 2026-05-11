import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildKml, parseGeoJson } from "../util/geo";

const geoJsonToKml: Converter = {
  id: "geojson-to-kml",
  label: "GeoJSON → KML",
  fromMime: ["application/geo+json", "application/json", "text/plain"],
  accept: [".geojson", ".json"],
  toMime: "application/vnd.google-earth.kml+xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = buildKml(parseGeoJson(await input.text()));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GeoJSON to KML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.google-earth.kml+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "kml"),
    };
  },
};

export default geoJsonToKml;
