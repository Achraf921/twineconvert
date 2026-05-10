import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildOfx } from "../util/ofx-build";
import { parseQif } from "../util/qif-parse";

/**
 * QIF → OFX. Useful when moving from legacy Quicken (which exports QIF)
 * into modern personal-finance apps (Tiller, Monarch, Lunch Money,
 * GnuCash 4+) that prefer OFX.
 */
const qifToOfx: Converter = {
  id: "qif-to-ofx",
  label: "QIF → OFX",
  fromMime: ["application/qif", "text/plain"],
  toMime: "application/x-ofx",
  accept: [".qif"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ofx: string;
    try {
      const text = await input.text();
      const parsed = parseQif(text);
      ofx = buildOfx({ transactions: parsed.transactions, flavor: "ofx" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert QIF to OFX",
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

export default qifToOfx;
