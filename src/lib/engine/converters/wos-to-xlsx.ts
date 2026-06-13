import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseWos } from "../util/wos";
import { citationsToCsv } from "../util/citations-to-csv";
import { csvStringToXlsx } from "../util/csv-to-xlsx-buffer";

/**
 * Web of Science → XLSX. Parses the Web of Science / ISI tagged export into the
 * unified Citation model, then writes XLSX. The
 * format VOSviewer, bibliometrix, and CiteSpace read; import-only.
 */
const wosToXlsx: Converter = {
  id: "wos-to-xlsx",
  label: "Web of Science → XLSX",
  fromMime: ["text/plain", "application/x-inst-for-scientific-info"],
  accept: [".txt", ".ciw", ".isi"],
  toMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      const text = await input.text();
      const citations = parseWos(text);
      if (citations.length === 0) throw new Error("No references found in the Web of Science file");
      const csv = await citationsToCsv(citations);
      buf = await csvStringToXlsx(csv);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert Web of Science to XLSX",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename: swapExtension(input.name, "xlsx"),
    };
  },
};

export default wosToXlsx;
