import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGedcom } from "../util/gedcom-parse";
import { renderTextPdf, type PdfTextSection } from "../util/jspdf-text";

/**
 * GEDCOM → PDF. Searchable family-tree document — every individual is
 * a section with their name as the heading and life dates as metadata.
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

      const sections: PdfTextSection[] = individuals.map((i) => {
        const meta: string[] = [];
        if (i.birthDate) meta.push(`Born: ${i.birthDate}`);
        if (i.deathDate) meta.push(`Died: ${i.deathDate}`);
        if (i.sex) meta.push(`Sex: ${i.sex}`);
        return {
          heading: i.name ?? i.id,
          meta,
          body: "",
        };
      });

      blob = await renderTextPdf(sections, {
        title: `Family Tree (${individuals.length} individuals)`,
      });
      opts?.onProgress?.(0.95);
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

export default gedcomToPdf;
