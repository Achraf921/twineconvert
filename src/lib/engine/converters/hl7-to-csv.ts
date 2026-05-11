import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { hl7ToRows, parseHl7 } from "../util/hl7";

const hl7ToCsv: Converter = {
  id: "hl7-to-csv",
  label: "HL7 → CSV",
  fromMime: ["application/hl7-v2", "text/plain"],
  accept: [".hl7", ".txt"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const segments = parseHl7(await input.text());
      const { headers, rows } = hl7ToRows(segments);
      csv = Papa.unparse({ fields: headers, data: rows }, { newline: "\n" });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert HL7 to CSV",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv + "\n"], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default hl7ToCsv;
