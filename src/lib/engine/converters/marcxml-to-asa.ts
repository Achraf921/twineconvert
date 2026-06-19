import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMarcxml } from "../util/marcxml";
import { renderCitationStyle } from "../util/csl-render";

/**
 * MARCXML → ASA. Parses a MARCXML export into the unified Citation
 * model, then renders a formatted ASA reference list with citeproc-js and
 * the official ASA CSL style. Plain text, one reference per paragraph.
 */
const marcxmlToAsa: Converter = {
  id: "marcxml-to-asa",
  label: "MARCXML → ASA",
  fromMime: ["application/marcxml+xml", "application/xml", "text/xml"],
  accept: [".xml", ".marcxml", ".mrcx"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseMarcxml(await input.text());
      if (citations.length === 0) throw new Error("No references found in the MARCXML file");
      out = await renderCitationStyle(citations, "asa", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MARCXML to ASA",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default marcxmlToAsa;
