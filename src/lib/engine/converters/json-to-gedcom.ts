import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildGedcom } from "../util/gedcom-build";
import type { ParsedGedcom } from "../util/gedcom-parse";
import { parseJsonInput } from "../util/parse-json-input";

const jsonToGedcom: Converter = {
  id: "json-to-gedcom",
  label: "JSON → GEDCOM",
  fromMime: ["application/json"],
  accept: [".json"],
  toMime: "application/x-gedcom",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let gedcom: string;
    try {
      const data = parseJsonInput(await input.text()) as ParsedGedcom;
      if (!data.individuals || !Array.isArray(data.individuals)) {
        throw new Error("JSON must contain an 'individuals' array");
      }
      // Default missing 'families' to empty since we tolerate sparse JSON.
      gedcom = buildGedcom({
        individuals: data.individuals,
        families: data.families ?? [],
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build GEDCOM from JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([gedcom], { type: "application/x-gedcom" }),
      filename: swapExtension(input.name, "ged"),
    };
  },
};

export default jsonToGedcom;
