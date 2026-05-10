import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseBibtex } from "../util/bibtex";
import { buildEndnoteXml } from "../util/endnote-xml-build";

const bibtexToEndnoteXml: Converter = {
  id: "bibtex-to-endnote-xml",
  label: "BibTeX → EndNote XML",
  fromMime: ["application/x-bibtex", "text/x-bibtex", "text/plain"],
  accept: [".bib", ".bibtex"],
  toMime: "application/xml",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let xml: string;
    try {
      const citations = parseBibtex(await input.text());
      if (citations.length === 0) throw new Error("No citations found in BibTeX");
      xml = buildEndnoteXml(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert BibTeX to EndNote XML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([xml], { type: "application/xml" }),
      filename: swapExtension(input.name, "xml"),
    };
  },
};

export default bibtexToEndnoteXml;
