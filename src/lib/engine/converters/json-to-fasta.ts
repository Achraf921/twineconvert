import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatFasta, type FastaRecord } from "../util/fasta";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON → FASTA. Accepts a flat array of { id, description, sequence }
 * records (the shape fasta-to-json emits) and writes a properly wrapped
 * FASTA file at 70 chars per sequence line (NCBI convention).
 */
const jsonToFasta: Converter = {
  id: "json-to-fasta",
  label: "JSON → FASTA",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/x-fasta",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      if (!Array.isArray(parsed)) {
        throw new Error(
          "JSON must be an array of { id, description, sequence } records.",
        );
      }
      const records: FastaRecord[] = parsed.map((r, i) => {
        const rec = r as Partial<FastaRecord>;
        if (!rec.id || typeof rec.sequence !== "string") {
          throw new Error(
            `Record ${i} missing required "id" or "sequence" field.`,
          );
        }
        return {
          id: String(rec.id),
          description: rec.description ?? "",
          sequence: rec.sequence,
        };
      });
      out = formatFasta(records);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode JSON as FASTA",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/x-fasta;charset=utf-8" }),
      filename: swapExtension(input.name, "fasta"),
    };
  },
};

export default jsonToFasta;
