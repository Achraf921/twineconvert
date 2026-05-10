import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseFinanceCsv } from "../util/finance-csv";
import { buildOfx } from "../util/ofx-build";

const csvToQfx: Converter = {
  id: "csv-to-qfx",
  label: "CSV → QFX",
  fromMime: ["text/csv", "application/csv"],
  toMime: "application/vnd.intu.qfx",
  accept: [".csv"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let qfx: string;
    try {
      const text = await input.text();
      const transactions = await parseFinanceCsv(text);
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in CSV");
      }
      qfx = buildOfx({ transactions, flavor: "qfx" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build QFX from CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([qfx], { type: "application/vnd.intu.qfx" }),
      filename: swapExtension(input.name, "qfx"),
    };
  },
};

export default csvToQfx;
