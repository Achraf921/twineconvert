# Test infrastructure

The engine has 192 converters. The tests verify that **every one of them produces a real, valid output for a real, valid input**, not just that they don't throw.

## Layers

We have **four layers of defense** against shipping a broken converter, each catching different failure modes:

### 1. Registry integrity (`tests/registry.test.ts`)

Every converter in the registry loads, has consistent metadata (id matches the registry key), has non-empty `accept` / `fromMime`, etc. Catches the "I added a converter file but forgot to register it" or vice-versa regression. Runs against all 192 converters.

### 2. Per-converter smoke + structural validation (`tests/converters-comprehensive.test.ts`)

For every converter, we:
1. Load a real fixture file in the input format (from `tests/fixtures/fixture-providers.ts`)
2. Run the conversion
3. Validate the output via a format-specific validator (from `tests/validators/index.ts`)

The validators **decode the output and assert structural soundness**, PDF has `%%EOF` trailer, ZIP has `[Content_Types].xml`, BibTeX has `@entry` blocks, GEDCOM has `HEAD` + `TRLR`, embroidery PES starts with `#PES`, etc. This catches the failure mode where a converter produces a file with valid magic bytes but garbage content.

Currently covers ~120 converters that work in Node + happy-dom (698 tests). The remaining ~72 need real Canvas / WASM / Worker support and run in the browser tier.

### 2b. Browser-mode tests (`tests/browser/*.browser.test.ts`)

Vitest browser mode + Playwright + headless Chromium. Run with `npm run test:browser`. Currently 44 tests across:
- Canvas image conversions (PNG/JPG/WebP/BMP/ICO/PDF cross-conversions, 13)
- SVG/PDF/DOCX (8)
- AVIF (real fixture) + AVIF encoding (9)
- TIFF (hand-encoded fixture) (3)
- BMP/ICO reverses + GIF (hand-crafted) (6)
- Email/text-input PDF generation: EML, MBOX, GEDCOM, WhatsApp, Discord (5)
- OCR via Tesseract.js: png-to-text, jpg-to-text, image-to-text (3)

Coverage as of 2026-05-10:

  Total converters:  192
  Node-tested:       120 (real fixtures + structural validation)
  Browser-tested:     72 (Chromium + Playwright)
  Total covered:     192 (100%)

  Browser-tested coverage was unblocked by adding a small custom
  Vite plugin (vitest.browser.config.ts:rawAssetServer) that
  serves /ffmpeg/* and /ifc/* as raw files with the correct MIME,
  bypassing Vite's module-resolution pipeline. Module workers
  inside @ffmpeg/ffmpeg use dynamic import(), which only works on
  the ESM build of @ffmpeg/core (UMD has no `export default`), so
  the plugin maps /ffmpeg/ffmpeg-core.js to the ESM dist.

  Bugs found by browser tests:
    - png-to-bmp + jpg-to-bmp returned PNG-with-.bmp-filename
      because Canvas.toBlob falls back silently for image/bmp.
      Fixed with a pure-JS BMP encoder in
      src/lib/engine/util/bmp-encode.ts.
    - png-to-gif + jpg-to-gif had the same silent fallback for
      image/gif. Fixed with gifenc-based encoder in
      src/lib/engine/util/gif-encode.ts.
    - heic-to-webp returns PNG instead of WebP (heic2any
      upstream quirk that doesn't honor toType: 'image/webp').
      Marked it.fails so we get pinged when fixed upstream.

  Production deployment unaffected by Vitest internals. Next.js
  serves /ffmpeg/* + /ifc/* directly from public/ without Vite
  in the way; the same files load identically in both contexts.

### 3. Round-trip equivalence (`tests/round-trip.test.ts`)

For every losslessly-bijective pair (X→Y where Y→X exists and the round-trip should preserve information):
- Take fixture X
- Convert X→Y
- Convert Y→X' (reconstructed)
- Assert X' is semantically equivalent to X (preserves the key fields, transaction count, vertex count, etc.)

This is uniquely powerful because it catches bugs in EITHER the forward or reverse converter that one-way tests cannot detect. If our writer encodes amounts as strings but the reader expects them as numbers, the magic-byte and structural validators both pass, only the round-trip catches the silent corruption.

Covers 30+ pairs across finance, bibliography, GEDCOM, ADIF, 3D mesh, color palettes, embroidery, LUTs, and music notation.

### 4. Adversarial fuzz (`tests/fuzz.test.ts`)

For a representative sample of converters (covering all major library/parser dependencies), we feed:
- Empty input (zero bytes)
- Truncated input (10 bytes)
- Random binary noise (1KB)
- Hostile-input boundaries (zip bombs, very wide CSVs, deeply nested JSON, malformed XML)

…and assert each converter either errors gracefully (throws `ConvertFailedError`) or returns a valid-but-empty output. **What it must NOT do** is hang, crash, or produce a file with the right magic bytes but garbage content.

## Adding a new converter

When you add a converter to the engine:

1. Implement it under `src/lib/engine/converters/<id>.ts`
2. Register it in `src/lib/engine/registry.ts`
3. Run `npx tsx scripts/generate-registry-meta.ts` to regenerate the static metadata
4. Add a fixture provider entry in `tests/fixtures/fixture-providers.ts`
5. If your output format is new, add a validator in `tests/validators/index.ts`
6. If the converter has a reverse direction, add a round-trip test in `tests/round-trip.test.ts`

The CI pipeline will then exercise your converter on every push.

## Running tests locally

```bash
npm test                    # all suites
npm run test:watch          # watch mode for active development
npm run test:coverage       # with v8 coverage report (HTML in coverage/)
npx vitest run -t "ofx"     # single converter
```

## CI pipeline

`.github/workflows/ci.yml` runs three parallel jobs on every push and PR:

1. **Type check** (5 min timeout), `tsc --noEmit`
2. **Tests** (15 min), `vitest run --coverage`, uploads coverage artifact
3. **Build** (15 min), regenerates registry-meta, runs `next build --webpack`, uploads `.next/` artifact

Failure in any job blocks the merge.

## Why webpack instead of Turbopack

Turbopack (Next.js 16's default) wedges on our 192-converter dynamic-import set during the chunking phase, observed multi-minute hangs at 0% CPU with 10GB+ memory pressure on local builds. Webpack chunks the same set in <2 minutes with normal memory.

Once Turbopack matures further this will probably stop being a problem; for now we explicitly opt out via `--webpack` flag.

## Browser-only converters

Roughly 80 converters need real Canvas / WASM / Worker APIs that don't exist in Node + happy-dom:

- All image format pairs (Canvas-based)
- HEIC, AVIF, TIFF (browser image decoders + WASM encoders)
- FFmpeg audio/video (FFmpeg.wasm needs Worker)
- PDF rendering via pdfjs (needs Canvas)
- IFC via web-ifc (WASM)
- OCR via Tesseract (Worker)
- ICO encoding (Canvas)
- Background removal (ONNX model)

These have fixture providers but are tagged `env: "browser"` and skipped by the Node test suite. They're covered by Vitest browser mode tests in a follow-up commit (uses Playwright + Chromium headless).

## Coverage

Run `npm run test:coverage` to generate an HTML report in `coverage/`. Open `coverage/index.html` to see line coverage per file. The unit tests currently exercise the engine's text/structured-format converters, all parser+writer utilities, and the runner. Browser-only converters show low coverage in the Node report, that's expected and covered by the browser test suite.
