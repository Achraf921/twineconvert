import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildDat } from "../util/edisco";

/**
 * CSV → Concordance DAT load file. Wraps every cell in the standard
 * `þ value þ` text qualifiers and uses the U+0014 field delimiter,
 * matching the format Concordance and Relativity expect for production
 * intake. Useful for preparing a custom-built CSV (from a legacy
 * database export or an ad-hoc spreadsheet) for upload into a
 * commercial review platform.
 */
const csvToDat: Converter = {
  id: "csv-to-dat",
  label: "CSV → DAT",
  fromMime: ["text/csv", "application/csv", "text/plain"],
  accept: [".csv"],
  toMime: "application/vnd.concordance-dat",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let dat: string;
    try {
      // Sniff the delimiter and tolerate FieldMismatch (ragged rows are
      // normal in real exports). Only an unparseable quote state is fatal.
      const { parseCsvFlex } = await import("../util/csv-parse-flex");
      const { rows: aoa } = parseCsvFlex<string[]>(await input.text(), {
        header: false,
      });
      if (aoa.length < 2) {
        throw new Error("CSV must have a header row and at least one data row");
      }
      dat = buildDat({ headers: aoa[0], rows: aoa.slice(1) });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to DAT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([dat], { type: "application/vnd.concordance-dat;charset=utf-8" }),
      filename: swapExtension(input.name, "dat"),
    };
  },
};

export default csvToDat;
