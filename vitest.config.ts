import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * Vitest configuration.
 *
 * Environment choice: happy-dom over jsdom because it's ~3x faster and
 * implements enough of the DOM (DOMParser, Blob, File, TextDecoder) for
 * the converters that don't need real Canvas / WebAssembly / Image
 * decoding. Canvas + Image-decode-dependent converters (everything in
 * the image format pair family, HEIC, AVIF, TIFF, ICO, PDF render via
 * pdfjs, IFC via web-ifc) still need a real browser — those run via
 * Vitest browser mode in a separate config (TODO: add browser tests
 * once we have CI capacity for Playwright/Chromium).
 *
 * For now, our CI runs the node-environment tests (text-format
 * converters, archive parsers, structured-data converters) which cover
 * roughly half the engine and catch the most common failure modes:
 * bad parsing, broken writers, registry/file mismatches, type
 * regressions.
 */
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
    globals: true,
    testTimeout: 30000, // some converters (FFmpeg, OCR) can be slow in browser; 30s ceiling
    pool: "forks", // workers cause heap issues with large WASM/PDF deps; forks isolate
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/lib/engine/**"],
      exclude: ["src/lib/engine/types.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
