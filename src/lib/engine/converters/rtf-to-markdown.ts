import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import rtfToHtml from "./rtf-to-html";
import htmlToMarkdown from "./html-to-markdown";

/**
 * RTF → Markdown. Converts the RTF to HTML, unwraps the body fragment
 * (turndown wants a fragment, not a full document), then emits clean
 * ATX-heading, fenced-code Markdown. Paragraphs, headings, and emphasis
 * carry over; RTF-only constructs without a Markdown equivalent drop.
 */
const rtfToMarkdown: Converter = {
  id: "rtf-to-markdown",
  label: "RTF → Markdown",
  fromMime: ["application/rtf", "text/rtf", "text/plain"],
  accept: [".rtf"],
  toMime: "text/markdown",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let md: string;
    try {
      const html = await rtfToHtml.convert(input, undefined);
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
      if (!md) throw new Error("The RTF produced no readable text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert RTF to Markdown",
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

export default rtfToMarkdown;
