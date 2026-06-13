import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import markdownToHtml from "./markdown-to-html";
import htmlToDocx from "./html-to-docx";

/**
 * Markdown → DOCX. Renders the Markdown to HTML (marked, GFM) and then
 * maps each block element to a Word paragraph via the html-to-docx
 * pipeline. Headings, bold/italic runs, and list items survive; complex
 * CSS and images flatten to plain paragraphs, matching html-to-docx.
 */
const markdownToDocx: Converter = {
  id: "markdown-to-docx",
  label: "Markdown → DOCX",
  fromMime: ["text/markdown", "text/x-markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      if (!(await input.text()).trim()) throw new Error("The Markdown file is empty");
      const html = await markdownToHtml.convert(input, undefined);
      const htmlFile = new File([await html.blob.text()], swapExtension(input.name, "html"), {
        type: "text/html",
      }) as unknown as File;
      opts?.onProgress?.(0.5);
      const docx = await htmlToDocx.convert(htmlFile, undefined);
      blob = docx.blob;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Markdown to DOCX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "docx") };
  },
};

export default markdownToDocx;
