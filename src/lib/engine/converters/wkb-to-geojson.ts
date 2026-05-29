import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * WKB (Well-Known Binary) → GeoJSON. WKB is the binary OGC encoding
 * used by PostGIS / GeoPackage / Shapefile pipelines for compact
 * geometry storage. We accept either a raw binary WKB file or a hex
 * string (the format psql shows when you SELECT a geometry column).
 */
const wkbToGeojson: Converter = {
  id: "wkb-to-geojson",
  label: "WKB → GeoJSON",
  fromMime: ["application/octet-stream", "application/wkb", "text/plain"],
  accept: [".wkb", ".bin", ".hex", ".txt"],
  toMime: "application/geo+json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const wkx = await import("wkx");
      const Geometry = (
        "default" in wkx
          ? (wkx.default as { Geometry: unknown }).Geometry
          : (wkx as { Geometry: unknown }).Geometry
      ) as { parse: (b: Uint8Array | Buffer | string) => { toGeoJSON: () => unknown } };
      const buf = await readAsBuffer(input);
      const geom = Geometry.parse(buf);
      const gj = geom.toGeoJSON();
      json = JSON.stringify(
        { type: "Feature", properties: {}, geometry: gj },
        null,
        2,
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse WKB",
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

async function readAsBuffer(input: File): Promise<Buffer> {
  // Detect hex: contiguous run of hex digits (case-insensitive), optionally
  // prefixed with 0x or \x. PostGIS hex starts with the SRID prefix for
  // EWKB; we strip whitespace and try parseHex first, fall back to binary.
  const head = await input.slice(0, 2).text().catch(() => "");
  if (head.length > 0 && /^[0-9a-fA-F]/.test(head[0])) {
    const text = (await input.text()).replace(/\s+/g, "").replace(/^0x/i, "");
    if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
      return Buffer.from(text, "hex");
    }
  }
  return Buffer.from(await input.arrayBuffer());
}

export default wkbToGeojson;
