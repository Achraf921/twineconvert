# Bijectivity Audit

Generated 2026-06-13 from src/lib/engine/converters/.

## Summary

| Classification | Count |
|---|---:|
| Total converters | 519 |
| **Bijective candidates** (lossless, same-kind, both directions exist) | 242 |
| **Bijective candidates missing reverse converter** | 34 |
| **Bijective candidates missing round-trip test** | 24 |
| Lossy encoding (same kind, but lossy format) | 114 |
| Cross-kind (raster→doc, video→audio, etc., inherently lossy) | 76 |
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
| `csl-json-to-xlsx` | `xlsx-to-csl-json` |
| `csl-json-to-yaml` | `yaml-to-csl-json` |
| `dicom-to-json` | `json-to-dicom` |
| `eml-to-csv` | `csv-to-eml` |
| `endnote-xml-to-xlsx` | `xlsx-to-endnote-xml` |
| `endnote-xml-to-yaml` | `yaml-to-endnote-xml` |
| `enw-to-xlsx` | `xlsx-to-enw` |
| `enw-to-yaml` | `yaml-to-enw` |
| `gedcom-to-xlsx` | `xlsx-to-gedcom` |
| `hl7-to-csv` | `csv-to-hl7` |
| `ico-to-bmp` | `bmp-to-ico` |
| `ico-to-gif` | `gif-to-ico` |
| `ics-to-json` | `json-to-ics` |
| `ics-to-xlsx` | `xlsx-to-ics` |
| `json-to-sql` | `sql-to-json` |
| `json5-to-json` | `json-to-json5` |
| `lrc-to-vtt` | `vtt-to-lrc` |
| `mbox-to-csv` | `csv-to-mbox` |
| `mods-to-xlsx` | `xlsx-to-mods` |
| `mods-to-yaml` | `yaml-to-mods` |
| `nbib-to-xlsx` | `xlsx-to-nbib` |
| `nbib-to-yaml` | `yaml-to-nbib` |
| `opt-to-csv` | `csv-to-opt` |
| `otf-to-ttf` | `ttf-to-otf` |
| `refworks-to-xlsx` | `xlsx-to-refworks` |
| `refworks-to-yaml` | `yaml-to-refworks` |
| `ris-to-xlsx` | `xlsx-to-ris` |
| `ris-to-yaml` | `yaml-to-ris` |
| `tiff-to-png` | `png-to-tiff` |
| `vcf-to-json` | `json-to-vcf` |
| `vcf-to-xlsx` | `xlsx-to-vcf` |
| `xml-to-csv` | `csv-to-xml` |

### 3. Bijective pairs MISSING a round-trip test

Both directions exist and are theoretically lossless, but no round-trip test verifies it. These are the highest-leverage tests to add (they catch bugs in EITHER direction).

| Pair | A→B | B→A |
|---|---|---|
| bibtex ↔ enw | `bibtex-to-enw` | `enw-to-bibtex` |
| bibtex ↔ refworks | `bibtex-to-refworks` | `refworks-to-bibtex` |
| csl-json ↔ enw | `csl-json-to-enw` | `enw-to-csl-json` |
| csl-json ↔ refworks | `csl-json-to-refworks` | `refworks-to-csl-json` |
| csv ↔ ics | `csv-to-ics` | `ics-to-csv` |
| csv ↔ vcf | `csv-to-vcf` | `vcf-to-csv` |
| endnote-xml ↔ enw | `endnote-xml-to-enw` | `enw-to-endnote-xml` |
| endnote-xml ↔ refworks | `endnote-xml-to-refworks` | `refworks-to-endnote-xml` |
| enw ↔ nbib | `enw-to-nbib` | `nbib-to-enw` |
| lrc ↔ srt | `lrc-to-srt` | `srt-to-lrc` |
| mods ↔ endnote-xml | `mods-to-endnote-xml` | `endnote-xml-to-mods` |
| nbib ↔ refworks | `nbib-to-refworks` | `refworks-to-nbib` |
| refworks ↔ csv | `refworks-to-csv` | `csv-to-refworks` |
| ttf ↔ woff | `ttf-to-woff` | `woff-to-ttf` |

## Full Classification Table

