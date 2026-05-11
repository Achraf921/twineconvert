import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { nameToHex } from "../util/css-color-names";

const colorNameToHex: Converter = {
  id: "color-name-to-hex",
  label: "Color name → HEX",
  fromMime: ["text/plain"],
  accept: [".txt"],
  toMime: "text/plain",
  maxFileSizeBytes: 1 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const lines = (await input.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith(";"));
      if (lines.length === 0) throw new Error("No color names found in input");
      out =
        lines
          .map((name) => {
            const hex = nameToHex(name);
            if (!hex) throw new Error(`Unknown CSS color name: "${name}"`);
            return hex;
          })
          .join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert color name to HEX",
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

export default colorNameToHex;
