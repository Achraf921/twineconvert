import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDxf } from "../util/dxf";

const dxfToJson: Converter = {
  id: "dxf-to-json",
  label: "DXF → JSON",
  fromMime: ["image/vnd.dxf", "application/dxf", "text/plain"],
  accept: [".dxf"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const entities = parseDxf(await input.text());
      if (entities.length === 0) {
        throw new Error(
          "No drawable entities found in the ENTITIES section. Binary DXF and ACIS-only DXF are not supported.",
        );
      }
      out = JSON.stringify({ entities }, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DXF to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default dxfToJson;
