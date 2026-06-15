import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseReferenceList } from "../util/reference-list";
import { buildEndnoteXml } from "../util/endnote-xml-build";

/**
 * Reference list (plain text) → EndNote XML. Parses a
 * pasted bibliography (numbered IEEE or APA entries) into citations and
 * emits EndNote XML. Same demand signal as the rest of the
 * references-to-* family.
 */
const conv: Converter = {
  id: "references-to-endnote-xml",
  label: "Reference List → EndNote XML",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "application/xml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseReferenceList(await input.text());
      if (citations.length === 0) {
        throw new Error(
          "No references recognized. This tool reads a plain-text reference list (numbered IEEE entries like [1] Author, \"Title,\" 2024, or APA entries like Author (2020). Title.). Make sure each reference has a title and year.",
        );
      }
      out = buildEndnoteXml(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert references",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "application/xml" }), filename: swapExtension(input.name, "xml") };
  },
};

export default conv;
