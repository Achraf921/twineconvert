import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { validateCff } from "../util/cff";

/**
 * CITATION.cff completeness check. Reports whether a CITATION.cff file has the
 * fields the Citation File Format spec requires (cff-version, message, title,
 * and at least one author), the same check GitHub runs before showing the
 * "Cite this repository" widget. Output is a plain-text report; the input is
 * not modified.
 */
const cffValidate: Converter = {
  id: "cff-validate",
  label: "CFF Validate",
  fromMime: ["application/x-yaml", "text/yaml", "text/plain"],
  accept: [".cff", ".yaml", ".yml"],
  toMime: "text/plain",
  maxFileSizeBytes: 25 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      out = await validateCff(await input.text());
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not validate the CITATION.cff file",
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

export default cffValidate;
