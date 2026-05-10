# client-conversion

Browser-only file-conversion engine. Tools added incrementally on top of a
shared lazy-loaded converter registry. No backend.

## Engine architecture

```
src/lib/engine/
├── types.ts       Public types: Converter, ConvertOptions, ConvertResult,
│                  the typed error hierarchy, ConvertSuccessHook
├── registry.ts    String-id → lazy converter loader. Each entry is a
│                  dynamic import() so each converter ships in its own bundle
│                  chunk. Adding a new converter = one line here.
├── runner.ts      Public entry point: run(id, file, opts).
│                  Validates input, enforces size caps, normalizes errors,
│                  fires success hooks for analytics / metering.
└── converters/    One file per format pair. Default-exports a Converter.
    └── heic-to-jpg.ts   Example — uses heic2any + Canvas (lazy-loaded)
```

### Key principles

- **Lazy everything.** No converter ever appears in the route's initial JS
  bundle; the heavy WASM/JS lib is imported only when `convert()` is called.
  Bundle stays small per route → Core Web Vitals stay green → SEO stays good.
- **String-id routing.** Tool pages reference converters by id (e.g.
  `"heic-to-jpg"`), not by direct import. Keeps the page code static and
  the converter set easy to enumerate (sitemap generation later).
- **Errors are typed.** `UnsupportedInputError`, `FileTooLargeError`,
  `ConvertCancelledError`, `ConvertFailedError` — UI maps each to specific
  feedback. No more "something went wrong."
- **One success hook surface.** Want analytics? Pro-tier metering? Quota
  counting? Subscribe via `onConvertSuccess(...)` once. No converter needs
  to know.

## Adding a new converter (the cadence target)

1. Implement `src/lib/engine/converters/<id>.ts`, default-exporting a `Converter`.
   Use `await import("<lib>")` for any heavy dependency.
2. Register it: add one line to `src/lib/engine/registry.ts`.
3. Create the tool page: `src/app/<id>/page.tsx`.
4. Write the unique SEO content for that tool (separate concern, lands later).

## Routing convention (SEO)

Static per-tool routes: `/<from>-to-<to>` (e.g. `/heic-to-jpg`, `/jpg-to-webp`).
- One physical page per tool → unique metadata, unique structured data, unique copy.
- Avoids dynamic `[from]-to-[to]/page.tsx` because Google indexes static
  routes more reliably + we want each page intentional, not template-stamped.

## What's intentionally deferred

- All UI / brand decisions (no design system yet)
- Per-tool SEO content (writes later, with reference to incumbent sites)
- Analytics + ad integration
- Pro-tier hooks (the engine has the success hook ready; consumer wiring later)

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # type check + production bundle
```
