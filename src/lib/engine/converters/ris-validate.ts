import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseRis } from "../util/ris";
import { validateCitations, buildValidationReport } from "../util/citation-validate";

/**
 * RIS completeness check. Parses a RIS library and reports any entry
 * missing the fields its type needs (an article needs a journal, a book needs a
 * publisher, etc.), so you can catch incomplete references before a submission.
 * Output is a plain-text report; the input is not modified.
 */
const risValidate: Converter = {
  id: "ris-validate",
  label: "RIS Completeness Check",
  fromMime: ["application/x-research-info-systems", "text/plain"],
  accept: [".ris"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseRis(await input.text());
      if (citations.length === 0) throw new Error("No references found in the RIS file");
      out = buildValidationReport(validateCitations(citations));
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not check the RIS file", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "txt") };
  },
};

export default risValidate;
