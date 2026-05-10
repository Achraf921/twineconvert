import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parsePgn } from "../util/pgn-parse";

/**
 * PGN → CSV. One row per game with the standard 7-tag PGN headers
 * (Event, Site, Date, Round, White, Black, Result) plus White/BlackElo,
 * ECO, opening, plus move count and final FEN.
 *
 * The full move list is included as a single concatenated column —
 * trying to pivot moves into per-ply columns blows up CSV width
 * (a 60-move game = 120 columns). Users analyzing move sequences
 * should use the JSON output instead.
 */
const pgnToCsv: Converter = {
  id: "pgn-to-csv",
  label: "PGN → CSV",
  fromMime: ["application/x-chess-pgn", "text/plain"],
  accept: [".pgn"],
  toMime: "text/csv",
  maxFileSizeBytes: 100 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const text = await input.text();
      const games = await parsePgn(text);
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        games.map((g) => ({
          Event: g.headers.Event ?? "",
          Site: g.headers.Site ?? "",
          Date: g.headers.Date ?? "",
          Round: g.headers.Round ?? "",
          White: g.headers.White ?? "",
          Black: g.headers.Black ?? "",
          Result: g.result,
          WhiteElo: g.headers.WhiteElo ?? "",
          BlackElo: g.headers.BlackElo ?? "",
          ECO: g.headers.ECO ?? "",
          Opening: g.headers.Opening ?? "",
          TimeControl: g.headers.TimeControl ?? "",
          Termination: g.headers.Termination ?? "",
          Plies: g.moves.length,
          Moves: g.moves.join(" "),
          FinalFEN: g.finalFen,
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not parse PGN",
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

export default pgnToCsv;
