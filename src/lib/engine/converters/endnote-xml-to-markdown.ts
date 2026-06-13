import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEndnoteXml } from "../util/endnote-xml";
import { buildMarkdownBibliography } from "../util/bibliography-render";

/**
 * EndNote XML → a formatted Markdown reference list. Parses EndNote XML into the unified Citation model, then renders each entry as a human-readable Markdown bibliography.
 */
const endnoteXmlToMarkdown: Converter = {
  id: "endnote-xml-to-markdown",
  label: "EndNote XML → Markdown",
  fromMime: ["application/xml", "text/xml"],
  accept: [".xml"],
  toMime: "text/markdown",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseEndnoteXml(await input.text());
      if (citations.length === 0) throw new Error("No references found in the EndNote XML file");
      out = buildMarkdownBibliography(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert EndNote XML to Markdown",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/markdown;charset=utf-8" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

export default endnoteXmlToMarkdown;
