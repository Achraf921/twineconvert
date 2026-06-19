import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseMods } from "../util/mods";
import { renderCitationStyle } from "../util/csl-render";

/**
 * MODS → Nature. Parses a MODS export into the unified Citation
 * model, then renders a formatted Nature reference list with citeproc-js and
 * the official Nature CSL style. Plain text, one reference per paragraph.
 */
const modsToNature: Converter = {
  id: "mods-to-nature",
  label: "MODS → Nature",
  fromMime: ["application/mods+xml", "application/xml", "text/xml"],
  accept: [".xml", ".mods"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const citations = parseMods(await input.text());
      if (citations.length === 0) throw new Error("No references found in the MODS XML file");
      out = await renderCitationStyle(citations, "nature", "text");
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MODS to Nature",
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

export default modsToNature;
