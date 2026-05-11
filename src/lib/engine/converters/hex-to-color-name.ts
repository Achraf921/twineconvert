import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseHexLines } from "../util/color-math";
import { hexToNearestName } from "../util/css-color-names";

const hexToColorName: Converter = {
  id: "hex-to-color-name",
  label: "HEX → Color name",
  fromMime: ["text/plain"],
  accept: [".txt", ".hex"],
  toMime: "text/plain",
  maxFileSizeBytes: 1 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const hexes = parseHexLines(await input.text());
      if (hexes.length === 0) throw new Error("No hex colors found in input");
      out = hexes.map((h) => hexToNearestName(h)).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HEX to color name",
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

export default hexToColorName;
