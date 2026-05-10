import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePgn } from "../util/pgn-parse";

/**
 * PGN → FEN. Outputs the FEN string for the FINAL position of each game,
 * one per line. For games where a tactical engine analysis is desired
 * mid-game, users typically want the per-move FEN list, that's the
 * JSON output's role; this route is the simplest "what's the position
 * at the end" answer.
 */
const pgnToFen: Converter = {
  id: "pgn-to-fen",
  label: "PGN → FEN",
  fromMime: ["application/x-chess-pgn", "text/plain"],
  accept: [".pgn"],
  toMime: "text/plain",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let fen: string;
    try {
      const text = await input.text();
      const games = await parsePgn(text);
      fen = games.map((g) => g.finalFen).join("\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse PGN",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([fen], { type: "text/plain;charset=utf-8" }),
      filename: swapExtension(input.name, "fen"),
    };
  },
};

export default pgnToFen;
