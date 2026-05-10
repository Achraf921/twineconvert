import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseFinanceCsv } from "../util/finance-csv";
import { buildQif } from "../util/qif-build";

const csvToQif: Converter = {
  id: "csv-to-qif",
  label: "CSV → QIF",
  fromMime: ["text/csv", "application/csv"],
  toMime: "application/qif",
  accept: [".csv"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let qif: string;
    try {
      const text = await input.text();
      const transactions = await parseFinanceCsv(text);
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in CSV");
      }
      qif = buildQif(transactions);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build QIF from CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([qif], { type: "application/qif" }),
      filename: swapExtension(input.name, "qif"),
    };
  },
};

export default csvToQif;
