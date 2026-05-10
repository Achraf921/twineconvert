import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildAdif, type AdifQso } from "../util/adif";

const csvToAdif: Converter = {
  id: "csv-to-adif",
  label: "CSV → ADIF",
  fromMime: ["text/csv", "application/csv"],
  accept: [".csv"],
  toMime: "application/x-adif",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let adif: string;
    try {
      const Papa = (await import("papaparse")).default;
      const text = await input.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      const qsos: AdifQso[] = parsed.data.map((row) => {
        const fields: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          if (v && String(v).trim()) fields[k.toUpperCase()] = String(v).trim();
        }
        return { fields };
      });
      adif = buildAdif({ header: {}, qsos });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not build ADIF",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([adif], { type: "application/x-adif" }),
      filename: swapExtension(input.name, "adi"),
    };
  },
};

export default csvToAdif;
