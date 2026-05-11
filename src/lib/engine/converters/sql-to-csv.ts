import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSqlDump } from "../util/sql";

const sqlToCsv: Converter = {
  id: "sql-to-csv",
  label: "SQL → CSV",
  fromMime: ["application/sql", "text/plain"],
  accept: [".sql"],
  toMime: "text/csv",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const Papa = (await import("papaparse")).default;
      const table = parseSqlDump(await input.text());
      csv = Papa.unparse(
        {
          fields: table.columns,
          data: table.rows.map((r) => r.map((v) => (v == null ? "" : v))),
        },
        { newline: "\n" }, // see markdown-table-to-csv for the CRLF/LF bug
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert SQL to CSV",
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

export default sqlToCsv;
