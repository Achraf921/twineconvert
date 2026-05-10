# Engine Bijectivity Audit

The engine is **bijective wherever data preservation allows**. For every conversion `X → Y` where the inverse `Y → X` can be performed without producing nonsense, we ship the reverse route.

This document lists the **one-way conversions that intentionally have no reverse**, with the reason why each one cannot be made bijective.

---

## Inherently lossy / one-way conversions

These have no reverse because the inverse direction would require fabricating data that doesn't exist in the source — the conversion *destroys information* on purpose.

### OCR family (image → text)
- `image-to-text`, `jpg-to-text`, `png-to-text`, `pdf-to-text`

OCR extracts a textual *interpretation* of pixels. The reverse — synthesizing an image from text — is image generation, an entirely different problem (and one that requires a model, not a deterministic conversion).

### Audio extraction from video
- `mp4-to-mp3`

Removes the video track and keeps only the audio. The reverse (`mp3-to-mp4`) would require fabricating video content that doesn't exist in the source.

### Video → animated image (lossy quantization)
- `mp4-to-gif`

Reduces frame rate, color palette, and resolution. We *do* ship `gif-to-mp4` (lossless wrap), but it's not the round-trip inverse — converting `mp4 → gif → mp4` produces a much smaller, more compressed video than the original.

### Device/platform-proprietary archive extraction
These extract data from container formats that we cannot reconstruct because they include device-specific identifiers, internal database state, encrypted metadata, or signatures we don't have access to:

- `apple-health-to-csv`, `apple-health-to-json`, `apple-health-heart-rate-to-csv`, `apple-health-steps-to-csv`, `apple-health-sleep-to-csv`, `apple-health-workouts-to-csv`
- `kindle-clippings-to-csv`, `kindle-clippings-to-json`, `kindle-clippings-to-markdown`, `kindle-clippings-to-obsidian-md`, `kindle-clippings-to-notion-csv`, `kindle-clippings-to-readwise-csv`
- `whatsapp-chat-to-csv`, `whatsapp-chat-to-json`, `whatsapp-chat-to-html`, `whatsapp-chat-to-pdf`
- `discord-chat-to-md`, `discord-chat-to-pdf`, `discord-chat-summary-csv`
- `twitter-archive-to-csv`, `twitter-archive-to-html`, `instagram-data-to-csv`, `instagram-data-to-html`, `facebook-archive-to-html`

Reconstructing an Apple Health `export.zip` from a CSV would require fabricating Apple's internal `<MetadataEntry>` keys, `<Source>` device fingerprints, signed manifest, etc. — info that doesn't exist outside the user's iPhone.

### Graph → table flattening
- `ifc-to-csv`, `ifc-to-gltf`

IFC is a graph of object relationships (`IfcRelDefinesByProperties`, `IfcRelAssociatesMaterial`, `IfcRelAggregates`, etc.). Converting to a flat CSV or to baked geometry discards the relationship topology. Reconstructing IFC from those outputs would require reinventing the BIM model, which is an authoring task, not a conversion.

### Lossy structural extracts
- `pdf-to-text` — drops layout, fonts, images, tables; reverse is meaningless
- `pdf-to-docx` — extracts paragraphs only; reverse is just `docx-to-pdf` which we already ship
- `mbox-to-pdf` — flattens email message structure to printable PDF; PDF doesn't carry email headers reliably
- `pacer-docket-to-csv` — court docket extraction; reverse would require fabricating the court's HTML format
- `sarif-to-csv`, `sarif-to-html` — extracts findings; reverse would require fabricating tool/rule definitions
- `edi-to-csv`, `edifact-to-csv` — flattens segment structure; reverse needs round-trip-aware writer (could ship later if demand justifies)

### iWork preview extraction (proprietary container)
- `pages-to-pdf`, `numbers-to-pdf`, `keynote-to-pdf`

We extract the embedded `preview.pdf` from Apple's zip-wrapped iWork files. The reverse (`pdf-to-pages` etc.) would require generating Apple's proprietary iWork XML schema, which has never been publicly documented.

### HEIC encoding (library gap)
- `heic-to-jpg`, `heic-to-png`, `heic-to-webp`, `heic-to-pdf`

We *decode* HEIC via heic2any (which wraps libheif). HEIC *encoding* would require a maintained client-side libheif WASM build with the encoder enabled — this doesn't currently exist in the npm ecosystem. If/when one becomes available we'll add `jpg-to-heic` etc.

### Background removal (in-place operation)
- `remove-background`

Outputs a transparent PNG of the foreground. The "reverse" would be putting a background back, which requires creative input (which background?), not a deterministic conversion.

### Compression (in-place operation)
- `compress-pdf`

Same input format on both sides; there is no "decompress-pdf" because the output is still a valid PDF (just larger).

### Raster → vector (requires ML or autotrace)
- `svg-to-jpg`, `svg-to-png`

Rasterizing a vector is deterministic. Vectorizing a raster (`jpg-to-svg`, `png-to-svg`) requires either an ML model (Vector Magic, Adobe Illustrator AI Trace) or autotrace heuristics that produce very limited output (single-color paths only). Out of scope for a deterministic-conversion engine.

### FEN is a position, not a game
- `pgn-to-fen`

A FEN string represents one chess board position. A PGN is a full game (sequence of moves). You cannot reconstruct a game from a single position.

---

## Bijective pairs we ship (selected examples)

The vast majority of routes ARE bijective. Highlights:

- **All image format pairs** (JPG↔PNG↔WebP↔BMP↔GIF) — both directions
- **AVIF** — encode + decode both ways
- **All TIFF reverses available** (TIFF↔JPG, TIFF↔PNG; we have TIFF→PDF; PDF→TIFF requires more work, deferred)
- **PDF↔JPG**, **PDF↔PNG**, **PDF↔DOCX** (lossy DOCX side accepted)
- **Audio cross-pairs** — MP3↔WAV, MP3↔M4A, MP3↔FLAC, MP3↔OGG (via FFmpeg)
- **Video format pairs** — MP4↔MOV, MP4↔WebM, MP4↔AVI, MP4↔MKV, GIF↔MP4
- **Office docs** — DOCX↔HTML, DOCX↔TXT, XLSX↔CSV, XLSX↔JSON, CSV↔JSON
- **Finance** — OFX↔QFX↔QBO↔CSV↔QIF (full matrix)
- **GEDCOM** — GED↔CSV↔JSON
- **Bibliography** — BibTeX↔RIS↔NBIB↔EndNote↔CSV (full matrix)
- **ADIF** — ADIF↔CSV↔Cabrillo
- **3D meshes** — STL↔OBJ↔3MF
- **Music notation** — MIDI↔MusicXML↔MXL
- **Color palettes** — ASE↔ACO↔GPL (full matrix)
- **LUT** — Cube↔3DL↔CSP (full matrix)
- **Embroidery** — DST↔PES↔JEF↔EXP (full matrix)

---

## Verifying bijectivity in CI

The CI pipeline runs round-trip tests for losslessly-bijective pairs:
1. Take a fixture file `X`
2. Convert `X → Y` to produce intermediate `Y'`
3. Convert `Y' → X` to produce reconstructed `X''`
4. Assert `X` and `X''` are byte-equal (lossless pairs) OR semantically equivalent (lossy-but-faithful pairs)

For lossy pairs (e.g. JPEG re-encode), we check structural soundness (valid magic bytes, decodable, reasonable dimensions) rather than byte equality.

See `tests/round-trip.test.ts` for the implementation.
