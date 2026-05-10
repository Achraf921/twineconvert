import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { transactionsToCsv } from "../util/finance-csv";
import { parseOfx } from "../util/ofx-parse";

/**
 * QFX is structurally identical to OFX (Intuit's variant adds INTU.BID
 * and INTU.USERID tags but the transaction body is the same). One parser
 * handles both; the only difference is the file extension users land on.
 */
const qfxToCsv: Converter = {
  id: "qfx-to-csv",
  label: "QFX → CSV",
  fromMime: ["application/vnd.intu.qfx", "application/x-ofx", "text/plain"],
  toMime: "text/csv",
  accept: [".qfx"],
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
        err instanceof Error ? err.message : "Could not parse QFX",
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

export default qfxToCsv;
