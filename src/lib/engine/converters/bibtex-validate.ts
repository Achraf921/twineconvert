import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { validateCitations, buildValidationReport } from "../util/citation-validate";

/**
 * BibTeX completeness check. Parses a BibTeX library and reports any entry
 * missing the fields its type needs (an article needs a journal, a book needs a
 * publisher, etc.), so you can catch incomplete references before a submission.
 * Output is a plain-text report; the input is not modified.
 */
const bibtexValidate: Converter = {
  id: "bibtex-validate",
  label: "BibTeX Completeness Check",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("No references found in the BibTeX file");
      out = buildValidationReport(validateCitations(citations));
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not check the BibTeX file", err);
    }
    opts?.onProgress?.(1);
    return { blob: new Blob([out], { type: "text/plain;charset=utf-8" }), filename: swapExtension(input.name, "txt") };
  },
};

export default bibtexValidate;
