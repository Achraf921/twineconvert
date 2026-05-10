import { defineConfig, type Plugin } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

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

/**
 * Serve a fixed list of binary asset paths as raw files, bypassing
 * Vite's module-resolution / transformation pipeline. Vite intercepts
 * any .js request and either serves it as an ES module (with `?import`
 * query rewrites) or refuses with a content-type that breaks worker
 * importScripts(). Tests of FFmpeg.wasm and web-ifc.wasm need the
 * underlying file content verbatim, with the correct MIME, no rewrites.
 */
function rawAssetServer(routes: Array<{ url: string; file: string; mime: string }>): Plugin {
  return {
    name: "raw-asset-server",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const matched = routes.find((r) => req.url!.startsWith(r.url));
        if (!matched) return next();
        if (!existsSync(matched.file)) return next();
        const data = readFileSync(matched.file);
        res.setHeader("Content-Type", matched.mime);
        res.setHeader("Content-Length", String(data.length));
        res.setHeader("Cache-Control", "no-cache");
        res.statusCode = 200;
        res.end(data);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    rawAssetServer([
      // The @ffmpeg/ffmpeg worker is created with type:'module', which
      // disallows importScripts(). It falls back to dynamic import(),
      // which only works on the ESM build (UMD has no `export default`).
      {
        url: "/ffmpeg/ffmpeg-core.js",
        file: resolve(__dirname, "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js"),
        mime: "application/javascript",
      },
      {
        url: "/ffmpeg/ffmpeg-core.wasm",
        file: resolve(__dirname, "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm"),
        mime: "application/wasm",
      },
      {
        url: "/ifc/web-ifc.wasm",
        file: resolve(__dirname, "node_modules/web-ifc/web-ifc.wasm"),
        mime: "application/wasm",
      },
      {
        url: "/ifc/web-ifc-mt.wasm",
        file: resolve(__dirname, "node_modules/web-ifc/web-ifc-mt.wasm"),
        mime: "application/wasm",
      },
      {
        url: "/pdfjs/pdf.worker.mjs",
        file: resolve(__dirname, "node_modules/pdfjs-dist/build/pdf.worker.mjs"),
        mime: "application/javascript",
      },
    ]),
  ],
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
