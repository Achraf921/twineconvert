import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseEnv } from "../util/dotenv";

const envToJson: Converter = {
  id: "env-to-json",
  label: ".env → JSON",
  fromMime: ["text/plain", "application/x-env"],
  accept: [".env"],
  toMime: "application/json",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const obj = parseEnv(await input.text());
      out = JSON.stringify(obj, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert .env to JSON",
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

export default envToJson;
