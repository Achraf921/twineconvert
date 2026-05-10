# twineconvert

> Free file conversion that runs entirely in your browser. Nothing uploaded. No signup. No file size limit.

[twineconvert.com](https://twineconvert.com) — 192 converters across 28 format families. Image, PDF, audio/video, office docs, EPUB, finance (OFX/QIF), Apple Health, WhatsApp, GEDCOM, BibTeX, IFC (BIM), embroidery (DST/PES/JEF/EXP), MIDI, color palettes, LUTs, 3D meshes, and more.

The differentiator vs CloudConvert / iLovePDF / Smallpdf / FreeConvert: **the conversion runs in your browser**, not on a server. Your file is never uploaded.

## Architecture

```
src/lib/engine/
├── registry.ts        — runtime registry: id → lazy converter loader
├── registry-meta.ts   — static metadata catalog (build-time, generated)
├── runner.ts          — public run(toolId, file, opts) entry point
├── types.ts           — Converter interface, error hierarchy
├── util/              — shared parsers + writers (one per format family:
│                        ofx-parse, gedcom-parse, embroidery, palette, lut,
│                        mesh, midi-musicxml, citation, ifc-load, etc.)
└── converters/        — one file per converter (192 total). Each implements
                         the Converter interface and is lazy-loaded by
                         registry.ts via dynamic import.

src/app/
├── layout.tsx         — root layout with header + footer + metadata
├── page.tsx           — homepage: hero + tool directory
├── [tool]/page.tsx    — per-tool dynamic route (192 URLs, ISR)
├── sitemap.ts         — programmatic sitemap from registry-meta
├── robots.ts          — robots.txt
└── not-found.tsx      — branded 404 with popular-route suggestions

src/components/
├── Header, Footer     — shared layout chrome
├── Dropzone (client)  — file picker + state machine + progress
└── ToolPage (server)  — per-tool template (hero + how-to + format cards
                         + cross-link grids + FAQ + JSON-LD)

src/lib/
├── formats.ts         — format profile catalog (descriptions reused
│                        across all per-tool pages)
└── related-tools.ts   — auto-generated cross-link grids

tests/
├── validators/        — output validator library (one per format)
├── fixtures/          — fixture providers (programmatic + committed)
├── registry.test.ts   — registry integrity (all 192 IDs)
├── converters-comprehensive.test.ts — per-converter smoke + structural
├── round-trip.test.ts — bijective round-trip equivalence (30 pairs)
└── fuzz.test.ts       — adversarial input handling
```

## Adding a converter

1. Implement under `src/lib/engine/converters/<id>.ts`, default-exporting a `Converter`
2. Add a single line to `src/lib/engine/registry.ts` mapping `id → () => import(...)`
3. Run `npm run build` (the `prebuild` hook regenerates `registry-meta.ts`)
4. Add a fixture provider entry in `tests/fixtures/fixture-providers.ts`
5. If the output format is new, add a validator in `tests/validators/index.ts`
6. If there's a reverse direction, add a round-trip test in `tests/round-trip.test.ts`

The new converter automatically gets:

- A URL at `/<id>` with full SEO content + dropzone + cross-link grids
- A sitemap entry
- Registry integrity, structural, and (where applicable) round-trip + fuzz tests in CI

## Tech stack

- **Next.js 16** (App Router) — server components for SEO, client component only for the dropzone
- **Tailwind v4** — CSS-first design tokens (`@theme` block in `globals.css`)
- **Geist** — typography (Vercel's geometric sans, distributed via `geist` npm package)
- **TypeScript strict mode** — every converter is typed via the `Converter` interface
- **Vitest + happy-dom** — fast Node test environment for ~110 converters
- **Webpack** — production build (Turbopack OOMs on our 192-chunk dynamic-import set)

## Conversion library inventory

Every conversion runs in the browser via WebAssembly + JavaScript. Libraries we ship:

| Library | Used for |
|---|---|
| heic2any (libheif) | HEIC decoding |
| @jsquash/avif | AVIF encoding |
| utif | TIFF decoding |
| pdfjs-dist | PDF rendering |
| pdf-lib | PDF assembly + manipulation |
| jspdf + html2canvas | HTML → PDF |
| mammoth | DOCX parsing |
| docx | DOCX writing |
| xlsx (SheetJS) | XLSX read/write |
| papaparse | CSV |
| jszip | EPUB / iWork / Apple Health / archives |
| @ffmpeg/ffmpeg + @ffmpeg/util | Audio/video transcoding |
| tesseract.js | OCR |
| postal-mime | Email parsing |
| midi-file | MIDI |
| chess.js | PGN parsing |
| web-ifc | IFC (BIM) |
| @imgly/background-removal | Background removal (ONNX) |
| twitter-archive-reader | Twitter archive parsing |
| sax | Streaming XML (Apple Health) |

Plus hand-written parsers for: OFX/QFX/QBO, QIF, GEDCOM, BibTeX, RIS, NBIB, EndNote XML, ADIF, Cabrillo, WhatsApp, Discord, SARIF, EDI X12, EDIFACT, PACER docket HTML, LUT (Cube/3DL/CSP), color palette (ASE/ACO/GPL), embroidery (DST/PES/JEF/EXP), STL/OBJ/3MF, MusicXML, Apple iWork extraction.

## Testing

See `tests/README.md` for the four-layer test strategy. Quick commands:

```bash
npm test                       # all suites (registry + smoke + round-trip + fuzz)
npm run test:watch             # active development
npm run test:coverage          # with v8 coverage HTML report

npm run build                  # production build (uses webpack)
npm run dev                    # local dev server
```

Currently: 696/698 unit tests passing, 30/30 round-trip tests passing, 113/113 fuzz tests passing.

## Bijectivity

Every conversion `X → Y` has a reverse `Y → X` shipped where it's technically possible to round-trip without producing nonsense. The conversions that are inherently one-way are documented in [`ENGINE-BIJECTIVITY.md`](./ENGINE-BIJECTIVITY.md) with the reason each one cannot be reversed (OCR is image generation, IFC graph relationships can't be reconstructed from a CSV row, audio extraction loses video data, etc.).

## CI/CD

`.github/workflows/ci.yml` runs three parallel jobs on every push and PR:

- **Type check** — `tsc --noEmit`, fails first on type errors
- **Tests** — `npm run test:coverage`, uploads coverage artifact
- **Build** — regenerates registry-meta + `next build --webpack`, uploads `.next` artifact

Vercel auto-deploys on push to main using the same `npm run build` command, so the production deploy uses the same config as CI.

## License

(unspecified yet — TBD)
