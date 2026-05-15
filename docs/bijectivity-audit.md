# Bijectivity Audit

Generated 2026-05-15 from src/lib/engine/converters/.

## Summary

| Classification | Count |
|---|---:|
| Total converters | 324 |
| **Bijective candidates** (lossless, same-kind, both directions exist) | 158 |
| **Bijective candidates missing reverse converter** | 14 |
| **Bijective candidates missing round-trip test** | 2 |
| Lossy encoding (same kind, but lossy format) | 64 |
| Cross-kind (raster→doc, video→audio, etc., inherently lossy) | 35 |
| Single-action (no reverse possible) | 53 |
| Unknown formats (need to add to FORMATS table) | 0 |
| Compound id (irregular pattern) | 0 |

## Action Items

### 2. Bijective converters MISSING their reverse pair

These converters are lossless and could round-trip, but the reverse converter isn't implemented. Adding the reverse unlocks bijectivity testing AND another tool page for SEO.

| Forward | Missing reverse |
|---|---|
| `adif-to-kml` | `kml-to-adif` |
| `bibtex-to-xlsx` | `xlsx-to-bibtex` |
| `dicom-to-json` | `json-to-dicom` |
| `eml-to-csv` | `csv-to-eml` |
| `gedcom-to-xlsx` | `xlsx-to-gedcom` |
| `hl7-to-csv` | `csv-to-hl7` |
| `json-to-sql` | `sql-to-json` |
| `json5-to-json` | `json-to-json5` |
| `mbox-to-csv` | `csv-to-mbox` |
| `nbib-to-xlsx` | `xlsx-to-nbib` |
| `opt-to-csv` | `csv-to-opt` |
| `otf-to-ttf` | `ttf-to-otf` |
| `ris-to-xlsx` | `xlsx-to-ris` |
| `tiff-to-png` | `png-to-tiff` |

### 3. Bijective pairs MISSING a round-trip test

Both directions exist and are theoretically lossless, but no round-trip test verifies it. These are the highest-leverage tests to add (they catch bugs in EITHER direction).

| Pair | A→B | B→A |
|---|---|---|
| ttf ↔ woff | `ttf-to-woff` | `woff-to-ttf` |

## Full Classification Table

