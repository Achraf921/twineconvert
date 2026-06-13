import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import markdownToHtml from "./markdown-to-html";
import htmlToTxt from "./html-to-txt";

/**
 * Markdown → plain text. Renders the Markdown to HTML (so links, lists,
 * and emphasis are resolved the way a reader sees them) and then strips
 * the tags to readable prose, preserving paragraph and list breaks.
 */
const markdownToTxt: Converter = {
  id: "markdown-to-txt",
  label: "Markdown → Text",
  fromMime: ["text/markdown", "text/x-markdown"],
  accept: [".md", ".markdown"],
  toMime: "text/plain",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      if (!(await input.text()).trim()) throw new Error("The Markdown file is empty");
      const html = await markdownToHtml.convert(input, undefined);
      const htmlFile = new File([await html.blob.text()], swapExtension(input.name, "html"), {
        type: "text/html",
      }) as unknown as File;
      opts?.onProgress?.(0.5);
      const txt = await htmlToTxt.convert(htmlFile, undefined);
      out = await txt.blob.text();
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Markdown to text",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default markdownToTxt;
