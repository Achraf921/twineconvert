import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGedcom } from "../util/gedcom-parse";
import { htmlToPdf } from "../util/jspdf-html";

/**
 * GEDCOM → PDF. Renders the same layout as the HTML route via jsPDF,
 * producing a single printable family tree document. For very large
 * trees (>500 individuals) the PDF can take a minute and balloon in
 * page count, there's no v1 pagination strategy beyond jsPDF's
 * autoPaging.
 */
const gedcomToPdf: Converter = {
  id: "gedcom-to-pdf",
  label: "GEDCOM → PDF",
  fromMime: ["text/plain", "application/x-gedcom"],
  accept: [".ged", ".gedcom"],
  toMime: "application/pdf",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const text = await input.text();
      const { individuals } = parseGedcom(text);

      const html = `<h1>Family Tree</h1>${individuals
        .map((i) => {
          const dates = [i.birthDate, i.deathDate].filter(Boolean).join(", ");
          return `<h2>${escapeHtml(i.name ?? i.id)}</h2><p>${escapeHtml(dates)}</p>`;
        })
        .join("")}`;

      blob = await htmlToPdf(html, {
        onProgress: (p) => opts?.onProgress?.(0.1 + p * 0.85),
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render GEDCOM PDF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "pdf") };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export default gedcomToPdf;
