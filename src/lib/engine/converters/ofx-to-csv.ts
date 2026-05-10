import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { transactionsToCsv } from "../util/finance-csv";
import { parseOfx } from "../util/ofx-parse";

const ofxToCsv: Converter = {
  id: "ofx-to-csv",
  label: "OFX → CSV",
  fromMime: ["application/x-ofx", "application/vnd.intu.qbo", "text/plain"],
  toMime: "text/csv",
  accept: [".ofx"],
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
        err instanceof Error ? err.message : "Could not parse OFX",
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

export default ofxToCsv;
