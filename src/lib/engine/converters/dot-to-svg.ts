import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderDotToSvg } from "../util/graphviz";

/**
 * DOT → SVG. DOT is the Graphviz source language for directed and
 * undirected graphs (CS textbooks, dependency diagrams, RFC docs).
 * Renders to vector SVG via the upstream Graphviz dot engine compiled
 * to WebAssembly. Output is a self-contained SVG you can embed
 * anywhere, scale to any size, or edit in Inkscape.
 */
const dotToSvg: Converter = {
  id: "dot-to-svg",
  label: "DOT → SVG",
  fromMime: [
    "text/plain",
    "text/x-graphviz",
    "text/vnd.graphviz",
    "application/x-graphviz",
  ],
  accept: [".dot", ".gv", ".graphviz", ".txt"],
  toMime: "image/svg+xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let svg: string;
    try {
      svg = await renderDotToSvg(await input.text());
      opts?.onProgress?.(0.9);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render DOT",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      filename: swapExtension(input.name, "svg"),
    };
  },
};

export default dotToSvg;
