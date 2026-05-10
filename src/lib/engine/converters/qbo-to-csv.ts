import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { transactionsToCsv } from "../util/finance-csv";
import { parseOfx } from "../util/ofx-parse";

/**
 * QBO (QuickBooks Web Connect) is OFX 2.x with a QuickBooks-specific
 * header processing instruction. The transaction body parses identically.
 */
const qboToCsv: Converter = {
  id: "qbo-to-csv",
  label: "QBO → CSV",
  fromMime: ["application/vnd.intu.qbo", "application/x-ofx", "text/plain"],
  toMime: "text/csv",
  accept: [".qbo"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const parsed = parseOfx(text);
      csv = await transactionsToCsv(parsed.transactions);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse QBO",
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

export default qboToCsv;