| Converter | Type | Has reverse? | Round-trip test? | Note |
|---|---|---|---|---|
| `3dl-to-csp` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `3dl-to-cube` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `3gp-to-mp4` | lossy-encoding | (`mp4-to-3gp` missing) | n/a | 3gp or mp4 uses lossy encoding |
| `3mf-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `3mf-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `aac-to-mp3` | lossy-encoding | ✓ | n/a | aac or mp3 uses lossy encoding |
| `aco-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `aco-to-gpl` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `adif-to-cabrillo` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `adif-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `adif-to-kml` | bijective-candidate | (`kml-to-adif` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `aiff-to-mp3` | lossy-encoding | (`mp3-to-aiff` missing) | n/a | aiff or mp3 uses lossy encoding |
| `amr-to-mp3` | lossy-encoding | (`mp3-to-amr` missing) | n/a | amr or mp3 uses lossy encoding |
| `apple-health-heart-rate-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-sleep-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-steps-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `apple-health-workouts-to-csv` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `asciidoc-to-html` | cross-kind | (`html-to-asciidoc` missing) | ✓ | markup -> doc: cross-domain, inherently lossy |
| `ase-to-aco` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-css` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-gpl` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-hex` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `ase-to-json` | cross-kind | (`json-to-ase` missing) | n/a | palette -> data: cross-domain, inherently lossy |
| `ass-to-sbv` | lossy-encoding | ✓ | ✓ | ass or sbv uses lossy encoding |
| `ass-to-srt` | lossy-encoding | ✓ | ✓ | ass or srt uses lossy encoding |
| `ass-to-txt` | cross-kind | (`txt-to-ass` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `ass-to-vtt` | lossy-encoding | ✓ | ✓ | ass or vtt uses lossy encoding |
| `avi-to-mp4` | lossy-encoding | ✓ | ✓ | avi or mp4 uses lossy encoding |
| `avif-to-bmp` | lossy-encoding | ✓ | ✓ | avif or bmp uses lossy encoding |
| `avif-to-gif` | lossy-encoding | ✓ | ✓ | avif or gif uses lossy encoding |
| `avif-to-jpg` | lossy-encoding | ✓ | ✓ | avif or jpg uses lossy encoding |
| `avif-to-png` | lossy-encoding | ✓ | ✓ | avif or png uses lossy encoding |
| `avif-to-webp` | lossy-encoding | ✓ | ✓ | avif or webp uses lossy encoding |
| `base64-to-text` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `bencode-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-enw` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `bibtex-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `bibtex-to-markdown` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `bibtex-to-mods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-refworks` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `bibtex-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bibtex-to-xlsx` | bijective-candidate | (`xlsx-to-bibtex` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `bibtex-to-yaml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `bmp-to-avif` | lossy-encoding | ✓ | ✓ | bmp or avif uses lossy encoding |
| `bmp-to-gif` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `bmp-to-jpg` | lossy-encoding | ✓ | ✓ | bmp or jpg uses lossy encoding |
| `bmp-to-png` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `bmp-to-webp` | lossy-encoding | ✓ | ✓ | bmp or webp uses lossy encoding |
| `cabrillo-to-adif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `cbor-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ccda-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `ccda-to-json` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `cmyk-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `cmyk-to-rgb` | lossy-encoding | ✓ | ✓ | cmyk or rgb uses lossy encoding |
| `color-name-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `compress-pdf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `csl-json-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-enw` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csl-json-to-html` | cross-kind | (`html-to-csl-json` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `csl-json-to-markdown` | cross-kind | (`markdown-to-csl-json` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `csl-json-to-mods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-refworks` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csl-json-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-xlsx` | bijective-candidate | (`xlsx-to-csl-json` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `csl-json-to-yaml` | bijective-candidate | (`yaml-to-csl-json` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `csp-to-3dl` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `csp-to-cube` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `css-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `csv-to-adif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-dat` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-enw` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-fhir-bundle` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-gedcom` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-html` | cross-kind | (`html-to-csv` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `csv-to-html-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ics` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-jsonl` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-markdown-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-mods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ofx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-po` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qbo` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qfx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-qif` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-refworks` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-sql` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-tsv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-vcf` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `csv-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `csv-to-yaml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `cube-to-3dl` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `cube-to-csp` | bijective-candidate | ✓ | ✓ | both lossless lut formats; should round-trip cleanly |
| `curl-to-har` | cross-kind | ✓ | ✓ | markup -> data: cross-domain, inherently lossy |
| `dat-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `der-to-pem` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `dicom-to-jpg` | cross-kind | (`jpg-to-dicom` missing) | n/a | data -> raster: cross-domain, inherently lossy |
| `dicom-to-json` | bijective-candidate | (`json-to-dicom` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `dicom-to-pdf` | cross-kind | (`pdf-to-dicom` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `dicom-to-png` | cross-kind | (`png-to-dicom` missing) | n/a | data -> raster: cross-domain, inherently lossy |
| `discord-chat-summary-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `discord-chat-to-md` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `discord-chat-to-pdf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `docx-to-html` | lossy-encoding | ✓ | n/a | docx or html uses lossy encoding |
| `docx-to-pdf` | lossy-encoding | ✓ | ✓ | docx or pdf uses lossy encoding |
| `docx-to-txt` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `dot-to-png` | cross-kind | (`png-to-dot` missing) | ✓ | markup -> raster: cross-domain, inherently lossy |
| `dot-to-svg` | cross-kind | (`svg-to-dot` missing) | ✓ | markup -> vector: cross-domain, inherently lossy |
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
| `endnote-xml-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-enw` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-html` | cross-kind | (`html-to-endnote-xml` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `endnote-xml-to-markdown` | cross-kind | (`markdown-to-endnote-xml` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `endnote-xml-to-mods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-refworks` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-xlsx` | bijective-candidate | (`xlsx-to-endnote-xml` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `endnote-xml-to-yaml` | bijective-candidate | (`yaml-to-endnote-xml` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `env-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `enw-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `enw-to-csl-json` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `enw-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `enw-to-endnote-xml` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `enw-to-html` | cross-kind | (`html-to-enw` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `enw-to-markdown` | cross-kind | (`markdown-to-enw` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `enw-to-nbib` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `enw-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `enw-to-xlsx` | bijective-candidate | (`xlsx-to-enw` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `enw-to-yaml` | bijective-candidate | (`yaml-to-enw` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `epub-to-html` | lossy-encoding | (`html-to-epub` missing) | n/a | epub or html uses lossy encoding |
| `epub-to-pdf` | lossy-encoding | (`pdf-to-epub` missing) | ✓ | epub or pdf uses lossy encoding |
| `epub-to-text` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `exp-to-dst` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `exp-to-jef` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `exp-to-pes` | bijective-candidate | ✓ | ✓ | both lossless embroidery formats; should round-trip cleanly |
| `facebook-archive-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `fasta-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `fastq-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `fen-to-pgn` | lossy-encoding | ✓ | n/a | fen or pgn uses lossy encoding |
| `fen-to-png` | cross-kind | (`png-to-fen` missing) | ✓ | data -> raster: cross-domain, inherently lossy |
| `fhir-bundle-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `file-to-md5` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `file-to-sha1` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `file-to-sha256` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `file-to-sha512` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `flac-to-mp3` | lossy-encoding | ✓ | ✓ | flac or mp3 uses lossy encoding |
| `flv-to-mp4` | lossy-encoding | (`mp4-to-flv` missing) | n/a | flv or mp4 uses lossy encoding |
| `gedcom-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gedcom-to-html` | cross-kind | (`html-to-gedcom` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `gedcom-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gedcom-to-pdf` | cross-kind | (`pdf-to-gedcom` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `gedcom-to-xlsx` | bijective-candidate | (`xlsx-to-gedcom` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `geojson-to-gpx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `geojson-to-kml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `geojson-to-wkb` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `geojson-to-wkt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gif-to-avif` | lossy-encoding | ✓ | ✓ | gif or avif uses lossy encoding |
| `gif-to-bmp` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `gif-to-jpg` | lossy-encoding | ✓ | ✓ | gif or jpg uses lossy encoding |
| `gif-to-mp4` | cross-kind | ✓ | ✓ | raster -> video: cross-domain, inherently lossy |
| `gif-to-png` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `gif-to-webp` | lossy-encoding | ✓ | ✓ | gif or webp uses lossy encoding |
| `glb-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `glb-to-stl` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `gpl-to-aco` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `gpl-to-ase` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `gpl-to-hex` | bijective-candidate | ✓ | ✓ | both lossless palette formats; should round-trip cleanly |
| `gpx-to-geojson` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `gpx-to-kml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `har-to-curl` | cross-kind | ✓ | ✓ | data -> markup: cross-domain, inherently lossy |
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
| `html-table-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `html-table-to-markdown-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `html-table-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `html-to-docx` | lossy-encoding | ✓ | n/a | html or docx uses lossy encoding |
| `html-to-markdown` | lossy-encoding | ✓ | n/a | html or markdown uses lossy encoding |
| `ico-to-avif` | lossy-encoding | (`avif-to-ico` missing) | ✓ | ico or avif uses lossy encoding |
| `ico-to-bmp` | bijective-candidate | (`bmp-to-ico` missing) | ✓ | both lossless raster formats; should round-trip cleanly |
| `ico-to-gif` | bijective-candidate | (`gif-to-ico` missing) | ✓ | both lossless raster formats; should round-trip cleanly |
| `ico-to-jpg` | lossy-encoding | ✓ | ✓ | ico or jpg uses lossy encoding |
| `ico-to-png` | bijective-candidate | ✓ | ✓ | both lossless raster formats; should round-trip cleanly |
| `ico-to-webp` | lossy-encoding | (`webp-to-ico` missing) | ✓ | ico or webp uses lossy encoding |
| `ics-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `ics-to-json` | bijective-candidate | (`json-to-ics` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `ics-to-xlsx` | bijective-candidate | (`xlsx-to-ics` missing) | n/a | both lossless data formats; should round-trip cleanly |
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
| `json-to-bencode` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-cbor` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-env` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-fasta` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-fastq` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-gedcom` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-hl7` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-html-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-ini` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-jsonl` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-markdown-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `json-to-msgpack` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
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
| `lrc-to-srt` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `lrc-to-txt` | cross-kind | (`txt-to-lrc` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `lrc-to-vtt` | bijective-candidate | (`vtt-to-lrc` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `m4a-to-mp3` | lossy-encoding | ✓ | ✓ | m4a or mp3 uses lossy encoding |
| `m4v-to-mp4` | lossy-encoding | (`mp4-to-m4v` missing) | ✓ | m4v or mp4 uses lossy encoding |
| `marcxml-to-bibtex` | lossy-encoding | (`bibtex-to-marcxml` missing) | ✓ | marcxml or bibtex uses lossy encoding |
| `marcxml-to-csl-json` | lossy-encoding | (`csl-json-to-marcxml` missing) | ✓ | marcxml or csl-json uses lossy encoding |
| `marcxml-to-csv` | lossy-encoding | (`csv-to-marcxml` missing) | ✓ | marcxml or csv uses lossy encoding |
| `marcxml-to-endnote-xml` | lossy-encoding | (`endnote-xml-to-marcxml` missing) | n/a | marcxml or endnote-xml uses lossy encoding |
| `marcxml-to-html` | cross-kind | (`html-to-marcxml` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `marcxml-to-markdown` | cross-kind | (`markdown-to-marcxml` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `marcxml-to-nbib` | lossy-encoding | (`nbib-to-marcxml` missing) | n/a | marcxml or nbib uses lossy encoding |
| `marcxml-to-ris` | lossy-encoding | (`ris-to-marcxml` missing) | ✓ | marcxml or ris uses lossy encoding |
| `marcxml-to-xlsx` | lossy-encoding | (`xlsx-to-marcxml` missing) | ✓ | marcxml or xlsx uses lossy encoding |
| `marcxml-to-yaml` | lossy-encoding | (`yaml-to-marcxml` missing) | n/a | marcxml or yaml uses lossy encoding |
| `markdown-table-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `markdown-table-to-html-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `markdown-table-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `markdown-table-to-xlsx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `markdown-to-html` | lossy-encoding | ✓ | n/a | markdown or html uses lossy encoding |
| `markdown-to-pdf` | lossy-encoding | (`pdf-to-markdown` missing) | n/a | markdown or pdf uses lossy encoding |
| `mbox-to-csv` | bijective-candidate | (`csv-to-mbox` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `mbox-to-eml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mbox-to-pdf` | cross-kind | (`pdf-to-mbox` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `midi-to-musicxml` | lossy-encoding | ✓ | n/a | midi or musicxml uses lossy encoding |
| `mkv-to-mp4` | lossy-encoding | ✓ | ✓ | mkv or mp4 uses lossy encoding |
| `mods-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mods-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mods-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mods-to-endnote-xml` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `mods-to-html` | cross-kind | (`html-to-mods` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `mods-to-markdown` | cross-kind | (`markdown-to-mods` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `mods-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mods-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mods-to-xlsx` | bijective-candidate | (`xlsx-to-mods` missing) | ✓ | both lossless data formats; should round-trip cleanly |
| `mods-to-yaml` | bijective-candidate | (`yaml-to-mods` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `mov-to-gif` | cross-kind | (`gif-to-mov` missing) | ✓ | video -> raster: cross-domain, inherently lossy |
| `mov-to-mp4` | lossy-encoding | ✓ | ✓ | mov or mp4 uses lossy encoding |
| `mp3-to-aac` | lossy-encoding | ✓ | n/a | mp3 or aac uses lossy encoding |
| `mp3-to-flac` | lossy-encoding | ✓ | ✓ | mp3 or flac uses lossy encoding |
| `mp3-to-m4a` | lossy-encoding | ✓ | ✓ | mp3 or m4a uses lossy encoding |
| `mp3-to-m4r` | lossy-encoding | (`m4r-to-mp3` missing) | n/a | mp3 or m4r uses lossy encoding |
| `mp3-to-ogg` | lossy-encoding | ✓ | ✓ | mp3 or ogg uses lossy encoding |
| `mp3-to-wav` | lossy-encoding | ✓ | ✓ | mp3 or wav uses lossy encoding |
| `mp4-to-avi` | lossy-encoding | ✓ | ✓ | mp4 or avi uses lossy encoding |
| `mp4-to-gif` | cross-kind | ✓ | ✓ | video -> raster: cross-domain, inherently lossy |
| `mp4-to-mkv` | lossy-encoding | ✓ | ✓ | mp4 or mkv uses lossy encoding |
| `mp4-to-mov` | lossy-encoding | ✓ | ✓ | mp4 or mov uses lossy encoding |
| `mp4-to-mp3` | cross-kind | (`mp3-to-mp4` missing) | ✓ | video -> audio: cross-domain, inherently lossy |
| `mp4-to-webm` | lossy-encoding | ✓ | ✓ | mp4 or webm uses lossy encoding |
| `mpeg-to-mp4` | lossy-encoding | (`mp4-to-mpeg` missing) | n/a | mpeg or mp4 uses lossy encoding |
| `mpg-to-mp4` | lossy-encoding | (`mp4-to-mpg` missing) | n/a | mpg or mp4 uses lossy encoding |
| `msg-to-csv` | cross-kind | (`csv-to-msg` missing) | n/a | doc -> data: cross-domain, inherently lossy |
| `msg-to-eml` | cross-kind | (`eml-to-msg` missing) | n/a | doc -> data: cross-domain, inherently lossy |
| `msg-to-pdf` | lossy-encoding | (`pdf-to-msg` missing) | n/a | msg or pdf uses lossy encoding |
| `msgpack-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `mts-to-mp4` | lossy-encoding | (`mp4-to-mts` missing) | n/a | mts or mp4 uses lossy encoding |
| `musicxml-to-midi` | lossy-encoding | ✓ | n/a | musicxml or midi uses lossy encoding |
| `musicxml-to-mxl` | bijective-candidate | ✓ | ✓ | both lossless notation formats; should round-trip cleanly |
| `musicxml-to-pdf` | cross-kind | (`pdf-to-musicxml` missing) | ✓ | notation -> doc: cross-domain, inherently lossy |
| `musicxml-to-svg` | cross-kind | (`svg-to-musicxml` missing) | ✓ | notation -> vector: cross-domain, inherently lossy |
| `mxl-to-musicxml` | bijective-candidate | ✓ | ✓ | both lossless notation formats; should round-trip cleanly |
| `mxl-to-svg` | cross-kind | (`svg-to-mxl` missing) | ✓ | notation -> vector: cross-domain, inherently lossy |
| `nbib-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-enw` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `nbib-to-html` | cross-kind | (`html-to-nbib` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `nbib-to-markdown` | cross-kind | (`markdown-to-nbib` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `nbib-to-mods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-refworks` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `nbib-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `nbib-to-xlsx` | bijective-candidate | (`xlsx-to-nbib` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `nbib-to-yaml` | bijective-candidate | (`yaml-to-nbib` missing) | n/a | both lossless data formats; should round-trip cleanly |
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
| `opus-to-mp3` | lossy-encoding | (`mp3-to-opus` missing) | n/a | opus or mp3 uses lossy encoding |
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
| `psd-to-jpg` | lossy-encoding | (`jpg-to-psd` missing) | ✓ | psd or jpg uses lossy encoding |
| `psd-to-png` | lossy-encoding | (`png-to-psd` missing) | ✓ | psd or png uses lossy encoding |
| `qbo-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qfx-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qif-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `qif-to-ofx` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `refworks-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `refworks-to-csl-json` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `refworks-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `refworks-to-endnote-xml` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `refworks-to-html` | cross-kind | (`html-to-refworks` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `refworks-to-markdown` | cross-kind | (`markdown-to-refworks` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `refworks-to-nbib` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `refworks-to-ris` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `refworks-to-xlsx` | bijective-candidate | (`xlsx-to-refworks` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `refworks-to-yaml` | bijective-candidate | (`yaml-to-refworks` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `remove-background` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `rgb-to-cmyk` | lossy-encoding | ✓ | ✓ | rgb or cmyk uses lossy encoding |
| `rgb-to-hex` | cross-kind | ✓ | ✓ | color -> palette: cross-domain, inherently lossy |
| `rgb-to-hsl` | lossy-encoding | ✓ | ✓ | rgb or hsl uses lossy encoding |
| `rgb-to-oklch` | lossy-encoding | ✓ | n/a | rgb or oklch uses lossy encoding |
| `ris-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-csl-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-endnote-xml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-enw` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-html` | cross-kind | (`html-to-ris` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `ris-to-markdown` | cross-kind | (`markdown-to-ris` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `ris-to-mods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-nbib` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-refworks` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `ris-to-xlsx` | bijective-candidate | (`xlsx-to-ris` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `ris-to-yaml` | bijective-candidate | (`yaml-to-ris` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `rtf-to-html` | lossy-encoding | (`html-to-rtf` missing) | n/a | rtf or html uses lossy encoding |
| `rtf-to-txt` | lossy-encoding | (`txt-to-rtf` missing) | n/a | rtf or txt uses lossy encoding |
| `sarif-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `sarif-to-html` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `sbv-to-ass` | lossy-encoding | ✓ | ✓ | sbv or ass uses lossy encoding |
| `sbv-to-srt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `sbv-to-txt` | cross-kind | (`txt-to-sbv` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `sbv-to-vtt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `sql-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `srt-to-ass` | lossy-encoding | ✓ | ✓ | srt or ass uses lossy encoding |
| `srt-to-lrc` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `srt-to-sbv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `srt-to-txt` | cross-kind | (`txt-to-srt` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `srt-to-vtt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `stl-to-3mf` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `stl-to-glb` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `stl-to-obj` | bijective-candidate | ✓ | ✓ | both lossless mesh formats; should round-trip cleanly |
| `svg-to-avif` | cross-kind | (`avif-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `svg-to-bmp` | cross-kind | (`bmp-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `svg-to-gif` | cross-kind | (`gif-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `svg-to-jpg` | cross-kind | (`jpg-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `svg-to-png` | cross-kind | (`png-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `svg-to-webp` | cross-kind | (`webp-to-svg` missing) | ✓ | vector -> raster: cross-domain, inherently lossy |
| `text-to-base64` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `text-to-hex` | cross-kind | ✓ | ✓ | encoding -> palette: cross-domain, inherently lossy |
| `text-to-url-encoded` | bijective-candidate | ✓ | ✓ | both lossless encoding formats; should round-trip cleanly |
| `tiff-to-jpg` | lossy-encoding | (`jpg-to-tiff` missing) | ✓ | tiff or jpg uses lossy encoding |
| `tiff-to-pdf` | cross-kind | (`pdf-to-tiff` missing) | ✓ | raster -> doc: cross-domain, inherently lossy |
| `tiff-to-png` | bijective-candidate | (`png-to-tiff` missing) | ✓ | both lossless raster formats; should round-trip cleanly |
| `tiff-to-webp` | lossy-encoding | (`webp-to-tiff` missing) | ✓ | tiff or webp uses lossy encoding |
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
| `vcf-to-csv` | bijective-candidate | ✓ | ✗ MISSING | both lossless data formats; should round-trip cleanly |
| `vcf-to-json` | bijective-candidate | (`json-to-vcf` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `vcf-to-xlsx` | bijective-candidate | (`xlsx-to-vcf` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `vob-to-mp4` | lossy-encoding | (`mp4-to-vob` missing) | n/a | vob or mp4 uses lossy encoding |
| `vtt-to-ass` | lossy-encoding | ✓ | ✓ | vtt or ass uses lossy encoding |
| `vtt-to-sbv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `vtt-to-srt` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `vtt-to-txt` | cross-kind | (`txt-to-vtt` missing) | ✓ | data -> doc: cross-domain, inherently lossy |
| `wav-to-mp3` | lossy-encoding | ✓ | ✓ | wav or mp3 uses lossy encoding |
| `webm-to-mp4` | lossy-encoding | ✓ | ✓ | webm or mp4 uses lossy encoding |
| `webp-to-avif` | lossy-encoding | ✓ | ✓ | webp or avif uses lossy encoding |
| `webp-to-bmp` | lossy-encoding | ✓ | ✓ | webp or bmp uses lossy encoding |
| `webp-to-gif` | lossy-encoding | ✓ | ✓ | webp or gif uses lossy encoding |
| `webp-to-jpg` | lossy-encoding | ✓ | ✓ | webp or jpg uses lossy encoding |
| `webp-to-pdf` | cross-kind | (`pdf-to-webp` missing) | ✓ | raster -> doc: cross-domain, inherently lossy |
| `webp-to-png` | lossy-encoding | ✓ | ✓ | webp or png uses lossy encoding |
| `whatsapp-chat-to-csv` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-html` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-json` | single-action | n/a | n/a | no reverse possible (X has no canonical inverse) |
| `whatsapp-chat-to-pdf` | single-action | n/a | ✓ | no reverse possible (X has no canonical inverse) |
| `wkb-to-geojson` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `wkt-to-geojson` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `wma-to-mp3` | lossy-encoding | (`mp3-to-wma` missing) | n/a | wma or mp3 uses lossy encoding |
| `wmv-to-mp4` | lossy-encoding | (`mp4-to-wmv` missing) | n/a | wmv or mp4 uses lossy encoding |
| `woff-to-ttf` | bijective-candidate | ✓ | ✗ MISSING | both lossless font formats; should round-trip cleanly |
| `wos-to-bibtex` | lossy-encoding | (`bibtex-to-wos` missing) | ✓ | wos or bibtex uses lossy encoding |
| `wos-to-csl-json` | lossy-encoding | (`csl-json-to-wos` missing) | ✓ | wos or csl-json uses lossy encoding |
| `wos-to-csv` | lossy-encoding | (`csv-to-wos` missing) | ✓ | wos or csv uses lossy encoding |
| `wos-to-endnote-xml` | lossy-encoding | (`endnote-xml-to-wos` missing) | n/a | wos or endnote-xml uses lossy encoding |
| `wos-to-html` | cross-kind | (`html-to-wos` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `wos-to-markdown` | cross-kind | (`markdown-to-wos` missing) | n/a | data -> doc: cross-domain, inherently lossy |
| `wos-to-nbib` | lossy-encoding | (`nbib-to-wos` missing) | n/a | wos or nbib uses lossy encoding |
| `wos-to-ris` | lossy-encoding | (`ris-to-wos` missing) | ✓ | wos or ris uses lossy encoding |
| `wos-to-xlsx` | lossy-encoding | (`xlsx-to-wos` missing) | ✓ | wos or xlsx uses lossy encoding |
| `wos-to-yaml` | lossy-encoding | (`yaml-to-wos` missing) | n/a | wos or yaml uses lossy encoding |
| `xlsx-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-html-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-markdown-table` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-ods` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xlsx-to-tsv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `xml-to-csv` | bijective-candidate | (`csv-to-xml` missing) | n/a | both lossless data formats; should round-trip cleanly |
| `xml-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-bibtex` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-csv` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-json` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
| `yaml-to-toml` | bijective-candidate | ✓ | ✓ | both lossless data formats; should round-trip cleanly |
