import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePgn } from "../util/pgn-parse";

const pgnToJson: Converter = {
  id: "pgn-to-json",
  label: "PGN → JSON",
  fromMime: ["application/x-chess-pgn", "text/plain"],
  accept: [".pgn"],
  toMime: "application/json",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let json: string;
    try {
      const text = await input.text();
      const games = await parsePgn(text);
      // Strip the raw PGN block from the output to keep JSON size sane ,
      // users who want the original bytes already have the input file.
      const compact = games.map(({ headers, moves, finalFen, result }) => ({
        headers,
        moves,
        finalFen,
        result,
      }));
      json = JSON.stringify(compact, null, 2);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse PGN",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([json], { type: "application/json" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default pgnToJson;
