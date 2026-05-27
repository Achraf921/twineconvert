import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseCsvFlex } from "../util/csv-parse-flex";

/**
 * CSV → HTML table. The shared parseCsvFlex helper handles delimiter
 * sniff (comma / semicolon / tab / pipe) and tolerates ragged rows,
 * which is the systemic CSV-import hardening shipped earlier.
 *
 * Output is a self-contained <!doctype html> page with a styled table
 * so it can be opened directly in a browser or pasted into a CMS.
 * HTML entities in the cell values are escaped at write time.
 */
const csvToHtml: Converter = {
  id: "csv-to-html",
  label: "CSV → HTML",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "text/html",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const { rows } = parseCsvFlex<string[]>(await input.text(), {
        header: false,
      });
      if (rows.length === 0) throw new Error("CSV has no rows");
      const [headerRow, ...bodyRows] = rows;
      const headers = headerRow.map(escapeHtml);
      const body = bodyRows
        .map(
          (r) =>
            "    <tr>" +
            headerRow
              .map((_, i) => `<td>${escapeHtml(String(r[i] ?? ""))}</td>`)
              .join("") +
            "</tr>",
        )
        .join("\n");
      html = renderTable(headers, body);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to HTML",
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
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTable(headers: string[], body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CSV</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; margin: 2rem; color: #111; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f6f6f6; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
</style>
</head>
<body>
<table>
  <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>
${body}
  </tbody>
</table>
</body>
</html>
`;
}

export default csvToHtml;
