import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import docxToHtml from "./docx-to-html";
import htmlToMarkdown from "./html-to-markdown";

/**
 * DOCX → Markdown. Uses mammoth to map Word styles to semantic HTML,
 * then turndown to emit clean ATX-heading, fenced-code Markdown. The
 * intermediate HTML keeps headings, lists, bold/italic, and links, so
 * the Markdown round-trips far better than a raw text extraction.
 */
const docxToMarkdown: Converter = {
  id: "docx-to-markdown",
  label: "DOCX → Markdown",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
  ],
  accept: [".docx"],
  toMime: "text/markdown",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let md: string;
    try {
      const html = await docxToHtml.convert(input, undefined);
      // mammoth output is wrapped in a full HTML document; turndown wants
      // a body fragment, so unwrap it (also drops the <title> wrapper).
      let fragment = await html.blob.text();
      if (typeof DOMParser !== "undefined") {
        const body = new DOMParser().parseFromString(fragment, "text/html").body;
        if (body && body.innerHTML.trim()) fragment = body.innerHTML;
      }
      const htmlFile = new File([fragment], swapExtension(input.name, "html"), {
        type: "text/html",
      }) as unknown as File;
      opts?.onProgress?.(0.5);
      const result = await htmlToMarkdown.convert(htmlFile, undefined);
      md = (await result.blob.text()).trim();
      if (!md) throw new Error("The DOCX produced no readable text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DOCX to Markdown",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([md], { type: "text/markdown" }),
      filename: swapExtension(input.name, "md"),
    };
  },
};

export default docxToMarkdown;
