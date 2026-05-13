import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePo } from "../util/po";

const poToJson: Converter = {
  id: "po-to-json",
  label: "PO → JSON",
  fromMime: ["text/plain", "text/x-gettext-translation", "application/x-gettext"],
  accept: [".po", ".pot"],
  toMime: "application/json",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const entries = parsePo(await input.text());
      if (entries.length === 0) {
        throw new Error(
          "No translation entries found. Make sure the file starts with `msgid` / `msgstr` blocks.",
        );
      }
      out = JSON.stringify(entries, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PO to JSON",
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

export default poToJson;
