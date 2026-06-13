import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * INI → XML. Parses INI into a plain object and re-serialises it as
 * XML. Structure (keys, nesting, scalars, arrays) carries across;
 * format-specific niceties (comments, anchors) are not preserved.
 */
const iniToXml: Converter = {
  id: "ini-to-xml",
  label: "INI → XML",
  fromMime: ["text/plain", "application/x-ini"],
  accept: [".ini", ".cfg", ".conf"],
  toMime: "application/xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const ini = await import("ini");
      const obj = ini.parse(await input.text());
      if (obj == null || typeof obj !== "object") {
        throw new Error("The INI did not parse into a key/value document.");
      }
      const { XMLBuilder } = await import("fast-xml-parser");
      const builder = new XMLBuilder({ format: true });
      out = `<?xml version="1.0" encoding="UTF-8"?>\n` + builder.build(obj);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert INI to XML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/xml;charset=utf-8" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default iniToXml;
