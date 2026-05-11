import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildKml, parseGpx } from "../util/geo";

const gpxToKml: Converter = {
  id: "gpx-to-kml",
  label: "GPX → KML",
  fromMime: ["application/gpx+xml", "application/xml", "text/xml"],
  accept: [".gpx"],
  toMime: "application/vnd.google-earth.kml+xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = buildKml(parseGpx(await input.text()));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert GPX to KML",
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

export default gpxToKml;
