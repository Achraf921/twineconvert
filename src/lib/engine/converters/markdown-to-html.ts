import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Markdown → HTML via marked. Output is wrapped in a minimal HTML5
 * document so the result is directly viewable in a browser. We don't
 * enable any of marked's HTML-passthrough modes that would let
 * embedded `<script>` tags fire; user-supplied input is treated as
 * markdown text only.
 */
const markdownToHtml: Converter = {
  id: "markdown-to-html",
  label: "Markdown → HTML",
  fromMime: ["text/markdown", "text/x-markdown", "text/plain"],
  accept: [".md", ".markdown"],
  toMime: "text/html",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const { marked } = await import("marked");
      const body = await marked.parse(await input.text(), {
        async: true,
        breaks: false,
        gfm: true,
      });
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(input.name.replace(/\.(md|markdown)$/i, ""))}</title>
  <style>
    body { max-width: 760px; margin: 2rem auto; padding: 0 1rem;
           font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           color: #1a1a1a; }
    code, pre { background: #f5f5f5; border-radius: 4px; padding: 0.1em 0.3em; }
    pre { padding: 1em; overflow-x: auto; }
    h1, h2, h3 { line-height: 1.2; }
    blockquote { border-left: 3px solid #ddd; margin-left: 0;
                 padding-left: 1em; color: #555; }
    img { max-width: 100%; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 0.4em 0.8em; }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Markdown",
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

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default:  return c;
    }
  });
}

export default markdownToHtml;
