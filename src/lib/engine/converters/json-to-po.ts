import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildPo, type PoEntry } from "../util/po";
import { parseJsonInput } from "../util/parse-json-input";

const jsonToPo: Converter = {
  id: "json-to-po",
  label: "JSON → PO",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/x-gettext-translation",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      if (!Array.isArray(parsed)) {
        throw new Error(
          "Top-level value must be a JSON array of translation entries (objects with `msgid` and `msgstr`).",
        );
      }
      const entries = parsed.map((raw, i) => {
        if (typeof raw !== "object" || raw === null || !("msgid" in raw)) {
          throw new Error(`Entry at index ${i} is missing the required \`msgid\` field.`);
        }
        return raw as PoEntry;
      });
      out = buildPo(entries);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert JSON to PO",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/x-gettext-translation;charset=utf-8" }),
      filename: swapExtension(input.name, "po"),
    };
  },
};

export default jsonToPo;
