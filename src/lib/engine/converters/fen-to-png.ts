import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * FEN → PNG. Renders the position as a chessboard image so people can
 * paste a diagram into notes, posts, or analysis without a chess GUI.
 * Pieces are drawn with Unicode chess glyphs (no image assets / fonts to
 * ship). chess.js validates the FEN first so a malformed string errors
 * clearly instead of producing a wrong board.
 *
 * Canvas-only: runs in the browser (and the Playwright browser tests),
 * never server-side.
 */

const SQUARE = 72;
const BOARD = SQUARE * 8;
const LIGHT = "#EEEED2";
const DARK = "#769656";

const GLYPH: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const fenToPng: Converter = {
  id: "fen-to-png",
  label: "FEN → PNG",
  fromMime: ["text/plain", "application/x-fen"],
  accept: [".fen", ".txt"],
  toMime: "image/png",
  maxFileSizeBytes: 1 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let blob: Blob;
    try {
      const { Chess } = await import("chess.js");
      const fen = (await input.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0 && !l.startsWith("#"));
      if (!fen) throw new Error("No FEN found in input");
      // Validates the FEN; throws on malformed input.
      new Chess(fen);
      const placement = fen.split(/\s+/)[0];
      const ranks = placement.split("/");
      if (ranks.length !== 8) throw new Error("FEN board must have 8 ranks");

      const canvas = document.createElement("canvas");
      canvas.width = BOARD;
      canvas.height = BOARD;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          ctx.fillStyle = (r + f) % 2 === 0 ? LIGHT : DARK;
          ctx.fillRect(f * SQUARE, r * SQUARE, SQUARE, SQUARE);
        }
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.floor(SQUARE * 0.8)}px "DejaVu Sans", "Arial Unicode MS", sans-serif`;
      for (let r = 0; r < 8; r++) {
        let file = 0;
        for (const ch of ranks[r]) {
          if (/\d/.test(ch)) {
            file += Number(ch);
            continue;
          }
          const glyph = GLYPH[ch];
          if (glyph) {
            ctx.fillStyle = ch === ch.toUpperCase() ? "#ffffff" : "#000000";
            ctx.strokeStyle = ch === ch.toUpperCase() ? "#000000" : "#ffffff";
            ctx.lineWidth = 2;
            const x = file * SQUARE + SQUARE / 2;
            const y = r * SQUARE + SQUARE / 2;
            ctx.strokeText(glyph, x, y);
            ctx.fillText(glyph, x, y);
          }
          file += 1;
        }
      }

      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (!b) {
            reject(new Error("Canvas could not encode PNG"));
            return;
          }
          resolve(b);
        }, "image/png");
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert FEN to PNG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob,
      filename: swapExtension(input.name, "png"),
    };
  },
};

export default fenToPng;
