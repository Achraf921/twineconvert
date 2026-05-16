import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseVcard, VCARD_COLUMNS } from "../util/vcard";

const vcfToCsv: Converter = {
  id: "vcf-to-csv",
  label: "VCF → CSV",
  fromMime: ["text/vcard", "text/x-vcard", "text/plain"],
  accept: [".vcf", ".vcard"],
  toMime: "text/csv",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const contacts = parseVcard(await input.text());
      if (contacts.length === 0) throw new Error("No contacts found in vCard file");
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        contacts.map((c) => Object.fromEntries(VCARD_COLUMNS.map((k) => [k, c[k]]))),
        { columns: VCARD_COLUMNS as string[] },
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert vCard to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default vcfToCsv;
