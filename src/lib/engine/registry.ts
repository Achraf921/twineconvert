import type { Converter } from "./types";

/**
 * Lazy converter registry.
 *
 * Each entry maps a tool id ("heic-to-jpg") to a function that imports the
 * converter module on demand. The dynamic `import()` lets the bundler
 * code-split each converter into its own chunk — meaning a user landing on
 * /heic-to-jpg only downloads heic2any, not FFmpeg.wasm + Tesseract + libheif
 * combined.
 *
 * Adding a new converter:
 *   1. Implement it under `./converters/<id>.ts`, default-exporting a Converter
 *   2. Add a single line to the map below
 *   3. Add a tool page at app/<id>/page.tsx (separate concern)
 *
 * The id MUST match the converter's own `id` field and the URL slug exactly.
 */

type ConverterLoader = () => Promise<Converter>;

export const registry: Record<string, ConverterLoader> = {
  // HEIC family — uses heic2any (decode via libheif under the hood)
  "heic-to-jpg": () =>
    import("./converters/heic-to-jpg").then((m) => m.default),
  "heic-to-png": () =>
    import("./converters/heic-to-png").then((m) => m.default),
  "heic-to-webp": () =>
    import("./converters/heic-to-webp").then((m) => m.default),

  // Canvas-based image format pairs (no extra deps — uses browser's
  // native decode + Canvas.toBlob for re-encoding)
  "jpg-to-png": () =>
    import("./converters/jpg-to-png").then((m) => m.default),
  "jpg-to-webp": () =>
    import("./converters/jpg-to-webp").then((m) => m.default),
  "png-to-jpg": () =>
    import("./converters/png-to-jpg").then((m) => m.default),
  "png-to-webp": () =>
    import("./converters/png-to-webp").then((m) => m.default),
  "webp-to-jpg": () =>
    import("./converters/webp-to-jpg").then((m) => m.default),
  "webp-to-png": () =>
    import("./converters/webp-to-png").then((m) => m.default),

  // AVIF family — relies on browser-native AVIF decode (Chrome 85+,
  // Safari 16.4+, Firefox 113+). Older browsers will surface a clean error.
  "avif-to-jpg": () =>
    import("./converters/avif-to-jpg").then((m) => m.default),
  "avif-to-png": () =>
    import("./converters/avif-to-png").then((m) => m.default),
  "avif-to-webp": () =>
    import("./converters/avif-to-webp").then((m) => m.default),

  // Legacy raster
  "bmp-to-jpg": () =>
    import("./converters/bmp-to-jpg").then((m) => m.default),
  "bmp-to-png": () =>
    import("./converters/bmp-to-png").then((m) => m.default),

  // GIF (first frame extraction — animated→video uses FFmpeg family later)
  "gif-to-jpg": () =>
    import("./converters/gif-to-jpg").then((m) => m.default),
  "gif-to-png": () =>
    import("./converters/gif-to-png").then((m) => m.default),

  // Vector → raster (canvas rasterizes SVG via Image src)
  "svg-to-png": () =>
    import("./converters/svg-to-png").then((m) => m.default),
  "svg-to-jpg": () =>
    import("./converters/svg-to-jpg").then((m) => m.default),
};

/** All converter IDs — useful for sitemap generation later. */
export type ConverterId = keyof typeof registry;

export function isKnownConverter(id: string): id is ConverterId {
  return Object.prototype.hasOwnProperty.call(registry, id);
}

export function listConverterIds(): ConverterId[] {
  return Object.keys(registry) as ConverterId[];
}

/** Loads a converter. Cached per id so repeated calls don't re-import. */
const cache = new Map<string, Promise<Converter>>();

export function loadConverter(id: ConverterId): Promise<Converter> {
  let promise = cache.get(id);
  if (!promise) {
    promise = registry[id]();
    cache.set(id, promise);
  }
  return promise;
}
