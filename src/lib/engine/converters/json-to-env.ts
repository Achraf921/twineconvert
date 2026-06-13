import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildEnv } from "../util/dotenv";
import { parseJsonInput } from "../util/parse-json-input";

const jsonToEnv: Converter = {
  id: "json-to-env",
  label: "JSON → .env",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/plain",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error(".env requires a flat top-level object of key/value pairs");
      }
      // Reject nested objects — .env is a flat namespace
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "object" && v !== null) {
          throw new Error(`.env can't represent nested objects (key: "${k}")`);
        }
      }
      out = buildEnv(parsed as Record<string, unknown>);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to .env",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "env"),
    };
  },
};

export default jsonToEnv;
