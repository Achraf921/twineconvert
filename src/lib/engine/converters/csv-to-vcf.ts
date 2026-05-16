import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildVcard, contactFromRow } from "../util/vcard";

const csvToVcf: Converter = {
  id: "csv-to-vcf",
  label: "CSV → VCF",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "text/vcard",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let vcf: string;
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = Papa.parse<Record<string, string>>(await input.text(), {
        header: true,
        skipEmptyLines: true,
      });
      const rows = (parsed.data ?? []).filter(
        (r) => r && typeof r === "object" && Object.keys(r).length > 0,
      );
      if (rows.length === 0) throw new Error("No rows found in CSV");
      vcf = buildVcard(rows.map(contactFromRow));
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to vCard",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([vcf], { type: "text/vcard;charset=utf-8" }),
      filename: swapExtension(input.name, "vcf"),
    };
  },
};

export default csvToVcf;
