/**
 * Per-tool extended SEO copy for the priority niche tools where we have
 * a real shot at top-3 ranking on day-one indexing (low competition,
 * high intent). Each entry adds three sections to the tool page:
 *   - whyConvert: 2-3 sentences answering "why does this conversion matter"
 *   - example: a real-world scenario the user is in when they need this
 *   - troubleshooting: 2-4 common problems with concrete fixes
 *
 * Voice: specific apps, specific filenames, specific error messages.
 * No "embark on your conversion journey" energy. If we can't make it
 * factual + specific, we don't write it — the FAQ already covers the
 * generic stuff.
 */

export interface ExtendedCopy {
  whyConvert: string;
  example: string;
  troubleshooting: Array<{ problem: string; solution: string }>;
}

export const EXTENDED_COPY: Record<string, ExtendedCopy> = {
  "kindle-clippings-to-obsidian-md": {
    whyConvert:
      "Kindle's My Clippings.txt is one undifferentiated text dump for every book you've ever highlighted. Importing that as-is into Obsidian gives you a single 50,000-line note that's useless for review. Splitting clippings into one Markdown file per book, with frontmatter for author/title and clean blockquote formatting, turns your highlights into actual second-brain material you'll actually open.",
    example:
      "You read 12 books on your Kindle this year. You plug it into your Mac, copy My Clippings.txt off the device (it's at the root), drop it here, and download a zip with twelve .md files. Each one drops cleanly into your Obsidian vault under Sources/Books/, ready for the [[wiki-style]] linking and tag system you already use.",
    troubleshooting: [
      {
        problem: "Some highlights look duplicated.",
        solution:
          "Kindle records every highlight whenever you adjust its boundaries. The converter de-duplicates exact text matches but keeps slightly-different versions on purpose so you don't lose your final wording. Open the .md and delete the partial earlier versions if they're noisy.",
      },
      {
        problem: "Notes I wrote attached to a highlight are missing.",
        solution:
          "Older Kindle firmware (pre-5.13) stored notes as separate entries with no link back to the highlight they belong to. We attach them when the timestamps match within 60 seconds; otherwise they appear as standalone entries at the bottom of the book's note. If yours come out detached, your firmware predates the linking format.",
      },
      {
        problem: "My Clippings.txt isn't on my Kindle when I plug it in.",
        solution:
          "Newer Kindles (Scribe, Colorsoft, 11th gen Paperwhite) hide the documents folder by default. Enable USB drive mode in Settings → Device Options → Advanced. Older models show it instantly under Internal Storage / documents/.",
      },
    ],
  },

  "kindle-clippings-to-notion-csv": {
    whyConvert:
      "Notion's CSV import creates a database row per CSV row, with column headers becoming database properties. Converting My Clippings.txt to a Notion-friendly CSV (book title, author, highlight, location, date, type) lets you build a fully filterable, sortable highlights database in Notion without any manual data entry.",
    example:
      "You're building a Notion 'Reading' workspace with views per book, per author, per year, per highlight type. Drop My Clippings.txt here, get a CSV with a Notion-compatible date format and one row per highlight. Notion's native CSV importer takes it directly — pick your database, map columns, done.",
    troubleshooting: [
      {
        problem: "Notion says some rows have inconsistent column counts.",
        solution:
          "A highlight that contains a literal comma can break naive CSV parsers. Our output quotes every text field with double-quotes and escapes inner quotes per RFC 4180. If Notion still complains, you may have edited the file in a tool that broke the quoting; re-run the conversion and import the fresh file directly.",
      },
      {
        problem: "Dates show as text instead of as a Date property in Notion.",
        solution:
          "After import, click the column header → 'Edit property' → change type from 'Text' to 'Date'. Notion converts the existing strings (already in YYYY-MM-DD format) automatically. Set as the default sort to see highlights in chronological order.",
      },
    ],
  },

  "apple-health-to-csv": {
    whyConvert:
      "Apple Health stores everything in one massive XML export (often 100MB+) that no normal spreadsheet tool can open. Converting to CSV (one file per metric: heart rate, steps, sleep, workouts) gives you something you can actually pivot, chart, or feed into Pandas/R for personal-data analysis. Privacy bonus: you never ship your raw health data to a third-party server when you do it in-browser.",
    example:
      "You want to see whether your average resting heart rate has trended down since you started running last March. Export from iPhone (Settings → Health → ⓘ at top right → Export All Health Data → AirDrop the export.zip to your Mac). Drop the entire zip here, get a heart_rate.csv with timestamp + bpm columns. Open in Numbers, group by month, drop a chart in.",
    troubleshooting: [
      {
        problem: "The export.zip is huge and the conversion seems to hang.",
        solution:
          "Apple Health exports can hit 200-500MB if you've worn an Apple Watch for years. Conversion is single-threaded WebAssembly — expect 30-90 seconds for large exports on desktop, longer on mobile. Don't close the tab. If memory runs out (you'll see a browser warning), try on a desktop with more RAM.",
      },
      {
        problem: "I want only one specific metric, not all of them.",
        solution:
          "Use the metric-specific tool instead: /apple-health-heart-rate-to-csv, /apple-health-steps-to-csv, /apple-health-sleep-to-csv, /apple-health-workouts-to-csv. They parse only their target node from the XML and skip the rest, which is faster and gives a smaller output.",
      },
      {
        problem: "Some workout entries are missing distance/calories.",
        solution:
          "Apple Health only records what your sources reported. A workout logged manually has no GPS or calorie data; one from Apple Watch has both. The CSV preserves nulls — empty cells are correct, not data loss.",
      },
    ],
  },

  "gedcom-to-json": {
    whyConvert:
      "GEDCOM is the universal genealogy interchange format, but its line-prefixed level-numbered structure (`0 @I1@ INDI`, `1 NAME John /Smith/`, etc.) is brutal to parse manually or work with in modern tools. JSON gives you a hierarchical object you can hand to any web app, Node script, or visualization library without writing a custom parser.",
    example:
      "You exported your family tree from Ancestry, MyHeritage, or Family Tree Maker as a .ged file. You want to build a small React/Svelte/D3 app that visualizes it. Drop the .ged here, get JSON with individuals, families, sources, and event references already linked by ID. Skip writing the parser entirely.",
    troubleshooting: [
      {
        problem: "Custom tags from my software (e.g., _UID, _PHOTO) appear with leading underscores.",
        solution:
          "GEDCOM uses underscore prefixes for non-standard tags. We preserve them in the JSON output as-is so software round-tripping back to GEDCOM keeps custom data intact. If you don't need them, filter them out at the JSON level.",
      },
      {
        problem: "Dates in the JSON are strings, not parsed dates.",
        solution:
          "GEDCOM date strings are deeply weird ('ABT 1850', 'BEF JUN 1923', 'BET 1900 AND 1910', non-Gregorian calendars). Forcing them into ISO dates would lose information. We output them as the original strings; parse at your application layer where you know what loss is acceptable.",
      },
      {
        problem: "Family relationships seem incomplete.",
        solution:
          "GEDCOM splits people (INDI) and families (FAM) into separate records linked by IDs (HUSB, WIFE, CHIL). The JSON preserves both. To traverse, look up family.husb / wife / chil IDs against the individuals object.",
      },
    ],
  },

  "gedcom-to-pdf": {
    whyConvert:
      "GEDCOM is great for genealogy software but useless for sharing with relatives who just want to read the family tree. PDF gives you a printable, shareable, archive-ready document with a clean individual-by-individual layout, including sources and notes. Email it to your aunt who doesn't run Family Tree Maker.",
    example:
      "Family reunion is in three weeks. You want to print a 30-page booklet of the tree your grandma maintained for 20 years. Drop her .ged file here, get a PDF organized by family branch with names, dates, places, and notes formatted for letter-size printing.",
    troubleshooting: [
      {
        problem: "The PDF is hundreds of pages.",
        solution:
          "Large family trees produce large PDFs — that's normal. We don't paginate by branch; we output one section per individual sorted by ID. If you want a focused PDF (just one branch), filter the GEDCOM in your software first (most genealogy apps support 'Export selected branch') and convert that smaller file.",
      },
      {
        problem: "Non-Latin names (Chinese, Cyrillic, Arabic) come out as boxes.",
        solution:
          "PDF font embedding is currently Latin-only in the in-browser engine to keep download size sane. For non-Latin trees, use /gedcom-to-html instead — your browser handles Unicode font fallback automatically when rendering HTML.",
      },
    ],
  },

  "dst-to-pes": {
    whyConvert:
      "Tajima DST is the embroidery industry's universal stitch format, but Brother home machines (PE-Design, Innov-is, Pacesetter) read PES natively. Converting DST → PES lets you take a design from a commercial digitizer or industrial machine and run it on a home Brother without re-digitizing.",
    example:
      "You bought an embroidery design pack online — every file is .dst because the digitizer used Wilcom or Pulse. Your Brother SE600 needs .pes. Drop each .dst here, get a .pes back with the same stitches, color stops, and trims preserved. Load it onto a USB stick and embroider.",
    troubleshooting: [
      {
        problem: "Colors look wrong on the machine display.",
        solution:
          "DST has no color information — it stores 'color change' commands but not the actual thread color. Our PES output assigns generic Brother thread codes; you'll see the design with placeholder colors and need to pick threads visually as you stitch. This is true of every DST→PES conversion, not specific to us.",
      },
      {
        problem: "The hoop size says it doesn't fit but the design looks small.",
        solution:
          "PES embeds a hoop size hint that your machine uses to pre-validate. We default to 4×4 (100×100mm). If your design needs a larger hoop, edit it in PE-Design or your machine's editor to set the correct hoop after conversion.",
      },
      {
        problem: "Trims/jumps are showing as visible threads on the finished embroidery.",
        solution:
          "DST sometimes records jumps without explicit trim commands. We translate them as PES trims when the jump is over 7mm (the embroidery industry standard for trim-or-not). Shorter jumps remain as floating threads — clip them by hand after stitching, or pre-process the DST in your digitizer to mark trims explicitly.",
      },
    ],
  },

  "midi-to-musicxml": {
    whyConvert:
      "MIDI captures performance data (note on/off, velocity, timing) but not notation (key signatures, beam grouping, voicing, articulation). Sibelius, MuseScore, Finale, and Dorico all read MusicXML, which adds the notation layer. Converting MIDI → MusicXML lets you take a recorded performance and start engraving it as a printable score.",
    example:
      "You recorded a piano improvisation in Logic, exported to MIDI. You want to clean it up in MuseScore and print sheet music to play again. Drop the .mid here, get a .musicxml file MuseScore opens directly with sensible quantization, voicing, and beat detection.",
    troubleshooting: [
      {
        problem: "The notation looks rhythmically messy (lots of weird tuplets).",
        solution:
          "Live-performance MIDI has tiny timing imperfections that MusicXML notation tries to honor literally. Open the file in MuseScore and run Selection → Quantize to 1/16 or 1/32 to clean it up. We can't quantize during conversion because the right value depends on the piece.",
      },
      {
        problem: "Multi-track MIDI comes out as one staff.",
        solution:
          "We map each MIDI channel to a separate MusicXML part. If your MIDI was exported as a single-channel merge (some DAWs do this on bounce), there's no channel data to split. Re-export from your DAW with 'separate track per channel' enabled.",
      },
    ],
  },

  "adif-to-csv": {
    whyConvert:
      "ADIF (Amateur Data Interchange Format) is the ham radio standard for logging contacts, used by every major logging program (LoTW, eQSL, Ham Radio Deluxe, N1MM, fldigi). CSV opens in Excel, Numbers, Sheets, or Pandas — any spreadsheet tool. Converting ADIF → CSV lets you analyze your log: contacts per band, per mode, per country, per year — without writing ADIF parsing code.",
    example:
      "You ran a contest last weekend and want to see your QSO/hour rate by band. Export your log as ADIF from N1MM, drop it here, get a CSV with one row per QSO and columns for call, frequency, mode, RST, timestamp, etc. Pivot in Excel by band → count → time bucket.",
    troubleshooting: [
      {
        problem: "Some fields are missing in the CSV.",
        solution:
          "ADIF supports ~150 optional fields; we include only the ones that appear in your log file. If you expected GRIDSQUARE or DXCC and they're missing, your logging program didn't write them. Configure your logger to capture them on future QSOs.",
      },
      {
        problem: "Date/time columns aren't in the format I want.",
        solution:
          "We output ADIF's native YYYYMMDD date and HHMM time per the spec. If you want ISO 8601 (YYYY-MM-DDTHH:MM:SSZ), open the CSV in Excel/Sheets and use a formula. We don't reformat because contest scoring tools expect the ADIF-native format.",
      },
    ],
  },

  "ofx-to-csv": {
    whyConvert:
      "OFX is the format every US bank exports for Quicken/QuickBooks, but if you're doing your own analysis in a spreadsheet — categorizing spending, tracking net worth, building a budget — CSV is what you need. OFX → CSV pulls transactions, dates, amounts, and payee strings into a flat sheet you can sort and filter without specialty software.",
    example:
      "You downloaded a year of statements from Chase as .ofx files (one per month). You want one big CSV to see total spending per category. Drop each OFX in turn (or batch your statements into one OFX), get a CSV with date, payee, amount, and account. Open in Sheets, autocategorize with text-match formulas.",
    troubleshooting: [
      {
        problem: "Negative amounts vs positive amounts seem reversed.",
        solution:
          "OFX uses 'TRNAMT' with a sign that varies by institution. Most banks make purchases negative and deposits positive; some flip that. Our CSV preserves the bank's sign exactly. If amounts look reversed for your needs, multiply the amount column by -1 in your spreadsheet.",
      },
      {
        problem: "Memo or check-number fields are missing.",
        solution:
          "Banks vary wildly in what optional OFX fields they populate. We include MEMO, CHECKNUM, REFNUM, FITID when present and leave them blank when the bank didn't include them. Check your bank's export options for richer data.",
      },
      {
        problem: "Encoding looks broken (accented characters showing as garbage).",
        solution:
          "Older OFX 1.x files use ASCII or Windows-1252. We auto-detect and convert to UTF-8 in the CSV output. If you still see broken characters, your OFX file was probably saved in an encoding we couldn't detect — open it in a text editor, save as UTF-8, re-run.",
      },
    ],
  },

  "discord-chat-to-md": {
    whyConvert:
      "Discord's official 'export channel' feature is locked behind a server admin role and outputs HTML. If you want your DMs or private server messages as plain Markdown — for archiving, search, indexing in Obsidian, or feeding into an LLM — converting the JSON export from DiscordChatExporter (the community standard) to Markdown gives you portable, future-proof text.",
    example:
      "You have 5 years of DMs with a friend. You used DiscordChatExporter's GUI to dump them as JSON. You want one .md file per conversation, with timestamps, attachments referenced inline, and reactions preserved. Drop the JSON here, get clean Markdown that opens in any editor and indexes in Obsidian or Logseq.",
    troubleshooting: [
      {
        problem: "Inline images are broken in my Markdown viewer.",
        solution:
          "We reference attachments by their original Discord CDN URL. Discord rotates these URLs every ~24h for security; old links 404 fast. If you want permanent images, run DiscordChatExporter with the --attachments flag, which downloads them locally; then edit the URLs in the .md to point at your local files.",
      },
      {
        problem: "Custom emoji come out as :name: instead of the image.",
        solution:
          "Custom Discord emoji are server-specific and only render inside Discord. Markdown has no equivalent. We preserve the :emoji_name: shortcode so you can search for them; rendering would require uploading every custom emoji somewhere persistent first.",
      },
    ],
  },

  // ===== Color converters =====
  "hex-to-rgb": {
    whyConvert:
      "HEX is the universal way to write a color in code; RGB is the universal way to talk about it in design tools. Designers in Figma or Photoshop adjust an RGB slider; the developer needs the HEX value to paste into CSS. Going the other way, debugging a `rgb(255, 99, 71)` from devtools is faster when you know that's #FF6347 (tomato).",
    example:
      "You inspect a button on a competitor's site. DevTools shows `color: rgb(220, 20, 60)`. You want to drop that into your design system as #DC143C and see it next to your existing palette. Drop a list of RGB values, get hex codes back instantly.",
    troubleshooting: [
      {
        problem: "I get 'Invalid RGB color' on values like rgb(300, -5, 256).",
        solution:
          "Each channel must be 0-255. Out-of-range values are clamped on output (anything >255 becomes 255, anything <0 becomes 0) but the parser still warns. If your source data is normalized to 0.0-1.0, multiply by 255 first.",
      },
      {
        problem: "Hex output is all uppercase, I need lowercase.",
        solution:
          "Industry convention is uppercase hex (#FFFFFF) for readability — capital A-F is easier to distinguish from numbers. Lowercase round-trips identically in CSS. If your design tool insists on lowercase, a single search-and-replace works on the output.",
      },
    ],
  },
  "rgb-to-hex": {
    whyConvert:
      "Designers work in RGB inside Photoshop, Figma, and Illustrator's color pickers. Developers paste hex codes into CSS, Tailwind config, design tokens. Bridging the two is a 50x/day operation in any product team — having a no-upload converter saves the trip to a server-based tool every time.",
    example:
      "Your design lead exported a brand palette as `rgb(43, 108, 176), rgb(237, 100, 166), rgb(56, 161, 105)`. You want them as #2B6CB0, #ED64A6, #38A169 in your `tailwind.config.js`. Paste the list, copy the hex values into the config.",
    troubleshooting: [
      {
        problem: "Output uses 6-char hex but I want the 3-char shorthand (#FFF).",
        solution:
          "Shorthand only works when each channel pair has identical hex digits (#RRGGBB → #RGB). Most colors don't qualify. We always emit 6-char hex for unambiguous round-trip; a regex can shorten valid candidates after the fact.",
      },
    ],
  },
  "hex-to-hsl": {
    whyConvert:
      "Modern design systems generate color scales by varying HSL axes. Tailwind's color palette and Material Design's tonal palettes both compute lighter/darker shades by changing HSL lightness while holding hue+saturation. Converting your brand hex to HSL is the first step to building a full palette around it.",
    example:
      "Your brand color is #2563EB. You convert to hsl(217, 91%, 53%). Now you generate the full Tailwind-style 50-900 scale by varying lightness from 95% (50) down to 15% (900) while holding 217° hue and 91% saturation.",
    troubleshooting: [
      {
        problem: "HSL values look slightly off vs Photoshop's HSB.",
        solution:
          "HSL (Hue, Saturation, Lightness) is not the same as HSB/HSV (Hue, Saturation, Brightness). They share Hue but Saturation and Lightness/Brightness are computed differently. Photoshop's color picker uses HSB; CSS uses HSL. Same color, different numbers.",
      },
    ],
  },
  "rgb-to-cmyk": {
    whyConvert:
      "Print shops require CMYK. Sending an RGB design to a commercial printer means the print operator either guesses at the conversion (and your colors shift) or rejects the file. Converting to CMYK before submission lets you preview the inevitable color shift on screen and adjust.",
    example:
      "You're sending business cards to Moo or Vistaprint. Your designer worked in RGB. You convert your brand colors to CMYK and the printer's preview tool now matches your expectations. Saved you a $200 reprint when the deep blue would otherwise have come out muddy.",
    troubleshooting: [
      {
        problem: "Bright colors lose vibrancy after CMYK conversion.",
        solution:
          "CMYK has a smaller color gamut than RGB, especially at the saturated edges. Bright neon green and electric blue simply can't be printed with CMYK ink. The converter clamps to printable values; in design tools you can preview this by enabling 'Proof Colors' (Photoshop) or 'CMYK Preview' (Illustrator).",
      },
      {
        problem: "Black areas don't look as deep as expected.",
        solution:
          "Pure black in RGB (#000000) becomes K=100, all other channels 0 — that's 'C 0 M 0 Y 0 K 100' which prints as a slightly faded black. Designers add 30-60% to the C/M/Y channels to create 'rich black'. Adjust manually in your design tool after conversion.",
      },
    ],
  },

  // ===== Encoding converters =====
  "text-to-base64": {
    whyConvert:
      "Base64 is the standard for embedding binary data in text-only channels: email attachments (MIME), data: URIs in CSS, JWT payloads, JSON fields that need to carry images, every API that has a 'base64-encoded payload' parameter. Devs hit this 5x a day debugging.",
    example:
      "You're inlining a small SVG icon into your CSS as a data: URI. You wrap the SVG markup, paste it here, and get back the base64 string for `data:image/svg+xml;base64,...`. No round-trip to a server-based tool that might log your data.",
    troubleshooting: [
      {
        problem: "My base64 has line breaks every 76 characters — is that a problem?",
        solution:
          "MIME standard wraps base64 at 76 columns. Most modern parsers tolerate this. If your consumer is strict, the converter strips whitespace on decode automatically; you can also pre-strip with `tr -d '\\n' < file.b64`.",
      },
      {
        problem: "Decoded text shows '?' or garbled characters.",
        solution:
          "Base64 encoded the bytes as-is — the encoding (UTF-8 vs Latin-1 vs UTF-16) of the original text matters. Our encoder uses UTF-8 throughout. If your source was Latin-1, multi-byte characters may decode incorrectly. Re-encode the source as UTF-8 first.",
      },
    ],
  },

  // ===== Hash generators =====
  "file-to-sha256": {
    whyConvert:
      "SHA-256 is the cryptographic hash everyone trusts in 2026 — used to verify package downloads (Debian, npm, PyPI, Homebrew), TLS certificates, signed software releases, Bitcoin block hashes. Generating one locally and comparing against the official .sha256 published next to a download is the standard way to confirm you got the file the maintainer intended (no MITM, no CDN tampering, no transfer corruption).",
    example:
      "You downloaded the Ubuntu ISO. The Ubuntu site publishes ubuntu-24.04-desktop-amd64.iso.sha256. Drop your downloaded ISO here, get the SHA-256, paste-compare against the published value. If they match, the download is byte-identical to what Canonical built.",
    troubleshooting: [
      {
        problem: "The hash I computed doesn't match the one published.",
        solution:
          "Three common causes: (1) corrupted download — re-download and re-hash, (2) you're hashing the wrong file (look at filename + size match), (3) the publisher's .sha256 is for the .tar.gz while you downloaded the .zip — match exact filenames. If still mismatched, the file was modified somewhere in transit.",
      },
    ],
  },
  "file-to-md5": {
    whyConvert:
      "MD5 is cryptographically broken (a malicious actor could craft a different file with the same MD5) but it's still the integrity check on a huge swath of legacy systems: package mirrors, CDN hash deduplication, Git's pre-2018 history, internal enterprise file-distribution tools. If a vendor publishes only an .md5, you need MD5 to verify.",
    example:
      "You're downloading a vendor firmware update. The vendor only publishes an MD5 alongside the .bin file. Drop the file, get the MD5, compare. Confirms transfer integrity — not security against intentional tampering, but enough to catch flipped bits and cut downloads.",
    troubleshooting: [
      {
        problem: "Should I use MD5 or SHA-256 if I have a choice?",
        solution:
          "Always SHA-256 (or higher) when the source publishes both. MD5 is fine for non-security integrity checks (transfer corruption, dedup) but never for security-sensitive verification. If you're verifying a software install or a security update, demand SHA-256.",
      },
    ],
  },

  // ===== Geographic converters =====
  "kml-to-gpx": {
    whyConvert:
      "Google Earth and Google My Maps export KML; every fitness device (Garmin, Wahoo, Apple Watch via apps) imports GPX. Outdoor enthusiasts plan routes in Google Earth then need them in GPX to load onto their bike computer or hiking GPS. Converting in your browser keeps your route data private (nothing uploaded to a route-sharing service that might re-publish it).",
    example:
      "You traced a 60km bike route in Google My Maps. You export as KML. You want it loaded onto your Garmin Edge for turn-by-turn navigation. Drop the KML, download the GPX, transfer to the Garmin via USB or Garmin Connect.",
    troubleshooting: [
      {
        problem: "My polygons disappeared after KML → GPX.",
        solution:
          "GPX has no polygon type — it only supports waypoints (points), tracks (recorded paths), and routes (planned paths). Our converter degrades polygons to closed tracks (the outer boundary becomes a track). For true polygon support, convert to GeoJSON instead.",
      },
      {
        problem: "Elevations are wrong after import to my GPS device.",
        solution:
          "KML elevation values are in meters above sea level by default; some apps export feet. Our converter assumes meters per the KML spec. If your source app exported feet, you'll see ~3.3x off elevation. Multiply elevations by 0.3048 in your source data first.",
      },
    ],
  },
  "kml-to-geojson": {
    whyConvert:
      "GeoJSON is the de-facto standard for web mapping (Mapbox, Leaflet, ArcGIS Online). KML is what Google Earth exports. Converting bridges desktop GIS work to web-deployed mapping projects. GitHub renders GeoJSON files inline as interactive maps, so converting your KML data lets you share it in a repo with a clickable preview.",
    example:
      "You documented a hiking trail network in Google Earth as KML — points for trailheads, lines for trails. You want to ship a Leaflet web map of it. Convert to GeoJSON, drop into your Leaflet `L.geoJSON(data)` call, deploy.",
    troubleshooting: [
      {
        problem: "Style information (colors, icons) was lost.",
        solution:
          "KML carries inline style data (`<Style>`, `<IconStyle>`, `<LineStyle>`); GeoJSON's properties bag is just untyped JSON, so styles don't survive. We preserve geometry + name + description. Apply styles in your mapping library based on a feature property after import.",
      },
    ],
  },

  // ===== JSONL =====
  "jsonl-to-json": {
    whyConvert:
      "Data engineers receive JSONL streams from BigQuery exports, Kafka topics, fluentd logs, OpenAI fine-tuning datasets — but downstream tools (jq for nested queries, JSON Schema validators, REST API request bodies, browser-based JSON viewers) want a single JSON document. Wrapping JSONL into a JSON array is a 2-second operation that every data engineer does dozens of times a week.",
    example:
      "You exported a million events from BigQuery as JSONL. You want to feed a 1000-event sample to a JSON Schema validator that needs a single document. Drop the .jsonl, get a .json with a top-level array, validate.",
    troubleshooting: [
      {
        problem: "The JSON output is huge — can I split it?",
        solution:
          "We emit a single array containing every record. For very large files (>100MB), tools like `jq -s` or `python -c 'import json; ...'` give finer-grained control. Often it's better to keep JSONL and use `jq` line-mode (`jq -c .`) instead of converting.",
      },
      {
        problem: "Some records are missing fields after conversion.",
        solution:
          "JSONL is sparse by design — each record only includes the fields that were set. JSON arrays preserve this exactly. If you need a uniform schema across records, post-process with `jq` to add null defaults: `jq '[.[] | {a, b, c}]'`.",
      },
    ],
  },

  // ===== Config conversions =====
  "yaml-to-toml": {
    whyConvert:
      "Migrating between config systems: from a YAML-heavy stack (Kubernetes, Ansible, GitHub Actions) to a TOML-based one (Cargo, Hugo, modern Python pyproject) means transcribing the same data. Doing it by hand is error-prone with deep nesting; an AST-aware converter handles the structural translation correctly.",
    example:
      "You're rewriting a Hugo site config from `config.yaml` to `config.toml` (Hugo's preferred format since v0.110). Drop your YAML, get TOML out — every nested map and array survives the transformation.",
    troubleshooting: [
      {
        problem: "YAML anchors and aliases didn't transfer.",
        solution:
          "YAML's `&anchor` / `*alias` features have no TOML equivalent (TOML has no reference mechanism). Our converter resolves anchors at parse time so the output TOML duplicates the value at every reference site. The data is preserved; the deduplication isn't.",
      },
    ],
  },

  // ===== Tabular table =====
  "csv-to-markdown-table": {
    whyConvert:
      "Embedding tabular data in Markdown docs (READMEs, GitHub issues, MkDocs sites, Notion pages, Obsidian notes) means converting CSV to a `| col1 | col2 |` table by hand — tedious for >5 rows. The converter handles arbitrary row count, auto-aligns columns, escapes pipe characters in cell values.",
    example:
      "You're writing a project README. You have a CSV of API endpoints with method, path, and description columns. Drop the CSV, paste the Markdown table into your README — GitHub renders it instantly with proper alignment.",
    troubleshooting: [
      {
        problem: "My table looks misaligned in the raw Markdown.",
        solution:
          "We pad each column to the longest cell width so the source is human-readable. The renderer (GitHub, MkDocs, etc.) ignores extra spaces — alignment in the source is just for editing convenience. If you don't care about source readability, the rendered table is identical.",
      },
      {
        problem: "Cells with pipe characters break the table.",
        solution:
          "Markdown tables use `|` as a column separator. We escape literal pipes inside cells as `\\|`. Most renderers handle this; some older Markdown parsers don't. If yours doesn't, replace pipes with HTML entity `&#124;` in the source.",
      },
    ],
  },

  // ===== SQL =====
  "csv-to-sql": {
    whyConvert:
      "Loading CSV data into a database means either using the database's COPY/IMPORT feature (which differs by engine) or generating portable INSERT statements. The latter works across PostgreSQL, MySQL, SQLite, and SQL Server with no engine-specific syntax. Useful for seed data, test fixtures, and quick imports where you'd rather paste SQL into a query window than configure a CSV importer.",
    example:
      "You have a CSV of 500 product records. You want to seed your dev database with them. Convert to SQL (CREATE TABLE products + 500 INSERT statements), paste into psql / TablePlus / DataGrip, run.",
    troubleshooting: [
      {
        problem: "The inferred column types are wrong.",
        solution:
          "We infer types from the first non-null value: integer-looking → INTEGER, decimal-looking → REAL, true/false → BOOLEAN, otherwise TEXT. Override by editing the CREATE TABLE statement before running. For mixed-type columns (some integers, some 'N/A'), edit the type to TEXT to avoid INSERT failures.",
      },
      {
        problem: "INSERT statements fail with 'duplicate key' errors.",
        solution:
          "Our generated CREATE TABLE doesn't add primary key constraints. If your target database has an existing table with a PRIMARY KEY column, your CSV may contain duplicate values for that column. Either use INSERT OR IGNORE (SQLite) / ON CONFLICT DO NOTHING (Postgres), or drop the table first.",
      },
    ],
  },

  // ===== Date/time =====
  "unix-to-iso": {
    whyConvert:
      "Server logs, database timestamps, and analytics warehouses store time as Unix timestamps for compactness and timezone-neutrality. Humans read ISO 8601 (`2024-06-10T14:30:00Z`). Translating columns of timestamps is a daily task in log analysis, incident postmortems, and data exploration — and you don't want to paste timestamps into a remote tool that might log them.",
    example:
      "You're reading an incident log. The time column is `1717977600`, `1717977901`, `1717978122` etc. Convert to ISO and now you can see at a glance that the events happened on June 10, 2024 around 00:00 UTC, ~5 minutes apart.",
    troubleshooting: [
      {
        problem: "ISO output shows midnight UTC but I expected my local time.",
        solution:
          "Unix timestamps have no timezone (they're seconds since 1970-01-01 UTC). We always output UTC for portability. To shift to local time, parse the ISO string with `new Date(iso)` in JS — the Date object localizes automatically when displayed.",
      },
      {
        problem: "Negative timestamps fail.",
        solution:
          "Pre-1970 dates are negative Unix timestamps. We support them: -1000 = 1969-12-31T23:43:20Z. If yours fail, check the input has no thousands separators or trailing whitespace.",
      },
    ],
  },

  // ===== Color name =====
  "color-name-to-hex": {
    whyConvert:
      "Designers and product folks often pitch colors by name in Slack ('let's use tomato red') without knowing the exact hex. Looking up a color name's hex on MDN every time is slower than a tool that takes a name and gives you `#FF6347`. Useful for design system tokens, CSS scaffolding, and quick color experimentation.",
    example:
      "Your designer says 'use rebeccapurple as the primary'. You convert and get `#663399`. Drop into your Tailwind config, your design tokens, your CSS variables.",
    troubleshooting: [
      {
        problem: "I get 'unknown color name' for a name I'm sure is valid.",
        solution:
          "We support the 147 CSS Color Module Level 4 named colors only. 'Salmon' works; 'salmon pink' doesn't (no spaces, exact spelling). 'Ocean blue' isn't a CSS color — those are marketing names from specific palettes (Pantone, Material). Look up the exact CSS name on MDN's color value page.",
      },
    ],
  },
};

export function getExtendedCopy(toolId: string): ExtendedCopy | undefined {
  return EXTENDED_COPY[toolId];
}
