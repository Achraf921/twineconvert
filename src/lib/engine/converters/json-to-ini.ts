import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

const jsonToIni: Converter = {
  id: "json-to-ini",
  label: "JSON → INI",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/x-ini",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const ini = await import("ini");
      const parsed: unknown = JSON.parse(await input.text());
      // INI doesn't support arrays as top-level values (only [section] -> key=val)
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("INI requires a top-level object (sections + key/value pairs)");
      }
      out = ini.stringify(parsed as Record<string, unknown>);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to INI",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "ini"),
    };
  },
};

export default jsonToIni;
