# Bijectivity Audit

Generated 2026-05-11 from src/lib/engine/converters/.

## Summary

| Classification | Count |
|---|---:|
| Total converters | 192 |
| **Bijective candidates** (lossless, same-kind, both directions exist) | 76 |
| **Bijective candidates missing reverse converter** | 7 |
| **Bijective candidates missing round-trip test** | 45 |
| Lossy encoding (same kind, but lossy format) | 49 |
| Cross-kind (raster→doc, video→audio, etc., inherently lossy) | 18 |
| Single-action (no reverse possible) | 42 |
| Unknown formats (need to add to FORMATS table) | 0 |
| Compound id (irregular pattern) | 0 |

## Action Items

### 2. Bijective converters MISSING their reverse pair

These converters are lossless and could round-trip, but the reverse converter isn't implemented. Adding the reverse unlocks bijectivity testing AND another tool page for SEO.

| Forward | Missing reverse |
|---|---|
| `adif-to-kml` | `kml-to-adif` |
| `ase-to-css` | `css-to-ase` |
| `eml-to-csv` | `csv-to-eml` |
| `hex-to-ase` | `ase-to-hex` |
| `hex-to-gpl` | `gpl-to-hex` |
| `tiff-to-png` | `png-to-tiff` |
| `xlsx-to-json` | `json-to-xlsx` |

### 3. Bijective pairs MISSING a round-trip test

Both directions exist and are theoretically lossless, but no round-trip test verifies it. These are the highest-leverage tests to add (they catch bugs in EITHER direction).

| Pair | A→B | B→A |
|---|---|---|
| 3dl ↔ csp | `3dl-to-csp` | `csp-to-3dl` |
| aco ↔ gpl | `aco-to-gpl` | `gpl-to-aco` |
| adif ↔ cabrillo | `adif-to-cabrillo` | `cabrillo-to-adif` |
| bibtex ↔ nbib | `bibtex-to-nbib` | `nbib-to-bibtex` |
| bmp ↔ png | `bmp-to-png` | `png-to-bmp` |
| csv ↔ gedcom | `csv-to-gedcom` | `gedcom-to-csv` |
| csv ↔ json | `csv-to-json` | `json-to-csv` |
| csv ↔ qbo | `csv-to-qbo` | `qbo-to-csv` |
| csv ↔ qfx | `csv-to-qfx` | `qfx-to-csv` |
| csv ↔ ris | `csv-to-ris` | `ris-to-csv` |
| csv ↔ xlsx | `csv-to-xlsx` | `xlsx-to-csv` |
| dst ↔ exp | `dst-to-exp` | `exp-to-dst` |
| dst ↔ jef | `dst-to-jef` | `jef-to-dst` |
| dst ↔ pes | `dst-to-pes` | `pes-to-dst` |
| eml ↔ mbox | `eml-to-mbox` | `mbox-to-eml` |
| endnote-xml ↔ ris | `endnote-xml-to-ris` | `ris-to-endnote-xml` |
| exp ↔ jef | `exp-to-jef` | `jef-to-exp` |
| exp ↔ pes | `exp-to-pes` | `pes-to-exp` |
| gif ↔ png | `gif-to-png` | `png-to-gif` |
| ico ↔ png | `ico-to-png` | `png-to-ico` |
| jef ↔ pes | `jef-to-pes` | `pes-to-jef` |
| nbib ↔ ris | `nbib-to-ris` | `ris-to-nbib` |
| obj ↔ 3mf | `obj-to-3mf` | `3mf-to-obj` |

## Full Classification Table

