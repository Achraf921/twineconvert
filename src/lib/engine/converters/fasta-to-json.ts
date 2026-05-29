import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseFasta } from "../util/fasta";

/**
 * FASTA → JSON. FASTA is the bioinformatics line-oriented format every
 * sequence database (NCBI GenBank, UniProt, Ensembl) exports. JSON is
 * what every modern pipeline (Python pandas, Node tooling, REST APIs)
 * consumes. Output is a flat array of { id, description, sequence }.
 */
const fastaToJson: Converter = {
  id: "fasta-to-json",
  label: "FASTA → JSON",
  fromMime: [
    "text/plain",
    "text/x-fasta",
    "application/x-fasta",
    "chemical/x-fasta",
  ],
  accept: [".fasta", ".fa", ".fna", ".faa", ".ffn", ".frn", ".txt"],
  toMime: "application/json",
  maxFileSizeBytes: 200 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const records = parseFasta(await input.text());
      json = JSON.stringify(records, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse FASTA",
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

export default fastaToJson;
