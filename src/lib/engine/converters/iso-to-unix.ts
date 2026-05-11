import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * ISO 8601 → Unix timestamp (in seconds). Anything that `Date.parse()`
 * can handle works — full ISO 8601 with `Z` or numeric offsets, the looser
 * RFC 2822 form, and date-only strings (interpreted as UTC midnight).
 */
const isoToUnix: Converter = {
  id: "iso-to-unix",
  label: "ISO 8601 → Unix timestamp",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lines = (await input.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) throw new Error("No date strings found");
      out =
        lines
          .map((l) => {
            const ms = Date.parse(l);
            if (Number.isNaN(ms)) {
              throw new Error(`Couldn't parse date: "${l}"`);
            }
            return String(Math.floor(ms / 1000));
          })
          .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ISO 8601 to Unix",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "txt"),
    };
  },
};

export default isoToUnix;
