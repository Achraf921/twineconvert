import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseFinanceCsv } from "../util/finance-csv";
import { buildOfx } from "../util/ofx-build";

const csvToQbo: Converter = {
  id: "csv-to-qbo",
  label: "CSV → QBO",
  fromMime: ["text/csv", "application/csv"],
  toMime: "application/vnd.intu.qbo",
  accept: [".csv"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let qbo: string;
    try {
      const text = await input.text();
      const transactions = await parseFinanceCsv(text);
      if (transactions.length === 0) {
        throw new Error("No valid transactions found in CSV");
      }
      qbo = buildOfx({ transactions, flavor: "qbo" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build QBO from CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([qbo], { type: "application/vnd.intu.qbo" }),
      filename: swapExtension(input.name, "qbo"),
    };
  },
};

export default csvToQbo;
