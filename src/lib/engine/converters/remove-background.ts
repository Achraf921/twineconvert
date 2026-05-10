import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Background removal via @imgly/background-removal — runs an ONNX
 * segmentation model entirely in-browser. First-call cost is the
 * ~30MB model download (cached by the browser thereafter), then a
 * few seconds per image depending on dimensions and CPU.
 *
 * The lib's API is `removeBackground(input)` → returns a Blob with
 * the alpha channel set so the subject is isolated. Output is PNG
 * because JPEG can't carry transparency.
 */
const removeBackground: Converter = {
  id: "remove-background",
  label: "Remove Background",
  fromMime: ["image/png", "image/jpeg", "image/webp"],
  accept: [".png", ".jpg", ".jpeg", ".webp"],
  toMime: "image/png",
  maxFileSizeBytes: 30 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let blob: Blob;
    try {
      const { removeBackground: removeBg } = await import("@imgly/background-removal");
      blob = await removeBg(input, {
        progress: (key, current, total) => {
          // The lib reports both download progress (model fetch) and
          // segmentation progress in different "key" namespaces. We
          // collapse them into a single 0..1 fraction.
          if (total > 0) {
            opts?.onProgress?.(0.1 + (current / total) * 0.85);
          }
        },
      });
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Background removal failed",
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

export default removeBackground;
