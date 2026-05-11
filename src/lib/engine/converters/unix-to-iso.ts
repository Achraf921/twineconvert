import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Unix timestamp → ISO 8601. Auto-detects seconds vs milliseconds: any
 * value > 10^11 is treated as ms (otherwise the year would be ~5138 AD,
 * which is essentially never what the user means).
 */
const unixToIso: Converter = {
  id: "unix-to-iso",
  label: "Unix timestamp → ISO 8601",
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
        .filter((l) => l && /^-?\d+(\.\d+)?$/.test(l));
      if (lines.length === 0) throw new Error("No numeric timestamps found");
      out =
        lines
          .map((l) => {
            const n = parseFloat(l);
            const ms = Math.abs(n) > 1e11 ? n : n * 1000;
            const d = new Date(ms);
            if (Number.isNaN(d.getTime())) {
              throw new Error(`Invalid timestamp: ${l}`);
            }
            return d.toISOString();
          })
          .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Unix to ISO 8601",
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

export default unixToIso;
