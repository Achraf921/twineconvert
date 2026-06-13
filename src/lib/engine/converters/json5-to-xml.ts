import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JSON5 → XML. Parses JSON5 into a plain object and re-serialises it as
 * XML. Structure (keys, nesting, scalars, arrays) carries across;
 * format-specific niceties (comments, anchors) are not preserved.
 */
const json5ToXml: Converter = {
  id: "json5-to-xml",
  label: "JSON5 → XML",
  fromMime: ["application/json5", "application/json", "text/plain"],
  accept: [".json5"],
  toMime: "application/xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const JSON5 = (await import("json5")).default;
      const obj = JSON5.parse(await input.text());
      if (obj == null || typeof obj !== "object") {
        throw new Error("The JSON5 did not parse into a key/value document.");
      }
      const { XMLBuilder } = await import("fast-xml-parser");
      const builder = new XMLBuilder({ format: true });
      out = `<?xml version="1.0" encoding="UTF-8"?>\n` + builder.build(obj);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON5 to XML",
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

export default json5ToXml;
