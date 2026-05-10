/**
 * PGN (Portable Game Notation) parser. PGN is the universal format for
 * chess games, used by chess.com, lichess, ChessBase, every chess engine.
 *
 * Format is plaintext with two parts per game:
 *
 *   [Event "World Championship 2024"]
 *   [Site "London"]
 *   [White "Magnus Carlsen"]
 *   [Black "Hikaru Nakamura"]
 *   [Result "1-0"]
 *
 *   1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0
 *
 * A single PGN file can contain hundreds of games separated by blank lines.
 * We parse the headers via regex (they're well-structured) and the
 * move text via chess.js (which validates moves and produces FEN
 * positions for any point in the game).
 */

import type { Chess } from "chess.js";

export interface PgnGame {
  headers: Record<string, string>;
  /** SAN moves in order, e.g. ["e4", "e5", "Nf3", "Nc6", ...]. */
  moves: string[];
  /** Final FEN position after the last move. */
  finalFen: string;
  /** Result tag: "1-0" / "0-1" / "1/2-1/2" / "*". */
  result: string;
  /** Original PGN text for this game (useful for split/merge tools). */
  raw: string;
}

const HEADER_RE = /\[(\w+)\s+"([^"]*)"\]/g;

/** Split a multi-game PGN into individual game blocks. */
function splitGames(text: string): string[] {
  // Game boundaries: a [Event ...] tag at the start of a line that comes
  // AFTER a result token (1-0, 0-1, 1/2-1/2, *). chess.js handles the
  // edge cases for us if we feed games one at a time.
  const games: string[] = [];
  const lines = text.split(/\r?\n/);
  let buffer: string[] = [];
  let lastNonBlank = "";
  for (const line of lines) {
    if (line.trim().startsWith("[Event ") && buffer.length > 0 && /(?:1-0|0-1|1\/2-1\/2|\*)\s*$/.test(lastNonBlank)) {
      games.push(buffer.join("\n").trim());
      buffer = [];
    }
    buffer.push(line);
    if (line.trim()) lastNonBlank = line.trim();
  }
  if (buffer.length > 0 && buffer.join("").trim()) games.push(buffer.join("\n").trim());
  return games;
}

export async function parsePgn(text: string): Promise<PgnGame[]> {
  const { Chess } = await import("chess.js");
  const blocks = splitGames(text);
  const games: PgnGame[] = [];

  for (const block of blocks) {
    const headers: Record<string, string> = {};
    for (const m of block.matchAll(HEADER_RE)) {
      headers[m[1]] = m[2];
    }
    const chess: Chess = new Chess();
    let moves: string[] = [];
    let finalFen = chess.fen();
    try {
      chess.loadPgn(block);
      moves = chess.history();
      finalFen = chess.fen();
    } catch {
      // Bad PGN block, skip it but don't fail the whole batch.
      continue;
    }
    games.push({
      headers,
      moves,
      finalFen,
      result: headers.Result ?? "*",
      raw: block,
    });
  }
  return games;
}
