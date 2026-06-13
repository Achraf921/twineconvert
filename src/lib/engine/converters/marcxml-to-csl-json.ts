import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarcxml } from "../util/marcxml";
import { buildCslJson } from "../util/csl-json";

/**
 * MARCXML → CSL-JSON. Parses MARC21 slim XML (the format library catalogs export)
 * into the unified Citation model, then writes CSL-JSON.
 * Import-only.
 */
const marcxmlToCslJson: Converter = {
  id: "marcxml-to-csl-json",
  label: "MARCXML → CSL-JSON",
  fromMime: ["application/marcxml+xml", "application/xml", "text/xml"],
  accept: [".xml", ".marcxml", ".mrcx"],
  toMime: "application/vnd.citationstyles.csl+json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = await input.text();
      const citations = parseMarcxml(text);
      if (citations.length === 0) throw new Error("No records found in the MARCXML file");
      out = buildCslJson(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MARCXML to CSL-JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/vnd.citationstyles.csl+json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default marcxmlToCslJson;
