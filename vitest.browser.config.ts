import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { resolve } from "path";

/**
 * Vitest browser-mode config.
 *
 * Runs the converters that need a real Chromium runtime (Canvas, Image
 * decode, FFmpeg.wasm Worker, web-ifc WASM, AVIF encoder, libheif,
 * pdfjs, etc.) and that the Node/happy-dom config in vitest.config.ts
 * skips.
 *
 * Run with: npm run test:browser
 */
export default defineConfig({
  test: {
    include: ["tests/browser/**/*.browser.test.ts"],
    testTimeout: 60000, // FFmpeg + OCR can take 20-40s in real browser
    hookTimeout: 60000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
