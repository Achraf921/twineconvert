import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * AsciiDoc → HTML. AsciiDoc is the technical-writing source format
 * used by Eclipse, Vert.x, Spring's reference docs, and the entire
 * Pro Git book. Renders to a complete HTML5 document via Asciidoctor.js
 * (the official reference implementation, recompiled from Ruby).
 * Output is self-contained: sections, paragraphs, code blocks, and
 * inline formatting all become semantic HTML you can paste into any
 * CMS or static site generator.
 */
const asciidocToHtml: Converter = {
  id: "asciidoc-to-html",
  label: "AsciiDoc → HTML",
  fromMime: ["text/x-asciidoc", "text/plain", "text/asciidoc"],
  accept: [".adoc", ".asciidoc", ".asc", ".txt"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const mod = await import("asciidoctor");
      const factory = (mod.default ?? mod) as () => {
        convert: (source: string, options?: Record<string, unknown>) => string;
      };
      const adoc = factory();
      const body = adoc.convert(await input.text(), {
        // Standalone document (header, body, footer), so the output is
        // ready to drop into a browser without any wrapper template.
        standalone: true,
        // Skip toc/header_footer attributes that pull external resources;
        // we want a self-contained file.
        attributes: { showtitle: true, "source-highlighter": "highlight.js" },
      });
      html = body;
      opts?.onProgress?.(0.9);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render AsciiDoc",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default asciidocToHtml;
