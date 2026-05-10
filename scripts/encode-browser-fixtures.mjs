#!/usr/bin/env node
/**
 * Regenerate the inline base64 fixtures embedded in
 * tests/browser/helpers.ts from the binary files in
 * tests/browser/fixtures/.
 *
 * Run after replacing or adding any tests/browser/fixtures/sample.* file:
 *   node scripts/encode-browser-fixtures.js
 *
 * (Inlined as base64 because Vite's dev server / Vitest browser mode
 * pipeline refuses to resolve imports under tests/browser/fixtures/ for
 * reasons that aren't worth debugging when a 4KB inline string works.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tif = fs.readFileSync(path.join(root, "tests/browser/fixtures/sample.tif")).toString("base64");
const avif = fs.readFileSync(path.join(root, "tests/browser/fixtures/sample.avif")).toString("base64");

const helpersPath = path.join(root, "tests/browser/helpers.ts");
const original = fs.readFileSync(helpersPath, "utf8");
const updated = original.replace(
  /const TINY_TIFF_BASE64 = "[^"]*";\s*const TINY_AVIF_BASE64 = "[^"]*";/,
  `const TINY_TIFF_BASE64 = "${tif}";\nconst TINY_AVIF_BASE64 = "${avif}";`,
);
fs.writeFileSync(helpersPath, updated);
console.log(`tests/browser/helpers.ts regenerated (TIFF=${tif.length}b, AVIF=${avif.length}b base64)`);
