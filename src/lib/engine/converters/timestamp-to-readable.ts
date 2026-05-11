import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Unix timestamp (or ISO 8601) → human-readable UTC string like
 * `Mon, 15 Jan 2024 14:30:00 UTC`. Useful for log diffing and inspecting
 * dumps where timestamps are stored as integers.
 *
 * Output is always UTC and locale-independent so that cross-region teams
 * see identical strings (the whole point of normalization tools).
 */
const timestampToReadable: Converter = {
  id: "timestamp-to-readable",
  label: "Timestamp → Readable date",
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
      if (lines.length === 0) throw new Error("No timestamps found");
      out =
        lines
          .map((l) => {
            // Numeric → unix (seconds or ms auto-detect); otherwise parse as ISO
            let ms: number;
            if (/^-?\d+(\.\d+)?$/.test(l)) {
              const n = parseFloat(l);
              ms = Math.abs(n) > 1e11 ? n : n * 1000;
            } else {
              ms = Date.parse(l);
            }
            if (Number.isNaN(ms)) {
              throw new Error(`Couldn't parse timestamp: "${l}"`);
            }
            const d = new Date(ms);
            // toUTCString() format: "Mon, 15 Jan 2024 14:30:00 GMT" — replace
            // GMT with UTC for clarity (they mean the same thing here)
            return d.toUTCString().replace(/ GMT$/, " UTC");
          })
          .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert timestamp to readable",
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

export default timestampToReadable;
