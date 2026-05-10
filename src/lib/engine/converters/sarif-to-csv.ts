import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseSarif } from "../util/sarif";

const sarifToCsv: Converter = {
  id: "sarif-to-csv",
  label: "SARIF → CSV",
  fromMime: ["application/sarif+json", "application/json"],
  accept: [".sarif", ".json"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const findings = parseSarif(await input.text());
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        findings.map((f) => ({
          tool: f.tool,
          toolVersion: f.toolVersion ?? "",
          ruleId: f.ruleId,
          ruleName: f.ruleName ?? "",
          level: f.level,
          message: f.message,
          file: f.uri ?? "",
          startLine: f.startLine ?? "",
          startColumn: f.startColumn ?? "",
          endLine: f.endLine ?? "",
          endColumn: f.endColumn ?? "",
          snippet: f.snippet ?? "",
          helpUri: f.helpUri ?? "",
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse SARIF",
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

export default sarifToCsv;
