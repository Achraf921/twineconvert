import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { citationsFromCsv } from "../util/citation-csv";
import { buildRis } from "../util/ris";

const csvToRis: Converter = {
  id: "csv-to-ris",
  label: "CSV → RIS",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "application/x-research-info-systems",
  maxFileSizeBytes: 10 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let ris: string;
    try {
      const citations = await citationsFromCsv(await input.text());
      if (citations.length === 0) throw new Error("No citations found in CSV");
      ris = buildRis(citations);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert CSV to RIS",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([ris], { type: "application/x-research-info-systems" }),
      filename: swapExtension(input.name, "ris"),
    };
  },
};

export default csvToRis;
