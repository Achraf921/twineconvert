import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseGedcom } from "../util/gedcom-parse";

const gedcomToJson: Converter = {
  id: "gedcom-to-json",
  label: "GEDCOM → JSON",
  fromMime: ["text/plain", "application/x-gedcom"],
  accept: [".ged", ".gedcom"],
  toMime: "application/json",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const text = await input.text();
      json = JSON.stringify(parseGedcom(text), null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse GEDCOM",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default gedcomToJson;
