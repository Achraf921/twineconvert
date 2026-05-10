import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * DOCX → HTML via mammoth. Mammoth maps Word styles to semantic HTML
 * (Heading 1 → <h1>, etc.). It explicitly does NOT preserve every visual
 * detail, that's the point. Users who want pixel-perfect rendering need
 * a desktop tool.
 */
const docxToHtml: Converter = {
  id: "docx-to-html",
  label: "DOCX → HTML",
  fromMime: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  toMime: "text/html",
  accept: [".docx"],
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await input.arrayBuffer();
      // mammoth has separate code paths in Node vs browser builds.
      // The Node build's openZip expects {path|buffer|file}, the browser
      // build expects {arrayBuffer}. Passing both keys keeps both happy.
      const result = await mammoth.convertToHtml({ arrayBuffer, buffer: arrayBuffer } as Parameters<typeof mammoth.convertToHtml>[0]);
      html = result.value;
    } catch (err) {
      throw new ConvertFailedError(
        "Could not parse DOCX, file may be corrupt or password-protected",
        err,
      );
    }
    opts?.onProgress?.(1);

    // Wrap with a minimal HTML5 document so the output is browser-openable.
    const fullDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${input.name.replace(/\.docx$/i, "")}</title>
</head>
<body>
${html}
</body>
</html>`;

    return {
      blob: new Blob([fullDoc], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

export default docxToHtml;
