import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const iniToJson: Converter = {
  id: "ini-to-json",
  label: "INI → JSON",
  fromMime: ["text/plain", "application/x-ini"],
  accept: [".ini", ".cfg", ".conf"],
  toMime: "application/json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const ini = await import("ini");
      const parsed = ini.parse(await input.text());
      out = JSON.stringify(parsed, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert INI to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default iniToJson;
