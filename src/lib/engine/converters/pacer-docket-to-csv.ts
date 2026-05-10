import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePacerDocket } from "../util/pacer-docket";

const pacerDocketToCsv: Converter = {
  id: "pacer-docket-to-csv",
  label: "PACER docket → CSV",
  fromMime: ["text/html", "application/zip"],
  accept: [".html", ".htm", ".zip"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const parsed = await parsePacerDocket(input);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        parsed.entries.map((e) => ({
          date: e.date ?? "",
          number: e.number ?? "",
          description: e.description,
          documentUrl: e.documentUrl ?? "",
          caseCaption: parsed.caseCaption ?? "",
          court: parsed.court ?? "",
          judge: parsed.judge ?? "",
        })),
      );
      if (parsed.entries.length === 0) {
        throw new Error("No docket entries found — the HTML may not be a PACER docket sheet");
      }
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse PACER docket",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default pacerDocketToCsv;