| Converter | Type | Has reverse? | Round-trip test? | Note |
|---|---|---|---|---|
| `3dl-to-csp` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `3dl-to-cube` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `3mf-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `3mf-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `aco-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `aco-to-gpl` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `adif-to-cabrillo` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `adif-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `adif-to-kml` | bijective-candidate | (`kml-to-adif` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `apple-health-heart-rate-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-sleep-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-steps-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-workouts-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `ase-to-aco` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-css` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-gpl` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-hex` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-json` | cross-kind | (`json-to-ase` missing) | n/a | palette -> data: cross-domain, inherently lossy |
| `ass-to-srt` | lossy-encoding | ✓ | ✓ | ass or srt uses lossy encoding |
| `ass-to-vtt` | lossy-encoding | ✓ | ✓ | ass or vtt uses lossy encoding |
| `avi-to-mp4` | lossy-encoding | ✓ | ✓ | avi or mp4 uses lossy encoding |
| `avif-to-jpg` | lossy-encoding | ✓ | ✓ | avif or jpg uses lossy encoding |
| `avif-to-png` | lossy-encoding | ✓ | ✓ | avif or png uses lossy encoding |
| `avif-to-webp` | lossy-encoding | ✓ | ✓ | avif or webp uses lossy encoding |
| `base64-to-text` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `bibtex-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `bibtex-to-markdown` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `bibtex-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-xlsx` | bijective-candidate | (`xlsx-to-bibtex` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `bibtex-to-yaml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bmp-to-jpg` | lossy-encoding | ✓ | ✓ | bmp or jpg uses lossy encoding |
| `bmp-to-png` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `cabrillo-to-adif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ccda-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `ccda-to-json` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `cmyk-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `cmyk-to-rgb` | lossy-encoding | ✓ | ✓ | cmyk or rgb uses lossy encoding |
| `color-name-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `compress-pdf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `csl-json-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csp-to-3dl` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `csp-to-cube` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `css-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `csv-to-adif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-dat` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-fhir-bundle` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-gedcom` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-html-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-jsonl` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-markdown-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ofx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-po` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qbo` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qfx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-sql` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-tsv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-yaml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `cube-to-3dl` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `cube-to-csp` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `dat-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `der-to-pem` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `dicom-to-json` | bijective-candidate | (`json-to-dicom` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `dicom-to-png` | cross-kind | (`png-to-dicom` missing) | n/a | data -> raster: cross-domain, inherently lossy |
| `discord-chat-summary-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `discord-chat-to-md` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `discord-chat-to-pdf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `docx-to-html` | lossy-encoding | ✓ | n/a | docx or html uses lossy encoding |
| `docx-to-pdf` | lossy-encoding | ✓ | ✓ | docx or pdf uses lossy encoding |
| `docx-to-txt` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `dst-to-exp` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `dst-to-jef` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `dst-to-pes` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `dxf-to-json` | cross-kind | (`json-to-dxf` missing) | ✓ | vector -> data: cross-domain, inherently lossy |
| `dxf-to-svg` | lossy-encoding | (`svg-to-dxf` missing) | ✓ | dxf or svg uses lossy encoding |
| `edi-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `edifact-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `eml-to-csv` | bijective-candidate | (`csv-to-eml` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `eml-to-html` | cross-kind | (`html-to-eml` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `eml-to-mbox` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `eml-to-pdf` | cross-kind | (`pdf-to-eml` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `endnote-xml-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `env-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `epub-to-html` | lossy-encoding | (`html-to-epub` missing) | n/a | epub or html uses lossy encoding |
| `epub-to-pdf` | lossy-encoding | (`pdf-to-epub` missing) | ✓ | epub or pdf uses lossy encoding |
| `epub-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `exp-to-dst` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `exp-to-jef` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `exp-to-pes` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `facebook-archive-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `fen-to-pgn` | lossy-encoding | ✓ | n/a | fen or pgn uses lossy encoding |
| `fen-to-png` | cross-kind | (`png-to-fen` missing) | ✓ | data -> raster: cross-domain, inherently lossy |
| `fhir-bundle-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `file-to-md5` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `file-to-sha1` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `file-to-sha256` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `file-to-sha512` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `flac-to-mp3` | lossy-encoding | ✓ | ✓ | flac or mp3 uses lossy encoding |
| `gedcom-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gedcom-to-html` | cross-kind | (`html-to-gedcom` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `gedcom-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gedcom-to-pdf` | cross-kind | (`pdf-to-gedcom` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `gedcom-to-xlsx` | bijective-candidate | (`xlsx-to-gedcom` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `geojson-to-gpx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `geojson-to-kml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gif-to-jpg` | lossy-encoding | ✓ | ✓ | gif or jpg uses lossy encoding |
| `gif-to-mp4` | cross-kind | ✓ | ✓ | raster -> video: cross-domain, inherently lossy |
| `gif-to-png` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `glb-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `glb-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `gpl-to-aco` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `gpl-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `gpl-to-hex` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `gpx-to-geojson` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gpx-to-kml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `hcl-to-json` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `heic-to-jpg` | lossy-encoding | (`jpg-to-heic` missing) | ✓ | heic or jpg uses lossy encoding |
| `heic-to-pdf` | cross-kind | (`pdf-to-heic` missing) | ✓ | raster -> doc: cross-domain, inherently lossy |
| `heic-to-png` | lossy-encoding | (`png-to-heic` missing) | ✓ | heic or png uses lossy encoding |
| `heic-to-webp` | lossy-encoding | (`webp-to-heic` missing) | ✓ | heic or webp uses lossy encoding |
| `hex-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `hex-to-cmyk` | cross-kind | ✓ | ✓ | palette -> color: cross-domain, inherently lossy |
| `hex-to-color-name` | cross-kind | ✓ | ✓ | palette -> color: cross-domain, inherently lossy |
| `hex-to-gpl` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `hex-to-hsl` | cross-kind | ✓ | ✓ | palette -> color: cross-domain, inherently lossy |
| `hex-to-lab` | cross-kind | ✓ | ✓ | palette -> color: cross-domain, inherently lossy |
| `hex-to-oklch` | cross-kind | ✓ | ✓ | palette -> color: cross-domain, inherently lossy |
| `hex-to-rgb` | cross-kind | ✓ | ✓ | palette -> color: cross-domain, inherently lossy |
| `hex-to-text` | cross-kind | ✓ | ✓ | palette -> encoding: cross-domain, inherently lossy |
| `hl7-to-csv` | bijective-candidate | (`csv-to-hl7` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `hl7-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `hsl-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `hsl-to-rgb` | lossy-encoding | ✓ | ✓ | hsl or rgb uses lossy encoding |
| `html-table-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `html-to-docx` | lossy-encoding | ✓ | n/a | html or docx uses lossy encoding |
| `html-to-markdown` | lossy-encoding | ✓ | n/a | html or markdown uses lossy encoding |
| `ico-to-jpg` | lossy-encoding | ✓ | ✓ | ico or jpg uses lossy encoding |
| `ico-to-png` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `ifc-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `ifc-to-gltf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `image-to-text` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `ini-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `instagram-data-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `instagram-data-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `iso-to-unix` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `jef-to-dst` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `jef-to-exp` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `jef-to-pes` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `jpg-to-avif` | lossy-encoding | ✓ | ✓ | jpg or avif uses lossy encoding |
| `jpg-to-bmp` | lossy-encoding | ✓ | ✓ | jpg or bmp uses lossy encoding |
| `jpg-to-gif` | lossy-encoding | ✓ | ✓ | jpg or gif uses lossy encoding |
| `jpg-to-ico` | lossy-encoding | ✓ | ✓ | jpg or ico uses lossy encoding |
| `jpg-to-pdf` | cross-kind | ✓ | ✓ | raster -> doc: cross-domain, inherently lossy |
| `jpg-to-png` | lossy-encoding | ✓ | ✓ | jpg or png uses lossy encoding |
| `jpg-to-text` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `jpg-to-webp` | lossy-encoding | ✓ | ✓ | jpg or webp uses lossy encoding |
| `json-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-env` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-gedcom` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-hl7` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-ini` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-jsonl` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-po` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-properties` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-sql` | bijective-candidate | (`sql-to-json` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `json-to-toml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-tsv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-yaml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json5-to-json` | bijective-candidate | (`json-to-json5` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `jsonl-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `jsonl-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `jwt-to-json` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `keynote-to-pdf` | lossy-encoding | (`pdf-to-keynote` missing) | n/a | keynote or pdf uses lossy encoding |
| `kindle-clippings-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-json` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-markdown` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-notion-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-obsidian-md` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kindle-clippings-to-readwise-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `kml-to-geojson` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `kml-to-gpx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `lab-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `m4a-to-mp3` | lossy-encoding | ✓ | ✓ | m4a or mp3 uses lossy encoding |
| `markdown-table-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `markdown-to-html` | lossy-encoding | ✓ | n/a | markdown or html uses lossy encoding |
| `markdown-to-pdf` | lossy-encoding | (`pdf-to-markdown` missing) | n/a | markdown or pdf uses lossy encoding |
| `mbox-to-csv` | bijective-candidate | (`csv-to-mbox` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `mbox-to-eml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mbox-to-pdf` | cross-kind | (`pdf-to-mbox` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `midi-to-musicxml` | lossy-encoding | ✓ | n/a | midi or musicxml uses lossy encoding |
| `mkv-to-mp4` | lossy-encoding | ✓ | ✓ | mkv or mp4 uses lossy encoding |
| `mov-to-mp4` | lossy-encoding | ✓ | ✓ | mov or mp4 uses lossy encoding |
| `mp3-to-flac` | lossy-encoding | ✓ | ✓ | mp3 or flac uses lossy encoding |
| `mp3-to-m4a` | lossy-encoding | ✓ | ✓ | mp3 or m4a uses lossy encoding |
| `mp3-to-ogg` | lossy-encoding | ✓ | ✓ | mp3 or ogg uses lossy encoding |
| `mp3-to-wav` | lossy-encoding | ✓ | ✓ | mp3 or wav uses lossy encoding |
| `mp4-to-avi` | lossy-encoding | ✓ | ✓ | mp4 or avi uses lossy encoding |
| `mp4-to-gif` | cross-kind | ✓ | ✓ | video -> raster: cross-domain, inherently lossy |
| `mp4-to-mkv` | lossy-encoding | ✓ | ✓ | mp4 or mkv uses lossy encoding |
| `mp4-to-mov` | lossy-encoding | ✓ | ✓ | mp4 or mov uses lossy encoding |
| `mp4-to-mp3` | cross-kind | (`mp3-to-mp4` missing) | ✓ | video -> audio: cross-domain, inherently lossy |
| `musicxml-to-midi` | lossy-encoding | ✓ | n/a | musicxml or midi uses lossy encoding |
| `musicxml-to-mxl` | bijective-candidate | ✓ | ✓ | both lossless notation formats; should round-trip cleanly |
| `mxl-to-musicxml` | bijective-candidate | ✓ | ✓ | both lossless notation formats; should round-trip cleanly |
| `nbib-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-xlsx` | bijective-candidate | (`xlsx-to-nbib` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `numbers-to-pdf` | lossy-encoding | (`pdf-to-numbers` missing) | n/a | numbers or pdf uses lossy encoding |
| `obj-to-3mf` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `obj-to-glb` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `obj-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `ods-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ods-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ofx-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ofx-to-qif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ogg-to-mp3` | lossy-encoding | ✓ | ✓ | ogg or mp3 uses lossy encoding |
| `oklch-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `oklch-to-rgb` | lossy-encoding | ✓ | n/a | oklch or rgb uses lossy encoding |
| `opt-to-csv` | bijective-candidate | (`csv-to-opt` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `otf-to-ttf` | bijective-candidate | (`ttf-to-otf` missing) | n/a | both lossless font formats; should round-trip cleanly |
| `pacer-docket-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `pages-to-pdf` | lossy-encoding | (`pdf-to-pages` missing) | ✓ | pages or pdf uses lossy encoding |
| `pdf-to-docx` | lossy-encoding | ✓ | ✓ | pdf or docx uses lossy encoding |
| `pdf-to-jpg` | cross-kind | ✓ | ✓ | doc -> raster: cross-domain, inherently lossy |
| `pdf-to-png` | cross-kind | ✓ | ✓ | doc -> raster: cross-domain, inherently lossy |
| `pdf-to-text` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `pem-to-der` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `pes-to-dst` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `pes-to-exp` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `pes-to-jef` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `pgn-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `pgn-to-fen` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `pgn-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `png-to-avif` | lossy-encoding | ✓ | ✓ | png or avif uses lossy encoding |
| `png-to-bmp` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `png-to-gif` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `png-to-ico` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `png-to-jpg` | lossy-encoding | ✓ | ✓ | png or jpg uses lossy encoding |
| `png-to-pdf` | cross-kind | ✓ | ✓ | raster -> doc: cross-domain, inherently lossy |
| `png-to-text` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `png-to-webp` | lossy-encoding | ✓ | ✓ | png or webp uses lossy encoding |
| `po-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `po-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `properties-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qbo-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qfx-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qif-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qif-to-ofx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `remove-background` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `rgb-to-cmyk` | lossy-encoding | ✓ | ✓ | rgb or cmyk uses lossy encoding |
| `rgb-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `rgb-to-hsl` | lossy-encoding | ✓ | ✓ | rgb or hsl uses lossy encoding |
| `rgb-to-oklch` | lossy-encoding | ✓ | n/a | rgb or oklch uses lossy encoding |
| `ris-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-xlsx` | bijective-candidate | (`xlsx-to-ris` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `sarif-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `sarif-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `sbv-to-srt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `sql-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `srt-to-ass` | lossy-encoding | ✓ | ✓ | srt or ass uses lossy encoding |
| `srt-to-sbv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `srt-to-vtt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `stl-to-3mf` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `stl-to-glb` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `stl-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `svg-to-jpg` | cross-kind | (`jpg-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `svg-to-png` | cross-kind | (`png-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `text-to-base64` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `text-to-hex` | cross-kind | ✓ | ✓ | encoding -> palette: cross-domain, inherently lossy |
| `text-to-url-encoded` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `tiff-to-jpg` | lossy-encoding | (`jpg-to-tiff` missing) | ✓ | tiff or jpg uses lossy encoding |
| `tiff-to-pdf` | cross-kind | (`pdf-to-tiff` missing) | ✓ | raster -> doc: cross-domain, inherently lossy |
| `tiff-to-png` | bijective-candidate | (`png-to-tiff` missing) | ✓ | both lossless raster formats; should round-trip cleanly |
| `timestamp-to-readable` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `toml-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `toml-to-yaml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `tsv-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `tsv-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `tsv-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ttf-to-woff` | bijective-candidate | ✓ | ✗ MISSING | both lossless font formats; should round-trip cleanly |
| `twitter-archive-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `twitter-archive-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `txt-to-docx` | lossy-encoding | ✓ | n/a | txt or docx uses lossy encoding |
| `unix-to-iso` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `url-encoded-to-text` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `vtt-to-ass` | lossy-encoding | ✓ | ✓ | vtt or ass uses lossy encoding |
| `vtt-to-srt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `wav-to-mp3` | lossy-encoding | ✓ | ✓ | wav or mp3 uses lossy encoding |
| `webm-to-mp4` | lossy-encoding | (`mp4-to-webm` missing) | ✓ | webm or mp4 uses lossy encoding |
| `webp-to-avif` | lossy-encoding | ✓ | ✓ | webp or avif uses lossy encoding |
| `webp-to-jpg` | lossy-encoding | ✓ | ✓ | webp or jpg uses lossy encoding |
| `webp-to-pdf` | cross-kind | (`pdf-to-webp` missing) | ✓ | raster -> doc: cross-domain, inherently lossy |
| `webp-to-png` | lossy-encoding | ✓ | ✓ | webp or png uses lossy encoding |
| `whatsapp-chat-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-pdf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `woff-to-ttf` | bijective-candidate | ✓ | ✗ MISSING | both lossless font formats; should round-trip cleanly |
| `xlsx-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-ods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-tsv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xml-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-toml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
