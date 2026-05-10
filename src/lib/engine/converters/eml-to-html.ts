import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEml } from "../util/email-parse";
import { renderEmailHtml } from "./eml-to-pdf";

const emlToHtml: Converter = {
  id: "eml-to-html",
  label: "EML → HTML",
  fromMime: ["message/rfc822", "text/plain"],
  accept: [".eml"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const text = await input.text();
      const email = await parseEml(text);
      const body = await renderEmailHtml(email);
      // Wrap in a full document so it's openable in a browser standalone.
      html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(email.subject ?? "Email")}</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem;">
${body}
</body>
</html>`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse EML",
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
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export default emlToHtml;
