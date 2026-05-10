import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAppleHealth } from "../util/apple-health-parse";

const appleHealthToJson: Converter = {
  id: "apple-health-to-json",
  label: "Apple Health → JSON",
  fromMime: ["application/zip", "text/xml", "application/xml"],
  toMime: "application/json",
  accept: [".zip", ".xml"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.02);
    let json: string;
    try {
      const exported = await parseAppleHealth(input, {
        onProgress: (p) => opts?.onProgress?.(0.05 + p * 0.85),
      });
      json = JSON.stringify(exported, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse Apple Health export",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name.replace(/\.zip$/i, ".xml"), "json"),
    };
  },
};

export default appleHealthToJson;
