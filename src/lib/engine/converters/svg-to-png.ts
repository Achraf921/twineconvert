import type { Converter } from "../types";
import { canvasEncode, swapExtension } from "../util/canvas-encode";

const svgToPng: Converter = {
  id: "svg-to-png",
  label: "SVG → PNG",
  fromMime: ["image/svg+xml"],
  toMime: "image/png",
  accept: [".svg"],

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    // Canvas can rasterize an SVG via Image src=blobURL. The result is
    // sized at the SVG's intrinsic dimensions (viewBox / width/height).
    // For high-DPI export we'd accept a `scale` option later; v1 ships
    // 1:1 to keep behavior predictable.
    const blob = await canvasEncode(input, { toMime: "image/png" });
    opts?.onProgress?.(1);
    return { blob, filename: swapExtension(input.name, "png") };
  },
};

export default svgToPng;
