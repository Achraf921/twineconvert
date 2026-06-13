import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { formatFastq, type FastqRecord } from "../util/fasta";
import { parseJsonInput } from "../util/parse-json-input";

/**
 * JSON → FASTQ. Accepts a flat array of { id, description, sequence,
 * quality } records and emits the canonical 4-line-per-record FASTQ
 * format. Lengths of sequence and quality must match (we validate).
 */
const jsonToFastq: Converter = {
  id: "json-to-fastq",
  label: "JSON → FASTQ",
  fromMime: ["application/json", "text/plain"],
  accept: [".json"],
  toMime: "text/plain",
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const parsed: unknown = parseJsonInput(await input.text());
      if (!Array.isArray(parsed)) {
        throw new Error(
          "JSON must be an array of { id, description, sequence, quality } records.",
        );
      }
      const records: FastqRecord[] = parsed.map((r, i) => {
        const rec = r as Partial<FastqRecord>;
        if (!rec.id || typeof rec.sequence !== "string" || typeof rec.quality !== "string") {
          throw new Error(
            `Record ${i} missing required "id", "sequence", or "quality" field.`,
          );
        }
        if (rec.sequence.length !== rec.quality.length) {
          throw new Error(
            `Record ${i}: sequence (${rec.sequence.length}) and quality (${rec.quality.length}) length mismatch.`,
          );
        }
        return {
          id: String(rec.id),
          description: rec.description ?? "",
          sequence: rec.sequence,
          quality: rec.quality,
        };
      });
      out = formatFastq(records);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not encode JSON as FASTQ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "fastq"),
    };
  },
};

export default jsonToFastq;
