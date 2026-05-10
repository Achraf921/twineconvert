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
 *   3. Add a tool page at app/<id>/page.tsx (separate from this concern)
 */

type ConverterLoader = () => Promise<Converter>;

export const registry: Record<string, ConverterLoader> = {
  "heic-to-jpg": () =>
    import("./converters/heic-to-jpg").then((m) => m.default),

  // Future entries follow the same pattern. Each new file lands in its own
  // chunk automatically thanks to the dynamic import.
  // 'heic-to-png':  () => import('./converters/heic-to-png').then(m => m.default),
  // 'jpg-to-webp':  () => import('./converters/jpg-to-webp').then(m => m.default),
  // 'image-to-text':() => import('./converters/image-to-text').then(m => m.default),
};

/** All converter IDs — useful for sitemap generation later. */
export type ConverterId = keyof typeof registry;

export function isKnownConverter(id: string): id is ConverterId {
  return Object.prototype.hasOwnProperty.call(registry, id);
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
