import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGpx, parseKml } from "../util/geo";

const kmlToGpx: Converter = {
  id: "kml-to-gpx",
  label: "KML → GPX",
  fromMime: ["application/vnd.google-earth.kml+xml", "application/xml", "text/xml"],
  accept: [".kml"],
  toMime: "application/gpx+xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = buildGpx(parseKml(await input.text()));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert KML to GPX",
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

export default kmlToGpx;
