import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildHl7, treeToHl7 } from "../util/hl7";
import { parseJsonInput } from "../util/parse-json-input";

const jsonToHl7: Converter = {
  id: "json-to-hl7",
  label: "JSON → HL7",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "application/hl7-v2",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("HL7 JSON must be an object keyed by segment type (MSH, PID, ...)");
      }
      const segments = treeToHl7(parsed as Record<string, unknown>);
      if (segments.length === 0 || segments[0].type !== "MSH") {
        throw new Error("HL7 messages must start with an MSH segment");
      }
      out = buildHl7(segments);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to HL7",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/hl7-v2;charset=utf-8" }),
      filename: swapExtension(input.name, "hl7"),
    };
  },
};

export default jsonToHl7;
