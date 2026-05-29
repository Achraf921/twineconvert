import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseFastq } from "../util/fasta";

/**
 * FASTQ → JSON. FASTQ is the standard short-read sequencing format
 * (Illumina, MGI, PacBio output). Each record has a sequence plus a
 * per-base Phred quality string. JSON output is { id, description,
 * sequence, quality }, ready for any pipeline (pandas, BigQuery, R).
 */
const fastqToJson: Converter = {
  id: "fastq-to-json",
  label: "FASTQ → JSON",
  fromMime: [
    "text/plain",
    "application/x-fastq",
    "chemical/x-fastq",
  ],
  accept: [".fastq", ".fq", ".txt"],
  toMime: "application/json",
  maxFileSizeBytes: 500 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const records = parseFastq(await input.text());
      json = JSON.stringify(records, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse FASTQ",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default fastqToJson;