| Converter | Type | Has reverse? | Round-trip test? | Note |
|---|---|---|---|---|
| `3dl-to-csp` | bijective-candidate | ✓ | ✗ MISSING | both lossless lut formats; should round-trip cleanly |
| `3dl-to-cube` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `3mf-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `3mf-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `aco-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `aco-to-gpl` | bijective-candidate | ✓ | ✗ MISSING | both lossless palette formats; should round-trip cleanly |
| `adif-to-cabrillo` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `adif-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `adif-to-kml` | bijective-candidate | (`kml-to-adif` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `apple-health-heart-rate-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-sleep-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-steps-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-workouts-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `ase-to-aco` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-css` | bijective-candidate | (`css-to-ase` missing) | n/a | both lossless palette formats; should round-trip cleanly |
| `ase-to-gpl` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-json` | cross-kind | (`json-to-ase` missing) | n/a | palette -> data: cross-domain, inherently lossy |
| `avi-to-mp4` | lossy-encoding | ✓ | n/a | avi or mp4 uses lossy encoding |
| `avif-to-jpg` | lossy-encoding | ✓ | n/a | avif or jpg uses lossy encoding |
| `avif-to-png` | lossy-encoding | ✓ | n/a | avif or png uses lossy encoding |
| `avif-to-webp` | lossy-encoding | ✓ | n/a | avif or webp uses lossy encoding |
| `bibtex-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-nbib` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `bibtex-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bmp-to-jpg` | lossy-encoding | ✓ | n/a | bmp or jpg uses lossy encoding |
| `bmp-to-png` | bijective-candidate | ✓ | ✗ MISSING | both lossless raster formats; should round-trip cleanly |
| `cabrillo-to-adif` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `compress-pdf` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `csp-to-3dl` | bijective-candidate | ✓ | ✗ MISSING | both lossless lut formats; should round-trip cleanly |
| `csp-to-cube` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `csv-to-adif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-gedcom` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-json` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-ofx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qbo` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-qfx` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-qif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ris` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-xlsx` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `cube-to-3dl` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `cube-to-csp` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `discord-chat-summary-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `discord-chat-to-md` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `discord-chat-to-pdf` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `docx-to-html` | lossy-encoding | ✓ | n/a | docx or html uses lossy encoding |
| `docx-to-pdf` | lossy-encoding | ✓ | n/a | docx or pdf uses lossy encoding |
| `docx-to-txt` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `dst-to-exp` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `dst-to-jef` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `dst-to-pes` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `edi-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `edifact-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `eml-to-csv` | bijective-candidate | (`csv-to-eml` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `eml-to-html` | cross-kind | (`html-to-eml` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `eml-to-mbox` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `eml-to-pdf` | cross-kind | (`pdf-to-eml` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `endnote-xml-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-ris` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `epub-to-html` | lossy-encoding | (`html-to-epub` missing) | n/a | epub or html uses lossy encoding |
| `epub-to-pdf` | lossy-encoding | (`pdf-to-epub` missing) | n/a | epub or pdf uses lossy encoding |
| `epub-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `exp-to-dst` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `exp-to-jef` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `exp-to-pes` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `facebook-archive-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `flac-to-mp3` | lossy-encoding | ✓ | n/a | flac or mp3 uses lossy encoding |
| `gedcom-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `gedcom-to-html` | cross-kind | (`html-to-gedcom` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `gedcom-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gedcom-to-pdf` | cross-kind | (`pdf-to-gedcom` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `gif-to-jpg` | lossy-encoding | ✓ | n/a | gif or jpg uses lossy encoding |
| `gif-to-mp4` | cross-kind | ✓ | n/a | raster -> video: cross-domain, inherently lossy |
| `gif-to-png` | bijective-candidate | ✓ | ✗ MISSING | both lossless raster formats; should round-trip cleanly |
| `gpl-to-aco` | bijective-candidate | ✓ | ✗ MISSING | both lossless palette formats; should round-trip cleanly |
| `gpl-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `heic-to-jpg` | lossy-encoding | (`jpg-to-heic` missing) | n/a | heic or jpg uses lossy encoding |
| `heic-to-pdf` | cross-kind | (`pdf-to-heic` missing) | n/a | raster -> doc: cross-domain, inherently lossy |
| `heic-to-png` | lossy-encoding | (`png-to-heic` missing) | n/a | heic or png uses lossy encoding |
| `heic-to-webp` | lossy-encoding | (`webp-to-heic` missing) | n/a | heic or webp uses lossy encoding |
| `hex-to-ase` | bijective-candidate | (`ase-to-hex` missing) | n/a | both lossless palette formats; should round-trip cleanly |
| `hex-to-gpl` | bijective-candidate | (`gpl-to-hex` missing) | n/a | both lossless palette formats; should round-trip cleanly |
| `html-to-docx` | lossy-encoding | ✓ | n/a | html or docx uses lossy encoding |
| `ico-to-jpg` | lossy-encoding | ✓ | n/a | ico or jpg uses lossy encoding |
| `ico-to-png` | bijective-candidate | ✓ | ✗ MISSING | both lossless raster formats; should round-trip cleanly |
| `ifc-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `ifc-to-gltf` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `image-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `instagram-data-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `instagram-data-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `jef-to-dst` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `jef-to-exp` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `jef-to-pes` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `jpg-to-avif` | lossy-encoding | ✓ | n/a | jpg or avif uses lossy encoding |
| `jpg-to-bmp` | lossy-encoding | ✓ | n/a | jpg or bmp uses lossy encoding |
| `jpg-to-gif` | lossy-encoding | ✓ | n/a | jpg or gif uses lossy encoding |
| `jpg-to-ico` | lossy-encoding | ✓ | n/a | jpg or ico uses lossy encoding |
| `jpg-to-pdf` | cross-kind | ✓ | n/a | raster -> doc: cross-domain, inherently lossy |
| `jpg-to-png` | lossy-encoding | ✓ | n/a | jpg or png uses lossy encoding |
| `jpg-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `jpg-to-webp` | lossy-encoding | ✓ | n/a | jpg or webp uses lossy encoding |
| `json-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `json-to-gedcom` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `keynote-to-pdf` | lossy-encoding | (`pdf-to-keynote` missing) | n/a | keynote or pdf uses lossy encoding |
| `kindle-clippings-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-markdown` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-notion-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-obsidian-md` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-readwise-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `m4a-to-mp3` | lossy-encoding | ✓ | n/a | m4a or mp3 uses lossy encoding |
| `mbox-to-eml` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `mbox-to-pdf` | cross-kind | (`pdf-to-mbox` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `midi-to-musicxml` | lossy-encoding | ✓ | n/a | midi or musicxml uses lossy encoding |
| `mkv-to-mp4` | lossy-encoding | ✓ | n/a | mkv or mp4 uses lossy encoding |
| `mov-to-mp4` | lossy-encoding | ✓ | n/a | mov or mp4 uses lossy encoding |
| `mp3-to-flac` | lossy-encoding | ✓ | n/a | mp3 or flac uses lossy encoding |
| `mp3-to-m4a` | lossy-encoding | ✓ | n/a | mp3 or m4a uses lossy encoding |
| `mp3-to-ogg` | lossy-encoding | ✓ | n/a | mp3 or ogg uses lossy encoding |
| `mp3-to-wav` | lossy-encoding | ✓ | n/a | mp3 or wav uses lossy encoding |
| `mp4-to-avi` | lossy-encoding | ✓ | n/a | mp4 or avi uses lossy encoding |
| `mp4-to-gif` | cross-kind | ✓ | n/a | video -> raster: cross-domain, inherently lossy |
| `mp4-to-mkv` | lossy-encoding | ✓ | n/a | mp4 or mkv uses lossy encoding |
| `mp4-to-mov` | lossy-encoding | ✓ | n/a | mp4 or mov uses lossy encoding |
| `mp4-to-mp3` | cross-kind | (`mp3-to-mp4` missing) | n/a | video -> audio: cross-domain, inherently lossy |
| `musicxml-to-midi` | lossy-encoding | ✓ | n/a | musicxml or midi uses lossy encoding |
| `musicxml-to-mxl` | bijective-candidate | ✓ | ✓ | both lossless notation formats; should round-trip cleanly |
| `mxl-to-musicxml` | bijective-candidate | ✓ | ✓ | both lossless notation formats; should round-trip cleanly |
| `nbib-to-bibtex` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `nbib-to-ris` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `numbers-to-pdf` | lossy-encoding | (`pdf-to-numbers` missing) | n/a | numbers or pdf uses lossy encoding |
| `obj-to-3mf` | bijective-candidate | ✓ | ✗ MISSING | both lossless mesh formats; should round-trip cleanly |
| `obj-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `ofx-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ofx-to-qif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ogg-to-mp3` | lossy-encoding | ✓ | n/a | ogg or mp3 uses lossy encoding |
| `pacer-docket-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `pages-to-pdf` | lossy-encoding | (`pdf-to-pages` missing) | n/a | pages or pdf uses lossy encoding |
| `pdf-to-docx` | lossy-encoding | ✓ | n/a | pdf or docx uses lossy encoding |
| `pdf-to-jpg` | cross-kind | ✓ | n/a | doc -> raster: cross-domain, inherently lossy |
| `pdf-to-png` | cross-kind | ✓ | n/a | doc -> raster: cross-domain, inherently lossy |
| `pdf-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `pes-to-dst` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `pes-to-exp` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `pes-to-jef` | bijective-candidate | ✓ | ✗ MISSING | both lossless embroidery formats; should round-trip cleanly |
| `pgn-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `pgn-to-fen` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `pgn-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `png-to-avif` | lossy-encoding | ✓ | n/a | png or avif uses lossy encoding |
| `png-to-bmp` | bijective-candidate | ✓ | ✗ MISSING | both lossless raster formats; should round-trip cleanly |
| `png-to-gif` | bijective-candidate | ✓ | ✗ MISSING | both lossless raster formats; should round-trip cleanly |
| `png-to-ico` | bijective-candidate | ✓ | ✗ MISSING | both lossless raster formats; should round-trip cleanly |
| `png-to-jpg` | lossy-encoding | ✓ | n/a | png or jpg uses lossy encoding |
| `png-to-pdf` | cross-kind | ✓ | n/a | raster -> doc: cross-domain, inherently lossy |
| `png-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `png-to-webp` | lossy-encoding | ✓ | n/a | png or webp uses lossy encoding |
| `qbo-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `qfx-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `qif-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qif-to-ofx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `remove-background` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `ris-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `ris-to-endnote-xml` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `ris-to-nbib` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `sarif-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `sarif-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `stl-to-3mf` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `stl-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `svg-to-jpg` | cross-kind | (`jpg-to-svg` missing) | n/a | vector -> raster: cross-domain, inherently lossy |
| `svg-to-png` | cross-kind | (`png-to-svg` missing) | n/a | vector -> raster: cross-domain, inherently lossy |
| `tiff-to-jpg` | lossy-encoding | (`jpg-to-tiff` missing) | n/a | tiff or jpg uses lossy encoding |
| `tiff-to-pdf` | cross-kind | (`pdf-to-tiff` missing) | n/a | raster -> doc: cross-domain, inherently lossy |
| `tiff-to-png` | bijective-candidate | (`png-to-tiff` missing) | n/a | both lossless raster formats; should round-trip cleanly |
| `twitter-archive-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `twitter-archive-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `txt-to-docx` | lossy-encoding | ✓ | n/a | txt or docx uses lossy encoding |
| `wav-to-mp3` | lossy-encoding | ✓ | n/a | wav or mp3 uses lossy encoding |
| `webm-to-mp4` | lossy-encoding | (`mp4-to-webm` missing) | n/a | webm or mp4 uses lossy encoding |
| `webp-to-avif` | lossy-encoding | ✓ | n/a | webp or avif uses lossy encoding |
| `webp-to-jpg` | lossy-encoding | ✓ | n/a | webp or jpg uses lossy encoding |
| `webp-to-pdf` | cross-kind | (`pdf-to-webp` missing) | n/a | raster -> doc: cross-domain, inherently lossy |
| `webp-to-png` | lossy-encoding | ✓ | n/a | webp or png uses lossy encoding |
| `whatsapp-chat-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-pdf` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `xlsx-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `xlsx-to-json` | bijective-candidate | (`json-to-xlsx` missing) | n/a | both lossless data formats; should round-trip cleanly |
