import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseVcard, VCARD_COLUMNS } from "../util/vcard";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * VCF → XLSX. Same column shape as vcf-to-csv (one row per contact,
 * VCARD_COLUMNS as headers), wrapped in a real Excel workbook so
 * non-technical recipients can open it without an import wizard.
 */
const vcfToXlsx: Converter = {
  id: "vcf-to-xlsx",
  label: "VCF → XLSX",
  fromMime: ["text/vcard", "text/x-vcard", "text/plain"],
  accept: [".vcf", ".vcard"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const contacts = parseVcard(await input.text());
      if (contacts.length === 0) throw new Error("No contacts found in vCard file");
      const Papa = (await import("papaparse")).default;
      const csv = Papa.unparse(
        contacts.map((c) => Object.fromEntries(VCARD_COLUMNS.map((k) => [k, c[k]]))),
        { columns: VCARD_COLUMNS as string[] },
      );
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert vCard to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default vcfToXlsx;
