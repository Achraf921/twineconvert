import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseFinanceCsv } from "../util/finance-csv";
import { buildOfx } from "../util/ofx-build";

const csvToOfx: Converter = {
  id: "csv-to-ofx",
  label: "CSV → OFX",
  fromMime: ["text/csv", "application/csv"],
  toMime: "application/x-ofx",
  accept: [".csv"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ofx: string;
    try {
      const text = await input.text();
      const transactions = await parseFinanceCsv(text);
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in CSV");
      }
      ofx = buildOfx({ transactions, flavor: "ofx" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build OFX from CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([ofx], { type: "application/x-ofx" }),
      filename: swapExtension(input.name, "ofx"),
    };
  },
};

export default csvToOfx;
