import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildBibtex } from "../util/bibtex";
import { parseEndnoteXml } from "../util/endnote-xml";

const endnoteXmlToBibtex: Converter = {
  id: "endnote-xml-to-bibtex",
  label: "EndNote XML → BibTeX",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "application/x-bibtex",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bibtex: string;
    try {
      const text = await input.text();
      const citations = parseEndnoteXml(text);
      if (citations.length === 0) throw new Error("No citations found in EndNote XML");
      bibtex = buildBibtex(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to BibTeX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bibtex], { type: "application/x-bibtex" }),
      filename: swapExtension(input.name, "bib"),
    };
  },
};

export default endnoteXmlToBibtex;
