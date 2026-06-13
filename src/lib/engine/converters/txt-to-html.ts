import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Plain text → HTML. Escapes HTML-significant characters, wraps each
 * blank-line-separated block in a <p>, and turns single line breaks
 * inside a block into <br>. Produces a minimal, valid HTML5 document.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const txtToHtml: Converter = {
  id: "txt-to-html",
  label: "Text → HTML",
  fromMime: ["text/plain"],
  accept: [".txt", ".text"],
  toMime: "text/html",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const text = (await input.text()).replace(/\r\n?/g, "\n");
      if (!text.trim()) throw new Error("The text file is empty");
      const blocks = text
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter((b) => b.length > 0)
        .map((b) => `  <p>${escapeHtml(b).replace(/\n/g, "<br>\n     ")}</p>`)
        .join("\n");
      const title = escapeHtml(input.name.replace(/\.(txt|text)$/i, "")) || "Document";
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
${blocks || "  <p></p>"}
</body>
</html>
`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert text to HTML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default txtToHtml;
