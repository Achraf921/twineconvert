import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { renderDotToSvg } from "../util/graphviz";
import { svgToPngBlob } from "../util/svg-raster";

/**
 * DOT → PNG. Same Graphviz pipeline as dot-to-svg, but rasterised to
 * PNG via the shared SVG-to-canvas helper. Use this when the embed
 * target requires a bitmap (Slack message previews, Notion image
 * blocks, legacy CMS image-only widgets) rather than scalable vectors.
 *
 * Browser-only: the canvas rasterisation step needs DOM.
 */
const dotToPng: Converter = {
  id: "dot-to-png",
  label: "DOT → PNG",
  fromMime: [
    "text/plain",
    "text/x-graphviz",
    "text/vnd.graphviz",
    "application/x-graphviz",
  ],
  accept: [".dot", ".gv", ".graphviz", ".txt"],
  toMime: "image/png",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let pngBlob: Blob;
    try {
      const svg = await renderDotToSvg(await input.text());
      opts?.onProgress?.(0.6);
      pngBlob = await svgToPngBlob(svg);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not render DOT to PNG",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: pngBlob,
      filename: swapExtension(input.name, "png"),
    };
  },
};

export default dotToPng;
