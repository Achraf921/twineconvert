import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCslJson } from "../util/csl-json";
import { renderCitationStyleHtml } from "../util/csl-render";

/**
 * CSL-JSON -> APA (HTML). Parses CSL-JSON into the unified Citation model, then
 * renders a formatted APA reference list as a self-contained HTML document
 * that keeps italics (journal/book titles) and a hanging indent, ready to paste
 * into Word, Google Docs or a web page. The plain-text APA tool is the
 * companion for copy-paste-anywhere output.
 */
const cslJsonToApaHtml: Converter = {
  id: "csl-json-to-apa-html",
  label: "CSL-JSON -> APA (HTML)",
  fromMime: ["application/vnd.citationstyles.csl+json", "application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/html",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseCslJson(await input.text());
      if (citations.length === 0) throw new Error("No references found in the CSL-JSON file");
      out = await renderCitationStyleHtml(citations, "apa");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render the APA HTML bibliography",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default cslJsonToApaHtml;
