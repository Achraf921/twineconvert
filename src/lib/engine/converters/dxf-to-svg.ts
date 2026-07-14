import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseDxf, buildSvgFromDxf } from "../util/dxf";

const dxfToSvg: Converter = {
  id: "dxf-to-svg",
  label: "DXF → SVG",
  fromMime: ["image/vnd.dxf", "application/dxf", "text/plain"],
  accept: [".dxf"],
  toMime: "image/svg+xml",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let svg: string;
    try {
      const entities = parseDxf(await input.text());
      if (entities.length === 0) {
        throw new Error(
          "No drawable entities found in the ENTITIES section. Binary DXF and ACIS-only DXF are not supported.",
        );
      }
      svg = buildSvgFromDxf(entities);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DXF to SVG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "svg"),
    };
  },
};

export default dxfToSvg;
