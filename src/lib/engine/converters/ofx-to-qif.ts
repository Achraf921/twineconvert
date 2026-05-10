import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseOfx } from "../util/ofx-parse";
import { buildQif } from "../util/qif-build";

/**
 * OFX → QIF. Useful when migrating from a modern bank that exports OFX
 * into legacy software (older Quicken builds, GnuCash QIF importers,
 * MS Money successors) that only reads QIF.
 */
const ofxToQif: Converter = {
  id: "ofx-to-qif",
  label: "OFX → QIF",
  fromMime: ["application/x-ofx", "text/plain"],
  toMime: "application/qif",
  accept: [".ofx"],
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let qif: string;
    try {
      const text = await input.text();
      const parsed = parseOfx(text);
      qif = buildQif(parsed.transactions);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert OFX to QIF",
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

export default ofxToQif;
