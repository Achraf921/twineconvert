import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * FEN → PGN. A FEN is a single static position; the PGN equivalent is a
 * game with no moves that starts FROM that position, i.e. the SetUp/FEN
 * header tags. chess.js validates the FEN (rejecting malformed input)
 * and emits a standards-compliant PGN that engines and GUIs load as the
 * starting position. One PGN per non-empty input line.
 */
const fenToPgn: Converter = {
  id: "fen-to-pgn",
  label: "FEN → PGN",
  fromMime: ["text/plain", "application/x-fen"],
  accept: [".fen", ".txt"],
  toMime: "application/x-chess-pgn",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let pgn: string;
    try {
      const { Chess } = await import("chess.js");
      const lines = (await input.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"));
      if (lines.length === 0) throw new Error("No FEN found in input");
      // Per-line tolerance: a single garbage line in a multi-FEN file
      // used to fail the whole conversion. Skip invalid lines and only
      // error if NO line produced a valid PGN.
      const games: string[] = [];
      const skipped: string[] = [];
      for (const fen of lines) {
        try {
          const chess = new Chess(fen);
          chess.header("SetUp", "1", "FEN", fen);
          games.push(chess.pgn());
        } catch {
          skipped.push(fen);
        }
      }
      if (games.length === 0) {
        throw new Error(
          `No valid FEN found. Skipped ${skipped.length} line${skipped.length === 1 ? "" : "s"}. ` +
            "A FEN looks like 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' — eight ranks separated by slashes.",
        );
      }
      pgn = games.join("\n\n") + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FEN to PGN",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([pgn], { type: "application/x-chess-pgn" }),
      filename: swapExtension(input.name, "pgn"),
    };
  },
};

export default fenToPgn;
