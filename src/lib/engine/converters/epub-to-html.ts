import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { extractEpub } from "../util/epub-extract";

/**
 * EPUB → HTML. Concatenates all chapter HTMLs into a single document
 * separated by <hr/> markers. Embedded images are NOT extracted (each
 * chapter's <img src="..."> still references zip-relative paths) — full
 * asset bundling would mean returning a ZIP, which is a different tool.
 */
const epubToHtml: Converter = {
  id: "epub-to-html",
  label: "EPUB → HTML",
  fromMime: ["application/epub+zip"],
  toMime: "text/html",
  accept: [".epub"],
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let combinedHtml: string;
    try {
      const extracted = await extractEpub(input);
      // Strip <html>/<head>/<body> wrappers from each chapter — we provide
      // our own outer document. Crude regex is fine here since EPUB chapters
      // are well-formed XHTML by spec.
      const inner = extracted.chaptersHtml
        .map((html) => {
          const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          return m ? m[1] : html;
        })
        .join('\n<hr style="page-break-after: always;"/>\n');
      combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${extracted.title}</title>
</head>
<body>
${inner}
</body>
</html>`;
    } catch (err) {
      throw new ConvertFailedError("Could not parse EPUB", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([combinedHtml], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default epubToHtml;
