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

  // ===== Medical: HL7 v2.x =====
  "hl7-to-csv": {
    whyConvert:
      "HL7 v2 messages are pipe-delimited blobs that defy spreadsheet inspection — you can't open one in Excel and triage what's inside. Converting to CSV lets a clinical data analyst, integration engineer, or QA team scan a day's worth of ADT/ORU/ORM messages, filter by segment type, and audit message volumes without standing up Mirth Connect or a HAPI FHIR server. Also useful for HIPAA audit logs that need flat-file export.",
    example:
      "Your hospital's interface engine logged 18,000 HL7 messages overnight. You suspect an outbound feed dropped a third of its ADT^A04s. Drop the message log, get a CSV with one row per segment, filter for segment='MSH' and message type, count rows. Three minutes vs three hours building a Mirth dashboard.",
    troubleshooting: [
      {
        problem: "My CSV has way more rows than messages — what's happening?",
        solution:
          "Each HL7 message contains multiple segments (MSH + EVN + PID + PV1 + ...). The CSV emits one row per SEGMENT, not per message. To count messages, filter for segment='MSH'. To group by message, you'd add a `message_id` column based on MSH-10 — easier in your spreadsheet's pivot table than at conversion time.",
      },
      {
        problem: "Some segments are missing fields I expect to see.",
        solution:
          "HL7 v2 allows trailing field omission — a message with PID-1 through PID-15 may simply end after PID-15 with no trailing pipes. We treat those as empty strings in the output CSV. If your downstream tool needs explicit nulls, replace empty cells with `NULL` in a spreadsheet pass.",
      },
      {
        problem: "Non-ASCII characters in patient names came out garbled.",
        solution:
          "HL7 v2 doesn't mandate an encoding; older feeds use Windows-1252 or ISO-8859-1, modern ones use UTF-8. We assume UTF-8 (matching the JS string default). If yours was Windows-1252, open the source file in a text editor and re-save as UTF-8 first, then re-run.",
      },
    ],
  },
  "hl7-to-json": {
    whyConvert:
      "HL7 v2 → JSON is the first step of every modernization project — feeding legacy v2 feeds into a FHIR server, a data warehouse (Snowflake/Databricks/BigQuery), or a no-code automation platform. The structural translation is mechanical (segment.field.component path), but writing it by hand is error-prone for the first time. The JSON output is keyed by segment type with `MSH.10`-style field paths so downstream code can address fields without re-parsing pipes.",
    example:
      "You're building a ML pipeline that flags admissions with elevated readmission risk. Your input is a stream of ADT^A01 messages from your interface engine. Convert each to JSON, drop into your feature store, train. The JSON keys (`PID.5`, `PV1.10`, `DG1.3`) are stable across messages so your feature extraction code doesn't break.",
    troubleshooting: [
      {
        problem: "Component values are sometimes strings, sometimes arrays.",
        solution:
          "When a field has a single component (just a value), we emit a string. When it has multiple components (e.g. `DOE^JOHN^A`), we emit an array `['DOE', 'JOHN', 'A']`. Code that consumes the JSON should normalize: `Array.isArray(v) ? v : [v]`.",
      },
      {
        problem: "Repeated fields are nested arrays — how do I flatten?",
        solution:
          "HL7 allows tilde-separated repetitions in a single field (multiple addresses, multiple insurance IDs). When repetitions exist, the value is an array of components-arrays. Most of the time you only care about the first repetition: `Array.isArray(v[0]) ? v[0] : v`.",
      },
    ],
  },

  // ===== Medical: FHIR =====
  "fhir-bundle-to-csv": {
    whyConvert:
      "FHIR Bundles in production carry hundreds to thousands of mixed resources (Patient + Observation + Condition + MedicationRequest from a single $everything operation). Triaging that as JSON is exhausting; piping it through a spreadsheet to spot duplicates, audit data quality, or compare across patients is the analyst's go-to workflow. CSV with one row per resource and a unified column set across resource types is what makes that workflow possible.",
    example:
      "You called the Epic FHIR `Patient/$everything` endpoint and got back a 4,000-resource Bundle for a single patient's lifetime record. You want to count Observations by code, find the date range, and spot any nulls. Convert to CSV, pivot in Excel, done in 5 minutes.",
    troubleshooting: [
      {
        problem: "Some columns are full of '[object Object]'-style values.",
        solution:
          "FHIR resources have nested objects (CodeableConcept, Reference, Quantity) that don't flatten cleanly to a single CSV cell. We JSON-encode them so no data is lost; if you need them flat, post-process in your spreadsheet (`=JSON_VALUE(A1, '$.coding[0].code')` in Sheets) or convert to JSON first, jq the nested fields out, then back to CSV.",
      },
      {
        problem: "Resources of different types share a column header but mean different things.",
        solution:
          "We compute the column union across all resources, so `id` appears once but every resource has it. This is intentional — analysts want one wide table to scan, not multiple per-type sub-tables. To split by type after the fact: filter on the `resourceType` column and re-export each subset.",
      },
    ],
  },

  // ===== Medical: C-CDA =====
  "ccda-to-html": {
    whyConvert:
      "Patients receive C-CDA files from EHR portals (Epic MyChart, Cerner HealtheLife) when they request a copy of their records — and those XML files are unreadable to humans. The HL7 stylesheet that's supposed to render them often doesn't load (security policies, missing local CSS, browser quirks). Converting to standalone HTML gives the patient a clean, print-friendly view of their own discharge summary, problem list, medications, and allergies.",
    example:
      "Your parent had heart surgery, the hospital sent home a thumb drive with a CCD.xml of the discharge summary. They can't read XML. Drop the file, download the HTML, open it on their computer — they see name, DOB, the section list (Allergies, Medications, Problems), and human-readable text under each.",
    troubleshooting: [
      {
        problem: "Some sections show '(no content)' even though I know there's data.",
        solution:
          "C-CDA stores section content in two places: the `<text>` element (human-readable narrative) and the `<entry>` elements (machine-readable structured data). We render the narrative because it's reliably present and human-targeted. If your sections only have entries, you'd need a more sophisticated viewer like the HealthIT.gov reference renderer.",
      },
      {
        problem: "My provider's name and contact info aren't shown.",
        solution:
          "The patient header we render is intentionally minimal (name, DOB, gender, MRN). Provider/author information lives in the `<author>` and `<custodian>` elements; we omit them to keep the rendered document focused on the patient. To see them, convert to JSON and inspect the surrounding metadata.",
      },
    ],
  },

  // ===== Legal: Concordance DAT =====
  "dat-to-csv": {
    whyConvert:
      "Receiving a production from opposing counsel means a folder of DAT load files that Excel renders as garbage (those mysterious þ characters are U+00FE text qualifiers, paired with U+0014 field delimiters). Converting to CSV is the first step every paralegal does to triage what's been produced — count documents, sort by date, search for hot terms in extracted text — before the formal review platform load.",
    example:
      "You receive a 50,000-document production from opposing counsel as a DAT + OPT pair. Before loading into Relativity (which costs your client per GB hosted), you want to spot-check what's there. Convert the DAT to CSV, sort by `EmailFrom`, and pull out the 200 communications between two specific custodians for an early-case strategy review.",
    troubleshooting: [
      {
        problem: "Extracted text fields contain literal newlines that break my CSV import.",
        solution:
          "DAT extracted-text fields routinely contain embedded newlines (paragraph breaks in emails, attachments). We preserve them inside CSV cells, properly quoted per RFC 4180. If your downstream tool can't handle multi-line cells, replace `\\n` with ` ` in the extracted-text column post-conversion.",
      },
      {
        problem: "My DAT uses `|` delimiters instead of the Unicode characters.",
        solution:
          "Older Concordance exports (pre-2010) sometimes use pipe-and-comma fallbacks. We auto-detect: if no U+0014 characters appear in the input, we fall back to `|` as field delimiter. If your file uses something else entirely (rare), pre-process with sed or open in a hex editor to confirm the delimiter byte.",
      },
      {
        problem: "Bates numbers got reformatted (leading zeros dropped).",
        solution:
          "Excel auto-detects Bates numbers like `ABC0000123` as text correctly, but plain CSV import sometimes treats numeric-looking values as numbers and strips leading zeros. We preserve them as text in the CSV output. If your spreadsheet still strips them, use Excel's Import Wizard and explicitly set the Bates column to Text type.",
      },
    ],
  },
  "csv-to-dat": {
    whyConvert:
      "If you've built up a custom document set in a spreadsheet (from a database export, an ad-hoc collection, or a third-party platform that doesn't speak DAT), getting it into Relativity or Concordance for review requires a proper DAT file with the Unicode delimiters and text qualifiers their importers expect. Producing one by hand is error-prone — wrong delimiter, wrong line terminator, missing header line, and Relativity rejects the entire load.",
    example:
      "Your client's IT team exported a custom email database as CSV with columns `BegBates, EndBates, From, To, Subject, BodyText`. You need it in Relativity for review. Convert to DAT, hand to the litigation support team, they load it without further reformatting.",
    troubleshooting: [
      {
        problem: "Relativity's import wizard rejects my DAT with 'invalid delimiter' errors.",
        solution:
          "Some Relativity instances are configured to expect the visible-character delimiter pair (`|`/`\"`) instead of the Unicode pair we emit by default (which is the Concordance standard). Confirm with your litigation support contact which delimiters their workspace expects. If Unicode, our output works as-is.",
      },
      {
        problem: "Bates ranges look wrong after import.",
        solution:
          "Make sure your CSV has explicit `BegBates` and `EndBates` columns (not just a single `BatesNumber`). For one-page documents, BegBates = EndBates. Most review platforms require the range explicitly.",
      },
    ],
  },
  "opt-to-csv": {
    whyConvert:
      "OPT files map every Bates page in a production to its image file path on disk. Loading them into Excel directly preserves the data but loses the column meaning — you're stuck remembering that column 4 is `IsBoundary` and column 7 is `PagesInDoc`. Converting to a real CSV with proper headers makes the file self-documenting and shareable across teams without a Concordance manual.",
    example:
      "Your firm received a production where the image folder structure looks broken — some pages are missing TIF files. Drop the OPT, get a CSV, sort by ImagePath, and immediately see the 47 pages with empty path values that need to be re-requested from opposing counsel.",
    troubleshooting: [
      {
        problem: "Image paths use backslashes and break in my Mac/Linux tool.",
        solution:
          "Concordance is Windows-native and OPT files use Windows path separators (`\\`). We preserve them verbatim. To convert for Mac/Linux: search-replace `\\` → `/` in the resulting CSV. If your downstream tool needs absolute paths, prepend the production root to ImagePath.",
      },
    ],
  },

  // ===== Gettext PO (localization) =====
  "po-to-csv": {
    whyConvert:
      "PO is the universal localization format but every tool reads it in a slightly different dialect — and getting translations into and out of Google Sheets, Excel, or a Notion database means flattening PO entries into rows. CSV is the lingua franca translators send to PMs, freelancers, and reviewers when Poedit isn't an option. Round-tripping back through csv-to-po preserves every field (msgctxt, plurals, comments, references, flags) so handoffs don't drop data.",
    example:
      "Your French translator wants to review 800 strings in a Google Sheet instead of installing Poedit. You drop `messages.po` here, get a CSV with the canonical columns (msgctxt, msgid, msgid_plural, msgstr, msgstr_plurals, comments, references, flags), share the sheet, and convert back to PO via csv-to-po when they're done. No data lost.",
    troubleshooting: [
      {
        problem: "Plural forms aren't showing up properly in the spreadsheet.",
        solution:
          "Plurals ride in the `msgstr_plurals` column as a JSON-encoded array, e.g. `[\"%d apple\",\"%d apples\"]`. Spreadsheets show this as text — that's intentional, because the number of plural forms varies per language (English/Spanish: 2, Russian: 3, Arabic: 6). When you convert back via csv-to-po, the JSON gets parsed and emitted as proper `msgstr[0]`, `msgstr[1]`, etc.",
      },
      {
        problem: "The disambiguation `msgctxt` got merged into one row.",
        solution:
          "Don't sort the CSV in a way that hides the `msgctxt` column. Two entries with the same msgid but different msgctxt (e.g., noun vs verb \"Order\") MUST stay on separate rows for csv-to-po to reconstruct them correctly. If a colleague flattened them in Excel, you'll have to re-create the rows by hand.",
      },
    ],
  },
  "csv-to-po": {
    whyConvert:
      "After translators edit your strings in a spreadsheet, you need to push them back into the codebase as a proper PO file that gettext, react-i18next, Django, or Poedit can consume. csv-to-po reads the same column layout po-to-csv emits, rebuilds plural arrays from the JSON-encoded column, and reattaches contexts, comments, references, and flags so the resulting PO drops in cleanly without breaking your build.",
    example:
      "Your translation team sends back `messages.fr.csv` with reviewed `msgstr` cells. You drop the CSV here, get `messages.fr.po`, commit it to `locales/fr/LC_MESSAGES/`, run `msgfmt` (or your tool's equivalent), and the French build picks it up.",
    troubleshooting: [
      {
        problem: '"Row N is missing a value in the msgid column" error.',
        solution:
          "Empty rows or rows that lost their msgid (often from a stray Excel sort) crash the build because PO entries are keyed by msgid + msgctxt. Open the CSV in any text editor, find the empty row (or one with only a comma), and either fill in the msgid or delete the row entirely. The header entry (msgid \"\" with PO file metadata) is allowed and only valid on row 2.",
      },
      {
        problem: "I converted a translator's CSV but the plurals came out as a single string.",
        solution:
          "Make sure the `msgstr_plurals` column contains a JSON array (`[\"form1\",\"form2\"]`) and not a single line. If your translator delivered each plural form in a separate column (`msgstr_0`, `msgstr_1`), our parser won't pick them up — you'll need to combine them into one JSON-encoded cell first.",
      },
    ],
  },
  "po-to-json": {
    whyConvert:
      "Modern frontend i18n stacks (react-i18next, vue-i18n, next-intl, formatjs) consume JSON, not PO. po-to-json bridges the gap: structured array of entries with msgctxt, msgid, msgid_plural, msgstr (string or array), comments, references, and flags all preserved. Drop the JSON straight into your locales folder or feed it through your translation pipeline.",
    example:
      "You inherited a legacy gettext-based backend but the new React frontend uses react-i18next. Drop your existing `messages.po` here, get a JSON array, and write a 10-line script that flattens it into the `{ \"key\": \"translation\" }` shape react-i18next wants (or use it as-is in libraries that consume PO-style JSON).",
    troubleshooting: [
      {
        problem: "I want a flat key:value JSON, not an array.",
        solution:
          "Our output is the lossless representation (array of entry objects) so plurals and contexts survive. Most frontend libs (react-i18next, vue-i18n) actually want flat key:value. After conversion, run `JSON.parse(out).reduce((acc, e) => (acc[e.msgid] = Array.isArray(e.msgstr) ? e.msgstr[0] : e.msgstr, acc), {})` to flatten — but you'll lose plural variants. Trade-off you have to make consciously.",
      },
    ],
  },
  "json-to-po": {
    whyConvert:
      "Your i18n source-of-truth lives in JSON but your translation team uses Poedit/Lokalise/Crowdin which all want PO. json-to-po lets you keep code-side JSON and ship PO to translators without writing a custom converter. Lossless inverse of po-to-json so you can round-trip through translator review without losing plurals, contexts, or developer comments.",
    example:
      "Your `en.json` is the source-of-truth; translators want a PO file to work in Poedit. Run json-to-po, hand off `en.po` to the translator (who saves as `es.po` with Spanish in each `msgstr`), then run po-to-json on `es.po` to integrate into your build.",
    troubleshooting: [
      {
        problem: "The output PO file is missing my plural entries.",
        solution:
          "For an entry to emit as plural in PO, the JSON object must have both `msgid_plural` AND `msgstr` as an array. If you only have a single English string, plurals haven't been authored yet — that's a content problem, not a conversion bug. Add `\"msgid_plural\": \"%d items\"` and `\"msgstr\": [\"%d item\", \"%d items\"]` to the JSON entry and re-run.",
      },
    ],
  },

  // ===== ASS / SSA styled subtitles =====
  "srt-to-ass": {
    whyConvert:
      "SRT is the lowest-common-denominator subtitle format — plain timing + plain text, no styling. ASS is what serious video work uses: positioning, fonts, colors, karaoke timing, libass-rendered overlays in mpv/VLC/ffmpeg. Converting SRT to ASS upgrades plain captions to a styled subtitle track that your editor (Aegisub) can layer effects onto without re-typing every line.",
    example:
      "You're typesetting an anime episode and the rough English subtitles came in as `episode.srt`. You convert to `episode.ass`, open in Aegisub, restyle the Default style to match the fansub group's font conventions, then add per-line karaoke timing for the OP/ED — all without losing the original timing the translator nailed.",
    troubleshooting: [
      {
        problem: "Italics from my SRT (`<i>...</i>`) aren't styled in the ASS output.",
        solution:
          "We drop SRT HTML-style tags in this version because ASS uses a different override syntax (`{\\i1}...{\\i0}`). After conversion, find/replace `<i>` → `{\\i1}` and `</i>` → `{\\i0}` in the dialogue text. Aegisub also has a one-click \"Apply tags from selected lines\" feature.",
      },
      {
        problem: "All my dialogue lines use the Default style — I want per-character styles.",
        solution:
          "ASS supports multiple Style entries in [V4+ Styles] but a one-shot conversion can't infer which speaker is which from SRT. After conversion, open in Aegisub, add Style entries (Subtitle → Styles Manager → New), then either select-and-restyle individual Dialogue rows or use Aegisub's Karaoke Templater / styling-by-actor workflow.",
      },
    ],
  },
  "ass-to-srt": {
    whyConvert:
      "Most consumer video players (YouTube uploads, browser HTML5 video, hardware TVs, mobile players, basic Plex setups) only understand SRT. Converting ASS to SRT strips styling/positioning/karaoke effects but keeps the timing + dialogue text the audience actually reads — so your stylized fansub still plays on the recipient's device when ASS isn't supported.",
    example:
      "You finished an Aegisub typesetting pass on `episode.ass`, but the friend who's watching has a smart TV that only does SRT subtitles via USB. Convert to `episode.srt`, drop on the USB stick, the TV picks it up.",
    troubleshooting: [
      {
        problem: "I'm missing some lines that were in the ASS file.",
        solution:
          "ASS distinguishes `Dialogue:` lines (rendered captions) from `Comment:` lines (translator notes / karaoke source / disabled lines). Only Dialogue lines go into SRT — that's correct behavior. If important lines were marked as Comment by mistake, edit the .ass file in Aegisub and switch the row's class from Comment to Dialogue before re-converting.",
      },
      {
        problem: "Override codes like `{\\fad(200,200)}` appeared as literal text.",
        solution:
          "Our converter strips standard inline overrides ({\\i1}, {\\b1}, {\\fnArial}, etc.) but very long or malformed override blocks can sneak through. Open the resulting SRT and find/replace `{...}` blocks manually if any remain.",
      },
    ],
  },
  "vtt-to-ass": {
    whyConvert:
      "WebVTT is the browser-native subtitle format (`<track kind=\"subtitles\">`); ASS is the format Aegisub and mpv prefer for advanced typesetting. Converting VTT to ASS lets you upgrade auto-generated YouTube captions (which export as VTT) into a stylable working file for proper typesetting.",
    example:
      "You exported YouTube's auto-captions as `lecture.vtt`. You convert to `lecture.ass`, open in Aegisub, fix the speech-recognition errors line-by-line, and restyle the Default fontsize to match the slide aesthetic — much faster than retyping every line from scratch.",
    troubleshooting: [
      {
        problem: "VTT positioning cues (line:80%, align:center) didn't carry over.",
        solution:
          "WebVTT positioning maps imperfectly to ASS positioning (which uses a different model: alignment 1-9 grid plus \\pos overrides). We drop VTT positioning in this version and emit alignment 2 (bottom center). Re-add per-line positioning in Aegisub if it matters for your typesetting.",
      },
    ],
  },
  "ass-to-vtt": {
    whyConvert:
      "Browser-native HTML5 video only loads subtitles via `<track src=\"...\" kind=\"subtitles\">` with a WebVTT file. ASS doesn't work directly. Converting ASS to VTT preserves timing and dialogue text so a styled fansub can stream on the web (YouTube, Vimeo, custom video pages) when ASS isn't an option.",
    example:
      "Your `episode.ass` is built with full styling, but you need to embed the episode on a Next.js page with the HTML5 `<video>` element. Convert to `episode.vtt`, host alongside the .mp4, and reference via `<track>`. The browser plays it; styling won't carry over but the captions will be correct + timed.",
    troubleshooting: [
      {
        problem: "Multi-line ASS dialogue (`\\N` line breaks) shows as one long line in the browser.",
        solution:
          "We convert `\\N` to real newlines in the VTT output. Most browsers render newlines inside a cue correctly, but some (notably older Safari versions) collapse them. If yours does, manually edit the VTT to use `<br>` between lines — WebVTT supports a subset of HTML inside cues.",
      },
    ],
  },

  // ===== CAD (AutoCAD DXF) =====
  "dxf-to-svg": {
    whyConvert:
      "DXF is the universal 2D-CAD exchange format but every browser-based tool, every static-site setup, every embeddable diagram framework speaks SVG. Converting DXF to SVG lets you embed CAD drawings on a webpage, in documentation, in a Notion page, or in a slide — without forcing the viewer to install AutoCAD or LibreCAD. Geometry stays vector-precise (LINE, CIRCLE, ARC, POLYLINE all map to native SVG primitives), so the result scales cleanly at any zoom level.",
    example:
      "You have a `floorplan.dxf` from your architect and you want to embed it on the project's status page so stakeholders can view the layout in any browser. Drop it here, get `floorplan.svg`, drop it into your CMS. The result renders crisp at any size, no plugins needed.",
    troubleshooting: [
      {
        problem: "Some entities are missing from the SVG (the drawing looks incomplete).",
        solution:
          "We render the most common geometry types — LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE, POINT, TEXT, MTEXT — directly. INSERT (block references), HATCH (fills), DIMENSION (dimension lines), 3DFACE, and SOLID are not yet expanded and get dropped. If your drawing relies heavily on blocks, explode them in your CAD tool before exporting (AutoCAD: EXPLODE command; LibreCAD: Modify → Explode) so each component is a flat entity.",
      },
      {
        problem: "The drawing is upside-down or text is mirrored.",
        solution:
          "DXF uses math-convention Y-axis (up); SVG uses screen-convention Y-axis (down). We apply a `scale(1,-1)` transform on the outer group to flip everything upright, and a counter-flip on each text element so glyphs stay readable. If something STILL looks mirrored, the CAD export probably specified a `$EXTNAMES` or coordinate-system override we don't handle yet — flatten the coordinate system in your CAD tool before exporting.",
      },
      {
        problem: "Binary DXF doesn't work.",
        solution:
          "Binary DXF (a compact non-text variant) is rare but exists. We only parse ASCII DXF. Re-export from your CAD tool with the \"DXF Format\" option set to ASCII — every CAD tool defaults to ASCII these days so this should be the default behavior.",
      },
    ],
  },
  "dxf-to-json": {
    whyConvert:
      "Working programmatically with CAD geometry is brutal in DXF's pair-based ASCII wire format (group code on one line, value on the next, repeated for every property of every entity). Converting to JSON gives you a clean structured entity array your code can map, filter, transform, and serialize. Useful when building CAD pipelines, generating reports from drawings, or feeding geometry into a custom renderer.",
    example:
      "You're scripting a quantity takeoff from a set of `*.dxf` site plans. Each entity has a layer name encoding its category (Walls, Doors, Windows). Convert each DXF to JSON, filter `entities` by `layer`, sum LINE lengths or count CIRCLE entities by layer — far easier than parsing the raw DXF in your language of choice.",
    troubleshooting: [
      {
        problem: "I want geometry from a BLOCK (a reusable component referenced by INSERT).",
        solution:
          "INSERT entities are currently dropped on output. To get the geometry, EXPLODE the INSERT in your CAD tool first (AutoCAD: EXPLODE; LibreCAD: Modify → Explode), then re-export the DXF. The exploded entities will appear as LINE/CIRCLE/ARC/etc. in the resulting JSON.",
      },
      {
        problem: "Polyline vertices look out of order.",
        solution:
          "DXF LWPOLYLINE stores vertices as repeated (10, 20) group code pairs in the original drawing order. We preserve that order verbatim. If they look wrong, it's the CAD export — open the DXF in a text editor and confirm the 10/20 pairs appear in the same order you expect.",
      },
    ],
  },

  // ===== 3D model interchange (GLB / glTF) =====
  "stl-to-glb": {
    whyConvert:
      "STL is the 3D-printing standard but it's bad for web embedding: no scene graph, no compression, no streaming. GLB (glTF 2.0 binary) is the web-native format that powers Three.js, model-viewer, Sketchfab, Facebook 3D, Apple QuickLook (via USDZ), and every WebXR/AR pipeline. Converting STL to GLB unlocks browser-based 3D viewing, AR product previews, and embeddable 3D widgets on any webpage.",
    example:
      "You designed a part in Fusion 360 and exported `part.stl` for the 3D printer. Now you want to embed an interactive 3D preview on your product page. Convert to `part.glb`, drop it next to your HTML, and reference it with `<model-viewer src=\"part.glb\" auto-rotate camera-controls>`. Users can spin the model in any browser, including mobile AR.",
    troubleshooting: [
      {
        problem: "The model loads but appears black / has no surface color in model-viewer.",
        solution:
          "Our STL→GLB converter only emits geometry (vertex positions + indices), not material data, because STL has no material concept either. Add `--exposure 1 --shadow-intensity 1` attributes to model-viewer, or add a material via Blender (File → Import .glb → Material tab → Add → File → Export .glb). Adding lighting in model-viewer (`<model-viewer environment-image=\"neutral\">`) usually fixes it.",
      },
      {
        problem: "The browser says the GLB is too large to load.",
        solution:
          "STL meshes from CAD exports often have far more triangles than necessary for web display. Open in Blender → Modifiers → Decimate → set ratio to 0.1-0.3 to cut triangle count 70-90% before exporting to STL → re-run this converter. The visual difference at typical model-viewer sizes is imperceptible.",
      },
    ],
  },
  "glb-to-stl": {
    whyConvert:
      "Your 3D printer slicer (Cura, PrusaSlicer, Bambu Studio, Slic3r, Simplify3D) wants STL. The .glb file you downloaded from Sketchfab, Thingiverse's newer GLB section, or extracted from a game asset pack won't import directly. glb-to-stl extracts the mesh geometry and emits a clean binary STL ready for slicing.",
    example:
      "You downloaded a `dragon.glb` from a Sketchfab CC-BY-licensed model pack. PrusaSlicer doesn't open GLB. Convert to `dragon.stl` here, open in PrusaSlicer, scale to print bed, slice, print. Total round-trip: 90 seconds.",
    troubleshooting: [
      {
        problem: "The STL came out smaller (fewer triangles) than I expected.",
        solution:
          "We currently extract only the first mesh primitive of the first mesh in the GLB's scene graph. Multi-mesh GLBs (e.g., a character with separate body+clothing meshes) only yield the body. To merge meshes, open the GLB in Blender → Object Mode → Select All → Ctrl-J (Join) → File → Export → glTF .glb, then re-run this converter.",
      },
      {
        problem: "The model appears tiny or huge in my slicer.",
        solution:
          "GLB convention is meters; STL convention is millimeters in most slicers. If your dragon is 1 unit tall in GLB, it'll be 1 mm tall in PrusaSlicer. Scale the STL up by 1000x in the slicer (right-click → Scale → 1000%) or scale in Blender before exporting.",
      },
    ],
  },
  "obj-to-glb": {
    whyConvert:
      "OBJ is the de-facto legacy DCC interchange (Maya, 3ds Max, Blender, ZBrush all read it) but it's text-based, lacks compression, and has no scene graph. GLB is the modern web/AR/VR replacement. Converting OBJ to GLB shrinks file size, gains binary streaming, and gets you into the modern 3D pipeline (model-viewer, Sketchfab, WebXR, USDZ via gltf2usd).",
    example:
      "Your sculptor delivers final asset as `character.obj`. You need it on a Next.js product page rendered via `<model-viewer>`. Convert to `character.glb`, drop in `public/`, reference in the component. 10x smaller than the OBJ source after binary packing, loads in 200ms on a typical connection.",
    troubleshooting: [
      {
        problem: "UVs and texture from my OBJ don't appear in the GLB.",
        solution:
          "Our OBJ→GLB converter currently emits only vertex positions and faces. UVs (vt lines), normals (vn), and material references (mtllib + usemtl) are dropped. For textured models, open the .obj in Blender → File → Import → Wavefront .obj (with `Image Search` enabled to find the .mtl + textures) → File → Export → glTF .glb. That round-trip preserves materials.",
      },
      {
        problem: "Faces look inverted (interior of the model is visible).",
        solution:
          "OBJ winding-order convention varies between exporters. If your model came out inside-out, open in Blender → Edit Mode → Select All → Mesh → Normals → Recalculate Outside (Shift-N) → re-export to OBJ → re-run.",
      },
    ],
  },
  "glb-to-obj": {
    whyConvert:
      "Some 3D pipelines (older renderers, legacy CAM software, certain academic toolchains) still require OBJ. Converting GLB to OBJ extracts the mesh as plain ASCII text that any DCC tool from the last 30 years can read. Useful when you have a modern GLB but need to feed a legacy workflow.",
    example:
      "Your downstream renderer is an ancient academic raytracer that only reads Wavefront OBJ. The mesh you have is `scene.glb` from a recent Blender export. Convert here, get `scene.obj`, pipe into the renderer. Done.",
    troubleshooting: [
      {
        problem: "The OBJ has no texture coordinates (vt lines).",
        solution:
          "Same limitation as the reverse direction — we currently emit only positions and faces from the GLB's first primitive. Open in Blender if you need the UVs back: Import GLB → Export OBJ with default settings (which include `vt` and `vn` lines).",
      },
    ],
  },

  // ===== DICOM medical imaging =====
  "dicom-to-png": {
    whyConvert:
      "DICOM is the universal format for medical scans — every X-ray, CT, MRI, ultrasound, mammogram, and PET image from every hospital PACS. But sharing a DICOM with anyone who isn't a radiologist (a patient, a referring physician without DICOM software, a researcher embedding figures in a paper) almost always means converting it to a regular image first. PNG is the right target: lossless, opens in every browser/email/document tool, preserves the exact grayscale gradient. Critically, this conversion runs entirely in your browser — patient data never crosses the network, satisfying HIPAA in a way that upload-based DICOM viewers fundamentally cannot.",
    example:
      "Your patient downloaded their chest CT from their hospital MyChart portal as a folder of `.dcm` files. They emailed you one (`IM-0001-0042.dcm`) asking what it shows. You drop it in this tool, get a `.png` you can open in any image viewer, drop into a slack message, or insert into your consultation note. No HIPAA paperwork, no \"please install OsiriX\" friction.",
    troubleshooting: [
      {
        problem: "\"Compressed transfer syntax not supported\" error.",
        solution:
          "Your DICOM uses JPEG-baseline / JPEG-lossless / JPEG 2000 / JPEG-LS / RLE pixel compression — these require additional WASM decoders we haven't shipped yet. The fix: decompress with dcmtk's `dcmdjpeg` first (`dcmdjpeg input.dcm output.dcm` produces an uncompressed Explicit VR Little Endian file). Then re-run this converter on output.dcm.",
      },
      {
        problem: "The image looks completely black or completely white.",
        solution:
          "DICOM's pixel intensities are often outside the 0-255 range (CT scans cover roughly -1000 to 3000 Hounsfield units; many MRIs are 12-bit / 16-bit). We auto-compute the window/level from the data if the file doesn't specify one, but some scans benefit from a specific preset. If you have access to the DICOM workstation, note the recommended window/level for the modality (lung CT is typically WL/WW = -600/1500) and we'll add a windowing UI in a future update.",
      },
      {
        problem: "I want to convert a multi-frame DICOM (cine loop) — only the first frame appears.",
        solution:
          "Multi-frame DICOMs (typically ultrasound cines or cardiac MRI series) are not yet supported; we extract only the first frame. For a full cine you'll need a dedicated DICOM viewer with movie-export (OsiriX/Horos: File → Export → QuickTime Movie). If you only need still frames, dcmtk's `dcmj2pnm` can split frames into separate PNGs before you re-run this tool.",
      },
    ],
  },
  "dicom-to-json": {
    whyConvert:
      "Sometimes you don't want the pixels — you want the metadata: patient ID, study date, modality, scanner model, acquisition parameters, window/level presets, study/series/instance UIDs. Researchers building DICOM manifests, hospital IT auditing PACS exports, programmers triaging anomalies in a tag dump — all need the DICOM header as structured data. Convert here, get JSON your code can parse.",
    example:
      "You're building a tool that indexes a hospital research archive of 50,000 DICOMs. For each file, you need to extract Modality, StudyDate, and StudyDescription to build a searchable database. Loop over the files, run each through this converter, parse the JSON output, insert into your DB. Patient identifiers never leave the radiologist's workstation.",
    troubleshooting: [
      {
        problem: "I expected to see private vendor tags (Siemens, GE, Philips) in the output.",
        solution:
          "We currently extract only the standard DICOM Data Dictionary tags. Private group tags (group numbers ≥ 0x0009 with odd group number patterns) are skipped. If you need vendor-private fields, use pydicom or dcmtk's `dcmdump` for a full hex-level tag dump.",
      },
      {
        problem: "PatientName contains caret characters like \"DOE^JOHN\".",
        solution:
          "We strip the carets in the JSON output (\"DOE JOHN\"). DICOM's Person Name (PN) VR uses `^` to separate family name / given name / middle name / prefix / suffix. If you need the original caret-separated form for downstream parsing, the raw bytes are recoverable from the DICOM file directly via dcmtk's `dcmdump`.",
      },
    ],
  },

  // ===== High-volume raster image conversions =====
  "jpg-to-png": {
    whyConvert:
      "JPG is lossy: every save re-compresses and degrades the image, and it can't store transparency. Converting to PNG stops the quality bleed (PNG is lossless) and gives you an alpha channel. The usual reason: you need a screenshot, logo, or diagram with a transparent background, or you're editing an image repeatedly and don't want each save to lose detail.",
    example:
      "A designer sent you `logo.jpg` with an ugly white box behind it. You need it on a colored slide. Convert to PNG here, then knock out the white background in Preview/Photos/Photopea — impossible while it's a JPG with no alpha channel.",
    troubleshooting: [
      {
        problem: "The PNG is way bigger than the original JPG.",
        solution:
          "Expected. PNG is lossless so photographic content (millions of colors, no flat regions) doesn't compress well — a 200KB JPG photo can become a 2MB PNG. PNG only wins on file size for flat-color graphics (logos, screenshots, UI). If it's a photo and you don't need transparency, keep it as JPG.",
      },
      {
        problem: "JPG compression artifacts (blocky edges) are still visible in the PNG.",
        solution:
          "Converting JPG → PNG can't undo damage already baked into the JPG. The blocking happened when the JPG was created; PNG just preserves it losslessly from here on. There's no lossless way to recover the original — you'd need the pre-JPG source.",
      },
    ],
  },
  "png-to-jpg": {
    whyConvert:
      "PNG photos are often 5-10x larger than they need to be. JPG re-compresses photographic content to a fraction of the size with no visible quality loss at high quality settings. Convert when you're uploading photos somewhere with a size cap (job application portals, government forms, older email systems) or shrinking a folder of screenshots-of-photos.",
    example:
      "You exported 40 product photos as PNG from Figma — 180MB total. The supplier portal rejects anything over 50MB. Convert to JPG here; the same 40 images come out around 12MB with no visible difference at typical viewing size.",
    troubleshooting: [
      {
        problem: "Transparent areas turned black (or white).",
        solution:
          "JPG has no transparency channel, so transparent pixels must be flattened onto a solid background. We composite onto white by default. If your PNG had transparency and you need it preserved, JPG is the wrong target — use WebP (`png-to-webp`) which keeps the alpha channel.",
      },
      {
        problem: "Text/lines look fuzzy after conversion.",
        solution:
          "JPG's DCT compression smears sharp high-contrast edges (text, UI lines, diagrams). That content should stay PNG. JPG is only the right choice for photographs. If you must use JPG for a screenshot, it'll never look as crisp as the PNG.",
      },
    ],
  },
  "png-to-webp": {
    whyConvert:
      "WebP compresses 25-35% smaller than PNG at the same visual quality and keeps the alpha channel. For anything going on the web — site assets, blog images, app icons — WebP is the modern default that Lighthouse and PageSpeed explicitly recommend. Smaller images = faster pages = better SEO and lower bandwidth bills.",
    example:
      "Your Next.js site's hero image is a 1.4MB transparent PNG and Lighthouse is dinging your LCP. Convert to WebP here; it drops to ~400KB with identical visual quality and transparency intact. Swap the file, redeploy, LCP improves.",
    troubleshooting: [
      {
        problem: "An older tool / email client won't open the WebP.",
        solution:
          "WebP has had universal browser support since 2020 (Safari was last, in Big Sur). But legacy desktop software — old Office versions, some email clients, Windows 7-era image viewers — predates it. If the recipient is on legacy software, keep PNG. WebP is for the web, not for emailing to your accountant.",
      },
    ],
  },
  "webp-to-png": {
    whyConvert:
      "You downloaded a WebP (Google Images, a website's right-click-save, a generated AI image) and a tool you need to use won't accept it — older Photoshop, a print shop's upload form, a legacy CMS. PNG is the universal lossless fallback that everything from 1996 onward reads, and it preserves the WebP's transparency.",
    example:
      "You saved an illustration from a website and it came down as `art.webp`. Your print-on-demand service only accepts PNG/TIFF. Convert here, upload the PNG, transparency preserved, no quality loss.",
    troubleshooting: [
      {
        problem: "The original WebP was animated and only the first frame converted.",
        solution:
          "Animated WebP → PNG only extracts the first frame (PNG isn't an animation format). If you need the full animation, convert WebP → GIF instead, or WebP → MP4 for better quality.",
      },
    ],
  },
  "jpg-to-webp": {
    whyConvert:
      "Re-compressing JPG to WebP cuts file size another 25-30% with no perceptible quality loss — meaningful when you have hundreds of product photos or a media-heavy site. WebP is the format Google's own tools tell you to use for web delivery.",
    example:
      "An e-commerce catalog has 800 JPG product shots averaging 300KB. Total: 240MB, slow to serve. Batch-convert to WebP; the catalog drops to ~165MB and product pages load measurably faster on mobile.",
    troubleshooting: [
      {
        problem: "Quality looks slightly worse than the source JPG.",
        solution:
          "WebP → from an already-lossy JPG is a second lossy pass; some quality loss is unavoidable (you're compressing compressed data). It's usually imperceptible at web sizes. For zero additional loss you'd need the pre-JPG original to encode straight to WebP.",
      },
    ],
  },
  "webp-to-jpg": {
    whyConvert:
      "Something downstream rejects WebP and you don't need transparency: a job-application portal, a photo-print kiosk, an older CRM, a relative's ancient phone. JPG is the universal photographic format every device and form on earth accepts.",
    example:
      "You saved a photo from a website as WebP and the passport-photo print machine at the pharmacy only takes JPG off a USB stick. Convert here, copy to the stick, print.",
    troubleshooting: [
      {
        problem: "Transparent background became a solid color.",
        solution:
          "JPG can't store transparency. We flatten transparent pixels onto white. If the image needs transparency, JPG is the wrong format — use PNG instead.",
      },
    ],
  },
  "heic-to-jpg": {
    whyConvert:
      "HEIC is the format every iPhone since 2017 saves photos in, and most non-Apple software still can't open it: Windows without the paid codec, older Android phones, web upload forms, print kiosks. JPG is the universal fallback every device and website accepts. Bonus: the conversion strips the GPS coordinates and camera serial number Apple embeds in HEIC EXIF.",
    example:
      "You're applying for a visa and the portal demands a JPG photo, max 2MB. Your iPhone shot it as a 3.5MB HEIC the portal flat-out rejects. Convert here, get a compliant JPG, upload.",
    troubleshooting: [
      {
        problem: '"HEIC decode failed" on a photo that opens fine in Apple Photos.',
        solution:
          "Modern iPhones (2022+) write HEIC profiles — Live Photos, HEVC main-10, edited photos — that older decoders reject. We use libheif (current build) which handles these. If a specific file still fails, paste the iPhone model + whether it's a Live Photo / edited, and we'll dig in.",
      },
      {
        problem: "The colors look slightly off vs. the iPhone.",
        solution:
          "iPhone HEICs are often in the Display P3 wide-gamut color space; JPG is typically sRGB. We convert P3 → sRGB which can desaturate very vivid colors slightly. This is correct behavior for compatibility — most screens and printers are sRGB anyway.",
      },
    ],
  },
  "heic-to-png": {
    whyConvert:
      "PNG over JPG when you need the iPhone photo lossless (no re-compression) or with transparency — e.g., a screenshot of a Live Photo, a product shot you'll cut out, anything you'll edit repeatedly. PNG conversion also strips the GPS and camera-serial metadata Apple bakes into HEIC.",
    example:
      "You screenshotted a receipt on your iPhone (saved as HEIC) and need to mark it up and email it to accounting without re-compression artifacts on the text. Convert to PNG, annotate in Preview, send. Text stays razor-sharp.",
    troubleshooting: [
      {
        problem: "The PNG is enormous (10MB+ from a phone photo).",
        solution:
          "PNG is lossless so a 12MP iPhone photo balloons. If you don't specifically need lossless or transparency, `heic-to-jpg` produces a file 5-10x smaller at no visible quality loss for a photograph.",
      },
    ],
  },
  "gif-to-png": {
    whyConvert:
      "A GIF is capped at 256 colors and is the wrong container for a single still image. If what you actually have is one frame (a logo, an icon, a meme screenshot saved as GIF), PNG gives you full color depth, transparency, and lossless quality.",
    example:
      "You have a company logo someone saved as `logo.gif` years ago — 256 colors, visible banding on the gradient. Convert to PNG to stop the color clipping before placing it on a high-res page (note: PNG can't recover colors the GIF already discarded; this just prevents further loss).",
    troubleshooting: [
      {
        problem: "The animated GIF only produced one PNG.",
        solution:
          "PNG isn't an animation format, so we extract the first frame. For an animated source you want GIF → MP4 (better quality, smaller) or keep it as GIF.",
      },
      {
        problem: "Colors look banded / posterized in the PNG.",
        solution:
          "The banding is already in the GIF — it was quantized to ≤256 colors when the GIF was made. PNG preserves exactly what's there; it can't reconstruct the discarded colors. You'd need the original full-color source.",
      },
    ],
  },
  "png-to-ico": {
    whyConvert:
      "ICO is the Windows icon format — favicons, .exe icons, desktop shortcuts, Windows app resources. Browsers and Windows both expect a real multi-resolution .ico, not a renamed PNG. Convert when you're shipping a favicon or building a Windows app/installer.",
    example:
      "You designed a 512x512 app icon in Figma and exported `icon.png`. Your Electron/Tauri build config wants `icon.ico`. Convert here, drop it in `build/`, and the Windows build picks up a proper multi-size icon.",
    troubleshooting: [
      {
        problem: "The favicon looks blurry in the browser tab.",
        solution:
          "Browsers render the favicon at 16x16 / 32x32. If your source PNG had fine detail or thin lines, downscaling to 16px destroys it. Design the icon to read at 16px (bold shapes, no thin strokes) before converting — this is a design constraint, not a conversion bug.",
      },
    ],
  },
  "avif-to-jpg": {
    whyConvert:
      "AVIF is the newest, smallest image format — but support is still uneven (older Safari, many desktop apps, most print/upload pipelines can't open it). You downloaded an AVIF and need it to actually work somewhere. JPG is the universal photographic fallback.",
    example:
      "You saved an image from a modern website that served AVIF. Your design app / the client's CMS / the print shop can't open `.avif`. Convert to JPG here and it works everywhere.",
    troubleshooting: [
      {
        problem: "Slight quality loss vs. the AVIF.",
        solution:
          "AVIF → JPG is a re-encode from one lossy format to another, so there's a small unavoidable quality pass. Usually imperceptible. If you need transparency from the AVIF, use PNG instead — JPG flattens it.",
      },
    ],
  },
  "webp-to-avif": {
    whyConvert:
      "AVIF compresses ~20% smaller than WebP at equivalent quality and is the current best-in-class web image format. If you're optimizing a site that already serves WebP and want the next file-size win (and your audience is on current browsers), AVIF is the upgrade.",
    example:
      "Your image CDN serves WebP. Lighthouse still flags 'serve images in next-gen formats' because AVIF exists. Convert the heaviest hero/banner images to AVIF, serve with a `<picture>` fallback to WebP, shave another 20% off the largest payloads.",
    troubleshooting: [
      {
        problem: "Encoding took noticeably longer than other conversions.",
        solution:
          "AVIF encoding is computationally heavier than WebP/JPG — that's inherent to the codec (it's based on the AV1 video codec). The output is worth it for delivery; just expect a slower convert step, especially on large images.",
      },
    ],
  },
  "svg-to-png": {
    whyConvert:
      "SVG is vector and infinitely scalable, but tons of contexts only accept raster: email clients (which strip SVG for security), social media uploads, slide decks, OG/preview images, Office documents, print workflows. PNG rasterizes the SVG at a fixed resolution with transparency preserved.",
    example:
      "You have a logo as `logo.svg`. You need it as the image in a Mailchimp email — but every email client strips SVG. Rasterize to PNG at 2x your display size for retina sharpness, drop it into the email template.",
    troubleshooting: [
      {
        problem: "The PNG came out blurry or too small.",
        solution:
          "SVG has no inherent pixel size — rasterizing uses the SVG's viewBox/width. If your SVG declares a small width (e.g., 24x24) the PNG is tiny. Edit the SVG's `width`/`height` (or viewBox scale) up before converting, then export at 2x for retina.",
      },
      {
        problem: "Fonts/text in the SVG rendered wrong or as a fallback font.",
        solution:
          "SVG text referencing a font that isn't embedded falls back to a system font when rasterized. Either convert the text to outlines/paths in your vector editor (Inkscape: Path → Object to Path) before exporting the SVG, or embed the font, then re-convert.",
      },
    ],
  },

  // ===== PDF document conversions =====
  "jpg-to-pdf": {
    whyConvert:
      "PDF is the format every form, portal, and office workflow expects for documents. Wrapping JPGs in a PDF turns a folder of phone-photographed pages, receipts, or scans into one shareable, printable, paginated file you can email or upload as a single attachment.",
    example:
      "Your landlord wants 'one PDF of all your pay stubs.' You photographed 6 of them with your phone (6 JPGs). Convert here — they come out as a single 6-page PDF in order, one stub per page, ready to email.",
    troubleshooting: [
      {
        problem: "Pages are in the wrong order.",
        solution:
          "Pages follow the order you select/drop the files. Rename them `01.jpg`, `02.jpg`, ... before adding so the sort is unambiguous, or add them one at a time in the order you want.",
      },
      {
        problem: "Photos of documents look skewed/dark in the PDF.",
        solution:
          "We embed the JPG as-is — we don't auto-deskew or brighten. For document photos, run them through your phone's built-in scanner (iOS Notes → scan, or Google Drive → scan) first; those auto-correct perspective and contrast, then convert the cleaned images here.",
      },
    ],
  },
  "pdf-to-jpg": {
    whyConvert:
      "Sometimes you need a page as an image, not a document: posting a single page to Instagram/X/LinkedIn, embedding it in slides or Notion, an email preview, or sending to someone who can't open PDFs. Each PDF page becomes one JPG.",
    example:
      "You want to share page 3 of a research paper as an image in a tweet. Convert the PDF here, grab the JPG of page 3, attach it. No 'click to download PDF' friction for your readers.",
    troubleshooting: [
      {
        problem: "Text in the JPG looks soft/fuzzy.",
        solution:
          "PDFs are vector; rasterizing to JPG fixes a resolution. Low DPI = soft text. We render at a sensible default, but tiny text on a dense page will always soften when flattened. For sharp text consider `pdf-to-png` (no JPG compression smear on edges).",
      },
      {
        problem: "Multi-page PDF — where are the other pages?",
        solution:
          "Each page is a separate JPG; a multi-page PDF produces a zip of per-page images. If you only got one, the source PDF likely has one page.",
      },
    ],
  },
  "png-to-pdf": {
    whyConvert:
      "Same as jpg-to-pdf but for lossless/transparent images: turning screenshots, scanned documents, or design mockups into a single shareable, printable PDF. PDF is what every submission portal and office workflow wants.",
    example:
      "You took 4 screenshots documenting a bug for a support ticket. The vendor's portal wants 'a single PDF.' Convert the 4 PNGs here into one 4-page PDF and attach it.",
    troubleshooting: [
      {
        problem: "The PDF file is very large.",
        solution:
          "PNGs are lossless so screenshots-of-photos embed huge. If the images are photographic and size matters, convert them to JPG first then to PDF, or use `compress-pdf` on the result.",
      },
    ],
  },
  "pdf-to-docx": {
    whyConvert:
      "You need to edit the words, not just view them: updating a resume someone sent as PDF, revising an old contract you only have as PDF, reformatting study notes, filling a non-fillable form. DOCX opens in Word, Pages, Google Docs, and LibreOffice with editable text and paragraphs.",
    example:
      "A recruiter sent your own resume back as a PDF with their agency's footer stamped on it. You need to tweak a bullet and remove the footer. Convert to DOCX here, edit in Word, export clean.",
    troubleshooting: [
      {
        problem: "The layout is messy — columns/tables didn't survive.",
        solution:
          "PDF has no concept of paragraphs or tables — it's positioned glyphs on a page. Reconstructing structure is inherently lossy for heavily-designed layouts (multi-column, complex tables, infographics). Simple text-document PDFs convert cleanly; magazine-style layouts will need touch-up in Word.",
      },
      {
        problem: "It's a scanned PDF and the DOCX has no editable text.",
        solution:
          "A scanned PDF is just images of pages — there's no text to extract. You need OCR first to recognize the characters. Run the PDF through an OCR step (or `pdf-to-text` if it has a text layer), then the result is editable.",
      },
    ],
  },
  "docx-to-pdf": {
    whyConvert:
      "PDF is the universal final-form document: it looks identical on every device, can't be accidentally edited, and is what every job portal, court e-filing, print shop, and email-an-invoice workflow expects. You write in Word; you send as PDF.",
    example:
      "You finished a cover letter in Word. The job application portal only accepts PDF and warns that DOCX uploads are rejected. Convert here, upload the PDF, formatting locked exactly as you laid it out.",
    troubleshooting: [
      {
        problem: "Fonts changed in the PDF.",
        solution:
          "If the DOCX used a font not embedded in the file, conversion substitutes a fallback. In Word: File → Options → Save → check 'Embed fonts in the file', re-save the DOCX, then convert. Or use common fonts (Calibri, Arial, Times) that are universally available.",
      },
      {
        problem: "Page breaks / spacing shifted slightly.",
        solution:
          "Word reflows text based on the rendering engine; small spacing differences between Word's layout and the PDF renderer are normal. For pixel-exact output, in Word use Print → Save as PDF (uses Word's own layout engine), or accept the minor reflow — readers won't notice.",
      },
    ],
  },
  "pdf-to-text": {
    whyConvert:
      "You want the raw words, no formatting: feeding a document into an LLM, grepping a contract for a clause, word-counting a manuscript, pulling quotes from a paper, or diffing two versions of a document. Plain text strips all the layout noise.",
    example:
      "You're checking whether a 90-page vendor contract mentions 'auto-renewal' anywhere. Convert to text, Cmd-F / grep for the term across the whole thing in two seconds instead of eyeballing 90 PDF pages.",
    troubleshooting: [
      {
        problem: "The output is empty or garbled.",
        solution:
          "The PDF is almost certainly a scan (images of pages) with no embedded text layer. Text extraction needs an actual text layer. Run the PDF through OCR first, then extract. You can check: if you can't select/highlight text in the PDF viewer, there's no text layer.",
      },
      {
        problem: "Columns got interleaved (lines from two columns mixed).",
        solution:
          "PDF stores glyph positions, not reading order. Two-column academic papers often extract with left and right columns interleaved line-by-line. This is a known hard problem in PDF text extraction; for clean multi-column extraction you may need a layout-aware tool. Single-column documents extract correctly.",
      },
    ],
  },
  "compress-pdf": {
    whyConvert:
      "Email gateways (25MB Gmail, 10MB many corporate), court e-filing systems, and upload forms reject big PDFs. Compression shrinks the file — mostly by re-compressing embedded images — so the document goes through without you having to split or rebuild it.",
    example:
      "You scanned a 30-page contract at high DPI; it's 48MB and bounces off the court's 35MB e-filing limit. Compress here; the text stays readable and it drops under the limit so the filing goes through.",
    troubleshooting: [
      {
        problem: "The file barely got smaller.",
        solution:
          "Most PDF size lives in embedded images. A text-only PDF is already small — there's little to compress. If yours is text-heavy and already lean, there's no further win to extract; the file is just that size.",
      },
      {
        problem: "Scanned text looks degraded after compression.",
        solution:
          "Aggressive image re-compression on a scanned (image-only) PDF can soften text. There's an inherent trade-off between size and scan fidelity. If text legibility is critical, the document needs OCR + a text layer (tiny) rather than image compression.",
      },
    ],
  },

  // ===== Audio / video conversions =====
  "mp4-to-mp3": {
    whyConvert:
      "You want the audio without the video: a song from a downloaded clip, a lecture you'll listen to on a walk, an interview to transcribe, a podcast episode someone sent as a video file. MP3 is tiny, plays on every device, and works in every podcast/music app.",
    example:
      "A 45-minute conference talk was shared as a 1.2GB MP4. You just want to listen on your commute. Convert to MP3 — about 40MB — drop it in your podcast app's local files, done.",
    troubleshooting: [
      {
        problem: "Large video took a long time or ran out of memory.",
        solution:
          "The whole conversion runs in your browser tab, so a 2GB+ video can hit browser memory limits, especially on mobile. Use a desktop browser for big files, close other tabs, or trim the video to the segment you need first.",
      },
      {
        problem: "There's no audio in the output.",
        solution:
          "The source MP4 has no audio track (screen recordings without mic, some silent clips). Nothing to extract. Confirm the video actually plays sound in a media player.",
      },
    ],
  },
  "mov-to-mp4": {
    whyConvert:
      "MOV is Apple's video container — what iPhones and QuickTime produce. MP4 is the universal one that Windows, Android, every social platform, and every video editor accepts without complaint. Convert when you're sending an iPhone video to a non-Apple recipient or uploading where MOV is rejected.",
    example:
      "You filmed a clip on your iPhone (it's a .mov) and the contest submission form only accepts MP4. Convert here, upload the MP4 — same video, universally accepted container.",
    troubleshooting: [
      {
        problem: "The conversion is slow for a long video.",
        solution:
          "If the MOV's codec is already H.264/H.265 we can often re-wrap to MP4 fast (no re-encode). Some MOVs use Apple ProRes or other codecs that require a full re-encode, which is slow in-browser. For very large ProRes files a desktop tool will be faster.",
      },
    ],
  },
  "mp4-to-gif": {
    whyConvert:
      "GIF autoplays silently and loops everywhere — Slack, Discord, GitHub READMEs, docs, places that don't allow video embeds. Converting a short MP4 clip to GIF makes it shareable in all those text-first contexts.",
    example:
      "You recorded a 4-second screen capture of a UI bug as MP4. The bug tracker doesn't embed video but does render GIFs inline. Convert here, paste the GIF into the ticket, reviewers see the repro without downloading anything.",
    troubleshooting: [
      {
        problem: "The GIF file is huge / bigger than the MP4.",
        solution:
          "GIF is an ancient, inefficient format — a 5-second clip can easily exceed the source MP4. Keep clips short (under ~6s), and crop to the region that matters. If the destination accepts video, MP4 is dramatically smaller; GIF is only for places that won't take video.",
      },
      {
        problem: "Colors look banded / washed out.",
        solution:
          "GIF is capped at 256 colors per frame, so gradients and video footage band visibly. This is a hard format limitation, not a conversion bug. Screen recordings with flat UI colors convert cleanly; camera footage will always posterize.",
      },
    ],
  },
  "gif-to-mp4": {
    whyConvert:
      "MP4 is 5-20x smaller than the equivalent GIF and full color. Twitter/X, Reddit, and most modern platforms auto-convert GIFs to MP4 on upload anyway — doing it yourself first means a smaller upload, faster load, and better quality for viewers.",
    example:
      "You have a 12MB reaction GIF you want to post. Convert to MP4 here — it drops to under 1MB with smoother playback and full color, and it loops fine as a video.",
    troubleshooting: [
      {
        problem: "The MP4 doesn't loop automatically where I posted it.",
        solution:
          "Looping is a player/platform setting, not a property of the file. On the web use `<video autoplay loop muted playsinline>`. Most social platforms loop short MP4s automatically; some don't. The conversion is correct — looping behavior is downstream.",
      },
    ],
  },
  "wav-to-mp3": {
    whyConvert:
      "WAV is uncompressed — roughly 10MB per minute. MP3 is ~1MB per minute at good quality, plays everywhere, and is what you want for sharing voice memos, music demos, podcast drafts, or anything you'll email or upload.",
    example:
      "You recorded a 20-minute interview in a DAW and exported WAV — it's 200MB, too big to email. Convert to MP3, ~20MB, send it to the transcriptionist.",
    troubleshooting: [
      {
        problem: "Audiophile says the MP3 lost detail vs. the WAV.",
        solution:
          "True — MP3 is lossy and discards frequency content the encoder judges inaudible. For casual listening, voice, and demos it's indistinguishable. For mastering or archival, keep the WAV (or use FLAC for lossless compression). Pick MP3 only when size/compatibility beats absolute fidelity.",
      },
    ],
  },
  "mp3-to-wav": {
    whyConvert:
      "Audio editors and DAWs (Audacity, Audition, Pro Tools, Logic) prefer uncompressed WAV for editing — every MP3 re-export is another lossy pass. Converting MP3 → WAV gives you a stable working file that won't degrade further as you cut, splice, and process it.",
    example:
      "You only have a song as MP3 but need to chop it into samples in Ableton. Convert to WAV first so each edit/export isn't re-compressing — the WAV is your lossless working copy from here on.",
    troubleshooting: [
      {
        problem: "The WAV doesn't sound better than the MP3.",
        solution:
          "Correct — converting MP3 → WAV can't recover detail the MP3 already discarded. It just stops further loss during editing. The WAV is for a clean editing workflow, not for resurrecting quality that's gone.",
      },
      {
        problem: "The WAV file is massive.",
        solution:
          "Expected — WAV is uncompressed (~10MB/minute). That's the point for editing. Export back to MP3/AAC for delivery once you're done editing.",
      },
    ],
  },

  // ===== Data / tabular conversions =====
  "csv-to-json": {
    whyConvert:
      "CSV is what spreadsheets and analysts export; JSON is what code, APIs, and config systems consume. Converting bridges the gap when you need to seed a database, feed a script, mock an API response, or import data into a JS/Python tool that expects an array of objects.",
    example:
      "A colleague sends `users.csv` from Excel. You need to seed your dev database with it via a Node script that expects `[{name, email, ...}]`. Convert here, get a JSON array, `JSON.parse` it in the seed script.",
    troubleshooting: [
      {
        problem: "Numbers came through as strings (\"42\" not 42).",
        solution:
          "CSV has no types — every cell is text. We preserve values as strings to avoid corrupting things like ZIP codes, phone numbers, and IDs with leading zeros (`007` must not become `7`). Coerce specific fields to numbers in your code where you know it's safe.",
      },
      {
        problem: "Commas inside a field broke the columns.",
        solution:
          "Properly quoted CSV (`\"Smith, John\"`) parses correctly. If the source wasn't quoting fields with commas, that CSV is malformed at the source — re-export from the spreadsheet with proper quoting (every standard exporter does this by default).",
      },
    ],
  },
  "json-to-csv": {
    whyConvert:
      "JSON comes out of APIs and apps; CSV is what opens in Excel/Sheets/Numbers for the non-technical people who need to filter, pivot, and chart it. Converting turns an API dump into something a finance or ops colleague can actually work with.",
    example:
      "You pulled 2,000 orders from a REST API as a JSON array. Your ops lead wants to pivot them by region in Excel. Convert to CSV here, send the file, they open it in Excel and pivot — no JSON tooling on their end.",
    troubleshooting: [
      {
        problem: "Nested objects became [object Object] or weird strings.",
        solution:
          "CSV is flat — it has no way to represent nested structures. Nested objects/arrays get JSON-stringified into a single cell. If you need nested fields as their own columns, flatten the JSON first (e.g., `address.city` → a `city` key) before converting.",
      },
      {
        problem: "Rows have different columns / missing values.",
        solution:
          "If the JSON objects don't all have the same keys, the CSV header is the union of all keys and missing values are blank. That's correct behavior — but if you expected uniform rows, the source data is heterogeneous; inspect the JSON.",
      },
    ],
  },
  "xlsx-to-csv": {
    whyConvert:
      "CSV is the universal data interchange format — every database import, every data pipeline, every scripting language reads it; XLSX is a zipped XML bundle that needs a library. Convert when you're feeding spreadsheet data into anything programmatic, or stripping a workbook down to plain rows.",
    example:
      "Finance sends `Q3.xlsx`. Your data pipeline's loader only accepts CSV. Convert the relevant sheet here, drop the CSV into the pipeline's input folder, the nightly job picks it up.",
    troubleshooting: [
      {
        problem: "Only one sheet came through — my workbook has several.",
        solution:
          "CSV is a single table; it can't hold multiple sheets. We export the first (or active) sheet. For a multi-sheet workbook, convert each sheet separately, or export the specific sheet you need from Excel first (right-click tab → Move or Copy → to new workbook → save).",
      },
      {
        problem: "Formulas turned into their computed values.",
        solution:
          "Correct and intended — CSV has no formula concept, so each cell becomes its current calculated result. If you need the formulas themselves, CSV is the wrong target; keep the XLSX.",
      },
      {
        problem: "Dates look like serial numbers (45678) or shifted.",
        solution:
          "Excel stores dates as serial numbers internally. We convert recognized date-formatted cells to ISO date strings. If a column was formatted as 'General' rather than 'Date' in Excel, it exports as the raw serial — reformat the column as Date in Excel before converting.",
      },
    ],
  },
  "csv-to-xlsx": {
    whyConvert:
      "CSV opens in Excel but loses all the things a real workbook needs: number/date formatting, multiple sheets, frozen headers, the ability to add formulas. Converting to XLSX gives the recipient a proper editable workbook instead of a raw text file Excel sometimes mangles (leading zeros, big numbers, dates).",
    example:
      "You exported a report as CSV but the client opens it in Excel and the order IDs `00451` show as `451`, and the phone numbers turned into scientific notation. Convert to XLSX where text columns stay text — the client sees the data correctly without manually importing.",
    troubleshooting: [
      {
        problem: "Numbers I wanted as text (IDs, ZIPs) still look numeric.",
        solution:
          "We type-detect conservatively. Values with leading zeros or that look like identifiers are kept as text; clearly numeric columns become numbers. If a specific column must be forced to text, prefix the CSV values with a single quote or format the column as Text in Excel after opening.",
      },
    ],
  },
  "bibtex-to-csv": {
    whyConvert:
      "BibTeX is LaTeX's bibliography format — great for compiling a paper, useless for a literature-review spreadsheet. Converting to CSV puts every reference in a row with title/author/year/journal columns you can sort, filter, dedupe, and share with non-LaTeX collaborators.",
    example:
      "Your advisor wants a spreadsheet of all 140 references in your thesis, sortable by year, to check coverage. Export your `.bib` from Zotero/Mendeley, convert here, open the CSV in Sheets, sort by year — gaps obvious in seconds.",
    troubleshooting: [
      {
        problem: "Author names show as Garc{\\'i}a or M\\'exico.",
        solution:
          "Those are LaTeX accent macros. We decode the common ones (`\\'a` → á, `\\~n` → ñ, etc.) automatically. If a rare macro slips through, it's a less-common command — paste the exact string and we'll add it to the decoder.",
      },
      {
        problem: '"No citations found" error.',
        solution:
          "The file may not be BibTeX (a RIS or EndNote export renamed .bib), may use an unusual delimiter, or may be empty. Open it in a text editor and confirm it starts with `@article{`, `@book{`, etc. If you exported from Mendeley, make sure you chose BibTeX, not RIS.",
      },
    ],
  },
  "bibtex-to-ris": {
    whyConvert:
      "RIS is the import format for EndNote, Reference Manager, RefWorks, and Zotero. If a collaborator uses one of those instead of a BibTeX-native tool, RIS is how you hand off your library so they can import it cleanly with authors, journals, and DOIs intact.",
    example:
      "You manage references in JabRef (BibTeX). Your co-author uses EndNote and needs your 60 sources. Export `.bib`, convert to RIS here, send it — they do File → Import → Reference Manager (RIS) and your library lands in EndNote with fields mapped.",
    troubleshooting: [
      {
        problem: "Conference papers lost their venue/booktitle in EndNote.",
        solution:
          "BibTeX `booktitle` maps to RIS `T2` (secondary title), which our converter emits. If EndNote still shows it blank, check EndNote's RIS import filter maps T2 → 'Secondary Title' for the Conference Paper reference type (Edit → Import Filters).",
      },
      {
        problem: "Accented author names look wrong after import.",
        solution:
          "We decode LaTeX accent macros (`\\'a` → á) to real Unicode before writing RIS. If they still look off, the reference manager may be importing the RIS as the wrong character encoding — set the import to UTF-8.",
      },
    ],
  },

  // ===== Batch 2a: image format pairs (real search volume) =====
  "bmp-to-png": {
    whyConvert:
      "BMP is an ancient uncompressed Windows format — a 1080p BMP is ~6MB where the same image as PNG is a fraction of that, losslessly. Convert when you've got BMPs out of legacy Windows software, an old scanner, or a screenshot tool and need something modern apps and the web actually accept.",
    example:
      "An industrial camera or a legacy LIMS exports frames as .bmp. You need to attach one to a Jira ticket, but it's 6MB and Jira balks. Convert to PNG — same pixels exactly, a fraction of the size, uploads fine.",
    troubleshooting: [
      {
        problem: "The PNG isn't much smaller than the BMP.",
        solution:
          "PNG is lossless, so a photographic BMP (lots of unique colors) won't shrink dramatically — it only wins big on flat-color content (screenshots, UI, diagrams). If it's a photo and size is critical and you don't need lossless, convert to JPG instead.",
      },
    ],
  },
  "png-to-bmp": {
    whyConvert:
      "Some legacy or embedded software only ingests uncompressed BMP — old industrial HMIs, certain medical/lab instruments, vintage game modding tools, some Windows-only kiosks. BMP is the lowest-common-denominator raster these expect.",
    example:
      "You're modding an old game whose texture loader only reads 24-bit BMP. Your edited texture is a PNG. Convert to BMP here, drop it in the assets folder, the game loads it.",
    troubleshooting: [
      {
        problem: "Transparency disappeared.",
        solution:
          "Standard 24-bit BMP has no alpha channel. Transparent pixels are flattened onto white. If the target software needs transparency it won't be via BMP — that's a format limitation.",
      },
    ],
  },
  "bmp-to-jpg": {
    whyConvert:
      "A photographic BMP is enormous and uncompressed. JPG shrinks it 10-20x with no visible quality loss for photos — the right move when a legacy device gave you BMPs you need to email, upload, or store at scale.",
    example:
      "An old scanner saved a stack of document photos as .bmp, 6MB each. The expense portal caps uploads at 5MB. Convert to JPG — they drop to a few hundred KB, well under the limit.",
    troubleshooting: [
      {
        problem: "Text/screenshots look fuzzy after conversion.",
        solution:
          "JPG smears sharp edges (text, UI lines). It's only the right target for photographs. For a BMP screenshot, use PNG instead — lossless and crisp.",
      },
    ],
  },
  "gif-to-jpg": {
    whyConvert:
      "If a GIF is actually a single still photo someone saved in the wrong format, JPG is far smaller and the natural container for photographic content. (For animated GIFs, only the first frame is taken — use gif-to-mp4 for motion.)",
    example:
      "Someone sent a photo as a .gif (256-color, banded, oversized). You want a clean, small JPG to drop into a doc. Convert here — note JPG can't restore the colors the GIF already quantized away; it just gives you a properly-compressed photographic file.",
    troubleshooting: [
      {
        problem: "Colors look banded / posterized.",
        solution:
          "The banding is baked into the GIF — it was reduced to ≤256 colors when the GIF was made. No converter can reconstruct the discarded colors; you'd need the original full-color source.",
      },
      {
        problem: "My animated GIF only produced one image.",
        solution:
          "JPG isn't an animation format — we extract the first frame. For motion, use gif-to-mp4 (smaller and full color than the GIF).",
      },
    ],
  },
  "ico-to-png": {
    whyConvert:
      "ICO is the Windows icon container — favicons, .exe icons, shortcut icons. To edit one in a normal image editor, preview it, or reuse the artwork elsewhere, you need it as a standard PNG with transparency intact.",
    example:
      "You inherited a project with only `favicon.ico` and need to redesign it. Convert to PNG here, open in Figma/Photopea, edit, then export back to ICO (png-to-ico) when done.",
    troubleshooting: [
      {
        problem: "The PNG came out tiny (16x16 or 32x32).",
        solution:
          "ICO files pack multiple resolutions; many favicons only contain 16/32px. We extract the largest available. If the source ICO only has small sizes, there's no high-res version inside to recover — the artwork must be recreated at higher resolution.",
      },
    ],
  },
  "ico-to-jpg": {
    whyConvert:
      "Quick way to get a viewable, shareable raster of an icon when you don't need transparency — pasting an app icon into a doc, a slide, or a chat. JPG opens literally everywhere.",
    example:
      "You want to show a client the favicon options in a Google Doc. Convert each .ico to JPG and drop them inline — no plugin, no 'can't preview this file type.'",
    troubleshooting: [
      {
        problem: "The icon has a colored box behind it now.",
        solution:
          "JPG can't store transparency, so the icon's transparent background is flattened (to white by default). For icons you almost always want ico-to-png instead, which keeps the transparency.",
      },
    ],
  },
  "heic-to-webp": {
    whyConvert:
      "Best of both: take an iPhone HEIC and get a modern, tiny, web-ready image that keeps transparency and is far smaller than PNG/JPG. Ideal when the HEIC photo is destined for a website, app, or anywhere page weight matters. Also strips the GPS/camera metadata Apple embeds.",
    example:
      "You shot product photos on your iPhone (HEIC) for your store's site. Convert to WebP — smallest modern format, browsers all support it since 2020, and your product pages stay fast on mobile.",
    troubleshooting: [
      {
        problem: "A recipient's old software won't open the WebP.",
        solution:
          "WebP is universal on the modern web but legacy desktop apps (old Office, some email clients) predate it. For web use it's ideal; for emailing to someone on old software, use heic-to-jpg.",
      },
    ],
  },
  "heic-to-pdf": {
    whyConvert:
      "Turn iPhone photos of documents — receipts, signed forms, ID cards, whiteboards — into a single shareable, printable PDF that every portal and office workflow expects. One PDF beats a pile of .heic files nobody on Windows can open.",
    example:
      "You photographed 4 pages of a signed contract on your iPhone (HEIC). The other party wants 'one PDF.' Convert here — 4 HEICs become a single 4-page PDF, in order, ready to email.",
    troubleshooting: [
      {
        problem: "Document photos look dark or skewed in the PDF.",
        solution:
          "We embed the photos as captured — no auto-deskew/brighten. For document scans, use your iPhone's built-in scanner (Notes → scan, or Files → scan) first; it auto-corrects perspective and contrast. Then convert the cleaned images.",
      },
    ],
  },
  "avif-to-png": {
    whyConvert:
      "AVIF is the newest, smallest web image format, but support is still uneven — older Safari, many desktop editors, print/upload pipelines can't open it. PNG is the universal lossless fallback that works everywhere and keeps transparency.",
    example:
      "You saved an image from a modern site (served AVIF). Your design tool / the client's CMS won't open .avif. Convert to PNG here and it works everywhere, lossless.",
    troubleshooting: [
      {
        problem: "The PNG is much larger than the AVIF.",
        solution:
          "Expected — AVIF is highly compressed; PNG is lossless. If you need a small file and don't need lossless/transparency, avif-to-jpg produces something far smaller for photos.",
      },
    ],
  },
  "avif-to-webp": {
    whyConvert:
      "When AVIF is too new for your target but you still want a small, transparent, modern web image: WebP is the slightly-older format with near-universal browser support since 2020. The pragmatic downgrade for broad web compatibility.",
    example:
      "Your CDN's image pipeline doesn't yet support AVIF source files but does WebP. Convert your AVIF masters to WebP here so they slot into the existing pipeline with minimal size penalty.",
    troubleshooting: [
      {
        problem: "Slight quality change vs. the AVIF.",
        solution:
          "AVIF → WebP is a re-encode between two lossy formats, so there's a small unavoidable pass. Usually imperceptible at web sizes. For zero extra loss you'd need the original source to encode straight to WebP.",
      },
    ],
  },
  "jpg-to-avif": {
    whyConvert:
      "AVIF compresses ~50% smaller than JPG at the same visual quality — the biggest single image-weight win available for the web. Convert when you're optimizing a media-heavy site and your audience is on current browsers.",
    example:
      "Your photography portfolio's gallery is 30 large JPGs, 6MB total, slow on mobile. Convert to AVIF — same perceived quality, roughly half the bytes, gallery loads visibly faster.",
    troubleshooting: [
      {
        problem: "Encoding took noticeably longer.",
        solution:
          "AVIF encoding is computationally heavy (it's the AV1 video codec applied to a still). That's inherent. Worth it for delivery; just expect a slower convert step on large images.",
      },
      {
        problem: "An older browser/app can't open the AVIF.",
        solution:
          "Serve AVIF with a `<picture>` fallback to JPG/WebP for the few clients that lack support. For non-web use (emailing, legacy apps), keep JPG.",
      },
    ],
  },
  "jpg-to-bmp": {
    whyConvert:
      "Niche but real: some legacy/embedded software and a few scientific instruments only accept uncompressed 24-bit BMP. Convert when a downstream tool literally won't take anything else.",
    example:
      "An old machine-vision SDK's import only reads BMP. Your reference image is a JPG. Convert to BMP here so the SDK ingests it.",
    troubleshooting: [
      {
        problem: "The BMP is huge.",
        solution:
          "BMP is uncompressed by design — that's why the legacy tool wants it. Large size is expected and unavoidable for this format.",
      },
    ],
  },
  "jpg-to-gif": {
    whyConvert:
      "Only useful for a specific case: you need a single still image in GIF form because a destination only accepts GIF (an old forum, a legacy CMS field, a specific chat sticker slot). For photos GIF is a poor choice — 256 colors — but sometimes the destination forces it.",
    example:
      "An old vBulletin-style forum's avatar uploader only accepts .gif. Your photo is a JPG. Convert here to satisfy the uploader (accepting the 256-color limitation it imposes).",
    troubleshooting: [
      {
        problem: "The photo looks banded/posterized.",
        solution:
          "GIF caps at 256 colors per frame, so photographs band badly. This is a hard GIF limitation. If the destination accepts PNG or JPG, use those instead — GIF is only for places that force it.",
      },
    ],
  },

  // ===== Batch 2b: color space conversions =====
  "hsl-to-hex": {
    whyConvert:
      "Designers and CSS authors think in HSL (hue/saturation/lightness — easy to reason about 'a bit darker, less saturated'), but most design tools, brand guides, and legacy CSS want hex. Convert when handing an HSL value off to anything that expects `#RRGGBB`.",
    example:
      "You dialed in a color in dev tools as `hsl(210, 80%, 45%)` and need to put it in the brand palette doc that lists everything as hex. Convert here, paste `#1f7acc` into the doc.",
    troubleshooting: [
      {
        problem: "The hex doesn't look exactly like the HSL preview.",
        solution:
          "HSL → RGB → hex involves rounding to 8-bit channels, so there can be a ±1 difference per channel. It's imperceptible. For exact round-tripping keep the HSL as the source of truth.",
      },
    ],
  },
  "hsl-to-rgb": {
    whyConvert:
      "HSL is intuitive to author; RGB is what canvas APIs, many graphics libraries, game engines, and older systems consume. Convert when moving a designer-chosen HSL value into code that needs `rgb()` triplets.",
    example:
      "Your designer specced accent colors in HSL. Your Unity/Canvas/SVG code needs RGB 0-255. Convert each here and drop the triplets into the code.",
    troubleshooting: [
      {
        problem: "RGB values are floats, I need 0-255 ints.",
        solution:
          "We output 0-255 integers. If you see floats it's a different tool — for code use, round each channel; the visual difference from rounding is zero.",
      },
    ],
  },
  "cmyk-to-hex": {
    whyConvert:
      "Print designers work in CMYK; the web works in hex/RGB. Convert when you need to approximate a print color on screen — a brand color from a print style guide that you now need in a website or slide.",
    example:
      "The brand book lists the primary as CMYK `0/85/75/0` for print. You're building the site and need the closest screen equivalent. Convert here for a usable hex approximation.",
    troubleshooting: [
      {
        problem: "The on-screen color doesn't perfectly match the printed sample.",
        solution:
          "CMYK → RGB is fundamentally an approximation — print (subtractive, ink on paper) and screen (additive, emitted light) have different gamuts, and exact matching requires an ICC profile we don't apply. The result is a close, usable screen equivalent, not a colorimetric match. For brand-critical work, get the official RGB/hex from the brand team.",
      },
    ],
  },
  "cmyk-to-rgb": {
    whyConvert:
      "Same as cmyk-to-hex but when your target wants RGB triplets (graphics code, a design tool's RGB input) rather than a hex string. The bridge from a print spec to a screen workflow.",
    example:
      "A printer sent artwork specced in CMYK. You're recreating it in Figma which takes RGB. Convert each CMYK value here for the closest screen RGB.",
    troubleshooting: [
      {
        problem: "Colors look duller than the print proof.",
        solution:
          "Naive (non-color-managed) CMYK→RGB can desaturate, and screen vs. ink gamuts differ inherently. It's a usable approximation. For exact brand color, request the official RGB from whoever owns the brand spec.",
      },
    ],
  },
  "hex-to-cmyk": {
    whyConvert:
      "You have a web/brand color as hex and a print vendor asks for CMYK. Convert to get a sensible CMYK starting point for the print job.",
    example:
      "Your site's accent is `#1f7acc`. The print shop doing your business cards wants CMYK. Convert here and hand them the CMYK values as the starting point (they'll fine-tune against their press profile).",
    troubleshooting: [
      {
        problem: "The print shop says the CMYK is off.",
        solution:
          "Generic hex→CMYK ignores the press's ICC profile and paper stock, which materially affect ink mix. Treat our output as a starting point; the print shop's prepress will adjust it against their actual press. That's normal print workflow.",
      },
    ],
  },
  "hex-to-oklch": {
    whyConvert:
      "OKLCH is the perceptually-uniform color space in CSS Color Level 4 — Tailwind v4's default, and the right space for generating accessible palettes and consistent lightness ramps. Convert your existing hex brand colors to OKLCH to build modern, perceptually-even design tokens.",
    example:
      "You're migrating a design system to Tailwind v4 / modern CSS. Your tokens are hex. Convert each to `oklch()` here so you can adjust lightness/chroma perceptually-uniformly instead of guessing in RGB.",
    troubleshooting: [
      {
        problem: "Round-tripping hex → OKLCH → hex shifts a value slightly.",
        solution:
          "OKLCH covers a wider gamut than sRGB hex; conversion clamps/rounds at the sRGB boundary, so extreme colors can shift by ±1 per channel. For in-gamut colors it's exact. Keep one representation as the source of truth.",
      },
    ],
  },
  "hex-to-lab": {
    whyConvert:
      "CIELAB (L*a*b*) is the perceptual color space used in color science, print color matching, and Photoshop's Lab mode. Convert hex to Lab when you need perceptual color difference (ΔE) calculations or to work in Photoshop's Lab workflow.",
    example:
      "You're measuring how perceptually different two brand candidates are. Convert both hex values to Lab here, then compute ΔE between them — RGB distance lies about perceived difference; Lab doesn't.",
    troubleshooting: [
      {
        problem: "The L*a*b* numbers don't match Photoshop exactly.",
        solution:
          "Lab depends on the reference white and RGB working space. We convert via sRGB/D65. Photoshop's Lab uses D50 by default — small numeric differences are expected from the different white point, not a conversion bug.",
      },
    ],
  },

  // ===== Batch 2c: genealogy (proven traffic vertical) =====
  "gedcom-to-csv": {
    whyConvert:
      "GEDCOM is the universal family-tree interchange format (Ancestry, MyHeritage, FamilySearch, Gramps, RootsMagic all export it), but it's an unreadable nested-tag text format. CSV puts every person in a row — name, birth, death, place — so you can sort, filter, dedupe, and audit your tree in a spreadsheet, or share it with relatives who don't run genealogy software.",
    example:
      "Your tree has 1,200 people across 6 generations. You suspect duplicate ancestors and missing birth years. Export GEDCOM from Ancestry, convert to CSV here, sort by surname + birth year in Sheets — duplicates and gaps jump out in minutes.",
    troubleshooting: [
      {
        problem: "Some people are missing dates/places in the CSV.",
        solution:
          "GEDCOM only carries what was entered. Blank cells mean that fact isn't in the source file, not a conversion loss — confirm by opening the .ged in a text editor and checking the INDI record.",
      },
      {
        problem: "Family relationships (parents/children) aren't shown.",
        solution:
          "This export is one row per individual (the most-requested view). GEDCOM stores relationships in separate FAM records via @ references; flattening the full graph into one CSV is lossy. For relationship analysis keep working in genealogy software; use the CSV for per-person auditing.",
      },
    ],
  },
  "gedcom-to-html": {
    whyConvert:
      "Turn a GEDCOM into a readable web page you can open in any browser or share with family who don't use genealogy apps — no Ancestry login, no software install, just a clickable HTML file of the tree's people and facts.",
    example:
      "You want to email Grandma a readable version of the family tree. She's not installing Gramps. Convert the GEDCOM to HTML, send the file — she double-clicks, it opens in her browser, done.",
    troubleshooting: [
      {
        problem: "Living relatives' details are visible — privacy concern.",
        solution:
          "We render what's in the GEDCOM as-is, including living people. Before sharing, either privatize living individuals in your genealogy software and re-export, or remove those INDI records from the .ged first. The conversion never uploads anything, but the output file contains whatever the source did.",
      },
    ],
  },
  "csv-to-gedcom": {
    whyConvert:
      "You collected family data in a spreadsheet (a relative's list, a research log, a transcription project) and need it in real genealogy software. GEDCOM is the import format every tool accepts — convert the CSV so Ancestry/MyHeritage/Gramps can ingest it as actual linked records.",
    example:
      "A cousin sent a spreadsheet of 80 newly-found relatives. You want them in your RootsMagic tree. Convert the CSV to GEDCOM here, import the .ged into RootsMagic, merge into your tree.",
    troubleshooting: [
      {
        problem: "Relationships didn't import — everyone's an isolated individual.",
        solution:
          "A flat CSV has no inherent relationship links. We create INDI records from rows; building FAM (parent/child/spouse) links requires relationship columns the CSV may not have. For a connected tree, add the relationships in your genealogy software after import, or structure the CSV with explicit relationship references.",
      },
    ],
  },

  // ===== Batch 2d: geographic / mapping =====
  "gpx-to-kml": {
    whyConvert:
      "GPX is what GPS watches, bike computers, and hiking apps (Garmin, Strava, Komoot, Gaia) export. KML is what Google Earth and Google My Maps read. Convert to visualize a recorded track or route in Google Earth, or to share it as a map anyone can open.",
    example:
      "You recorded a 40km hike on your Garmin (GPX). You want to show the route in Google Earth with the terrain flyover. Convert to KML here, open in Google Earth, hit play on the tour.",
    troubleshooting: [
      {
        problem: "Elevation/timestamps seem missing in Google Earth.",
        solution:
          "KML carries coordinates and basic track geometry; GPX's per-point heart-rate/cadence/time extensions don't map to standard KML and are dropped. For full activity data keep the GPX; KML is for visualization.",
      },
    ],
  },
  "gpx-to-geojson": {
    whyConvert:
      "GeoJSON is the lingua franca of web mapping — Leaflet, Mapbox, deck.gl, Turf.js, PostGIS all speak it. Convert a recorded GPX track to GeoJSON to render it on a web map, run spatial analysis, or store it in a geo database.",
    example:
      "You're building a Leaflet map of your hikes. Each hike is a GPX. Convert to GeoJSON here, drop the FeatureCollection into `L.geoJSON(...)`, the track renders on the map.",
    troubleshooting: [
      {
        problem: "Elevation/time data isn't in the GeoJSON.",
        solution:
          "Standard GeoJSON geometry is 2D coordinate pairs. We can carry coordinates and properties; per-point time/elevation extensions from GPX don't have a standard GeoJSON home and are dropped. For elevation profiles keep the GPX alongside.",
      },
    ],
  },
  "geojson-to-kml": {
    whyConvert:
      "You have GeoJSON from a web-mapping tool or a GIS export and need it in Google Earth / Google My Maps, which want KML. Convert to visualize the features with Google's 3D terrain and sharing.",
    example:
      "Your team's delivery zones are a GeoJSON FeatureCollection. Ops wants to see them overlaid on Google Earth terrain. Convert to KML here, open in Google Earth Pro.",
    troubleshooting: [
      {
        problem: "Styling (colors/fills) didn't carry over.",
        solution:
          "GeoJSON has no standard styling spec (style lives in the rendering layer, e.g., Mapbox style JSON). KML has its own <Style>. We convert geometry + properties; re-apply styling in Google Earth or My Maps. The shapes and data are intact.",
      },
    ],
  },

  // ===== Batch 3a: documents =====
  "docx-to-html": {
    whyConvert:
      "You need Word content on the web — a CMS that takes HTML, an email template, a static site, a knowledge base — without the bloated markup Word's own 'Save as Web Page' produces. Clean HTML drops into any page.",
    example:
      "Marketing wrote the new help article in Word. Your docs site takes HTML/Markdown. Convert to HTML here, paste the body into the CMS, fix any heading levels, publish — no Word-export `<o:p>` garbage.",
    troubleshooting: [
      {
        problem: "Complex tables / text boxes / SmartArt look broken.",
        solution:
          "DOCX features without an HTML equivalent (floating text boxes, SmartArt, drawing canvas) can't translate cleanly. Body text, headings, lists, basic tables, bold/italic convert well. For heavily-designed docs, expect to touch up the HTML or rebuild complex visuals natively.",
      },
      {
        problem: "Images didn't appear.",
        solution:
          "Embedded images are extracted but referenced — the HTML expects them alongside it. If you need a single self-contained file, the images come out as separate assets; host them and fix the `src` paths, or use a Word→PDF route if you just need a fixed visual.",
      },
    ],
  },
  "docx-to-txt": {
    whyConvert:
      "Strip a Word doc to pure text: feeding it to an LLM, word-counting a manuscript, diffing two drafts, grepping for a clause, or pasting into a plain-text-only system. No formatting noise, just the words.",
    example:
      "You need an accurate word count of a 90-page Word manuscript minus the front matter and footnotes for a submission limit. Convert to TXT, paste into your counter or `wc -w` — exact, no formatting inflating the count.",
    troubleshooting: [
      {
        problem: "Tables turned into run-together text.",
        solution:
          "Plain text has no table concept — cells get linearized. That's expected for TXT. If you need structured tabular data out of the doc, copy the table into a spreadsheet instead; TXT is for prose.",
      },
    ],
  },
  "html-to-markdown": {
    whyConvert:
      "You're moving web content into a Markdown-based system — a static site (Hugo, Astro, Next MDX), a wiki, a README, an Obsidian vault, an LLM context file. Markdown is portable, diffable, and clean where raw HTML is noisy.",
    example:
      "You're migrating 40 blog posts off WordPress into an Astro site. Save each post's HTML, convert to Markdown here, drop the .md into `src/content/`, commit. Clean front-matter-ready text instead of WordPress div soup.",
    troubleshooting: [
      {
        problem: "Some HTML (custom embeds, complex tables) stayed as raw HTML in the output.",
        solution:
          "Markdown is a subset of HTML's expressiveness — constructs with no Markdown equivalent (iframes, complex nested tables, custom components) are passed through as inline HTML, which is valid in most Markdown renderers (MDX, GitHub). Leave them or rebuild as components.",
      },
    ],
  },
  "html-to-docx": {
    whyConvert:
      "Someone needs a web page or HTML report as an editable Word document — a client who 'only uses Word', a contract that must be redlined, a report that goes into a Word-based approval workflow.",
    example:
      "Your app generates an HTML invoice/report. The finance team needs to annotate it in Word before sign-off. Convert to DOCX here, send it, they track-changes in Word.",
    troubleshooting: [
      {
        problem: "CSS layout/styling didn't fully carry over.",
        solution:
          "Word's layout model isn't CSS. Structural content (headings, paragraphs, lists, tables, basic emphasis) converts; complex CSS grid/flex layouts and web fonts approximate. For pixel-faithful output where editing isn't needed, use an HTML→PDF route instead.",
      },
    ],
  },
  "epub-to-pdf": {
    whyConvert:
      "EPUB is reflowable e-reader format; PDF is fixed-page for printing, annotating in a PDF app, or reading on something that doesn't do EPUB well. Convert when you want to print a book/sample or mark it up with a PDF tool.",
    example:
      "You have a technical book as EPUB but want to print two chapters double-sided to read away from screens. Convert to PDF here, print pages 40-95.",
    troubleshooting: [
      {
        problem: "Text doesn't fit the page / odd line breaks.",
        solution:
          "EPUB has no fixed page size — converting to PDF imposes one, so reflow can produce awkward breaks. It's readable but not typeset like a print book. For best reading fidelity, an e-reader rendering the EPUB natively beats any EPUB→PDF.",
      },
    ],
  },
  "epub-to-text": {
    whyConvert:
      "Pull the raw prose out of an e-book: feeding it to an LLM, full-text searching, analyzing word frequency, or extracting quotes. Plain text strips the EPUB's XHTML/packaging.",
    example:
      "You want to ask an LLM questions about a public-domain book you have as EPUB. Convert to TXT here, paste (or chunk) it into the model's context.",
    troubleshooting: [
      {
        problem: "Chapter order looks scrambled.",
        solution:
          "We extract reading-order content from the EPUB spine. DRM-protected EPUBs can't be read at all (encrypted) — strip DRM with software you're licensed to use first. Non-DRM books extract in spine order.",
      },
    ],
  },
  "epub-to-html": {
    whyConvert:
      "Get an e-book's content as a single browsable HTML file — to read in a browser, host on a site, or repurpose the text — without an e-reader app.",
    example:
      "You want to put a public-domain book online as a simple readable web page. Convert the EPUB to HTML here, host the file, done — no reader app required for visitors.",
    troubleshooting: [
      {
        problem: "Images / fonts missing.",
        solution:
          "EPUB bundles assets internally; on conversion they're extracted as separate files the HTML references. Host them alongside the HTML and the references resolve. DRM-protected EPUBs can't be converted at all.",
      },
    ],
  },

  // ===== Batch 3b: data / config =====
  "csv-to-tsv": {
    whyConvert:
      "TSV (tab-separated) is what many bioinformatics tools, older Unix pipelines, and Excel's clipboard paste expect — and it sidesteps the 'comma inside a field' quoting headaches CSV has. Convert when a downstream tool wants tabs, not commas.",
    example:
      "A genomics tool's importer only reads tab-delimited files. Your data is CSV with quoted fields containing commas. Convert to TSV here — fields with commas no longer need quoting, the tool ingests it cleanly.",
    troubleshooting: [
      {
        problem: "A field contained a tab character and broke columns.",
        solution:
          "TSV has no standard quoting — a literal tab inside a value is ambiguous. We escape/strip embedded tabs. If your data legitimately contains tabs in values, TSV is the wrong target; keep CSV with proper quoting.",
      },
    ],
  },
  "csv-to-yaml": {
    whyConvert:
      "Turn tabular data into YAML for config-driven systems — seeding a config file, generating Kubernetes/Ansible data, or feeding a tool that takes YAML lists of records.",
    example:
      "You maintain feature-flag defaults in a spreadsheet. Your app reads a YAML config. Convert the CSV to a YAML list here, drop it into `config/flags.yaml`.",
    troubleshooting: [
      {
        problem: "Numbers/booleans are quoted strings in the YAML.",
        solution:
          "CSV is typeless — every cell is text. We preserve values as strings to avoid corrupting IDs/ZIPs with leading zeros. If a consumer needs real numbers/bools, coerce the specific keys after load, or post-process the YAML.",
      },
    ],
  },
  "csv-to-jsonl": {
    whyConvert:
      "JSONL (one JSON object per line) is the format for LLM fine-tuning datasets (OpenAI, etc.), streaming data pipelines (BigQuery, ClickHouse load), and log ingestion. Convert a spreadsheet of training examples or records into the line-delimited shape these expect.",
    example:
      "You collected 2,000 prompt/completion pairs in a spreadsheet for fine-tuning. OpenAI's fine-tune API wants JSONL. Convert here — each row becomes one `{...}` line, ready to upload.",
    troubleshooting: [
      {
        problem: "Numbers came through as strings.",
        solution:
          "CSV has no types. We keep values as strings to protect IDs/ZIPs with leading zeros. For fine-tuning that's usually fine (text anyway); if you need typed fields, transform the specific keys in a quick script after conversion.",
      },
    ],
  },
  "ini-to-json": {
    whyConvert:
      "INI is human-friendly config (Windows apps, PHP, Python configparser, Git config style); JSON is what code and tooling consume. Convert when migrating legacy INI config into a modern JSON-based system or reading it programmatically.",
    example:
      "A legacy service is configured via `settings.ini` with `[section]` keys. You're rewriting it in Node and want the config as JSON. Convert here, `require()` / import the JSON.",
    troubleshooting: [
      {
        problem: "Duplicate keys / repeated sections collapsed.",
        solution:
          "JSON objects can't have duplicate keys; INI files that repeat a key within a section lose all but the last. If your INI relies on repeated keys (rare), that data needs a different representation (array) — restructure before converting.",
      },
    ],
  },
  "env-to-json": {
    whyConvert:
      "Turn a `.env` file into JSON for tooling that ingests config as JSON, for inspecting what's set, or for generating typed config objects. Useful in CI/build scripts and config audits.",
    example:
      "Your CI step needs the project's env defaults as a JSON object to merge with secrets. Convert `.env` here, feed the JSON into the build config merge.",
    troubleshooting: [
      {
        problem: "Quotes / multiline values look wrong.",
        solution:
          "dotenv quoting rules vary by loader. We handle the common `KEY=value` and quoted forms; exotic multiline or interpolated `${VAR}` values may need manual fix-up. Never convert a `.env` containing real secrets through any web tool — this runs locally in your browser, but treat secrets carefully regardless.",
      },
    ],
  },
  "html-table-to-csv": {
    whyConvert:
      "Scrape a table off a web page into a spreadsheet without copy-paste mangling it. Save the page (or the table's HTML), convert, and you've got clean CSV for Excel/Sheets/analysis.",
    example:
      "A Wikipedia / stats page has a 200-row table you need in Excel. Copy the table's HTML (or save the page), convert here, open the CSV — rows and columns intact, no manual re-typing.",
    troubleshooting: [
      {
        problem: "Merged cells (rowspan/colspan) misaligned the columns.",
        solution:
          "HTML rowspan/colspan has no clean CSV equivalent — spanned cells are expanded/duplicated heuristically. For tables with heavy merged headers, expect to fix the header rows in the spreadsheet. Simple grid tables convert exactly.",
      },
      {
        problem: "Got multiple tables mashed together.",
        solution:
          "If the HTML had several `<table>` elements we extract them in document order. Isolate just the table you want (copy only that `<table>...</table>`) before converting for a clean single-table CSV.",
      },
    ],
  },

  // ===== Batch 3c: email =====
  "eml-to-pdf": {
    whyConvert:
      "Archive or share an email as a fixed, printable document — for legal/compliance records, expense documentation, or sending a thread to someone without forwarding. PDF preserves the message exactly and opens everywhere.",
    example:
      "Legal asked for 'the confirmation email as a PDF' for a dispute file. You saved it as .eml from Outlook/Apple Mail. Convert here, attach the PDF to the case folder.",
    troubleshooting: [
      {
        problem: "Inline images / HTML styling look off.",
        solution:
          "HTML emails with remote images render those only if reachable; tracking pixels and external CSS may not load (by design — privacy). The text and inline content are preserved. For a pixel-exact capture of a complex HTML email, a print-to-PDF from the mail client is the fallback.",
      },
      {
        problem: "Attachments aren't in the PDF.",
        solution:
          "We render the message body. Attachments inside the .eml aren't flattened into the PDF — extract them separately if needed (eml-to-* or an unzip-style tool).",
      },
    ],
  },
  "eml-to-html": {
    whyConvert:
      "View or embed an email as a standalone web page — for a help-desk knowledge base, a public archive, or just reading an .eml without an email client.",
    example:
      "You exported a support thread as .eml and want it on the internal wiki. Convert to HTML here, paste into the wiki page.",
    troubleshooting: [
      {
        problem: "Remote images don't show.",
        solution:
          "Emails reference remote images that may be gone or blocked. The message structure and text are intact; re-host any critical images and fix the `src` if you need them visible long-term.",
      },
    ],
  },
  "eml-to-mbox": {
    whyConvert:
      "MBOX is the format Thunderbird, Apple Mail import, and many archive tools expect for a mailbox. Convert individual .eml files into MBOX to bulk-import a rescued/exported set of messages into a mail client.",
    example:
      "You recovered 300 individual .eml files from a backup. You want them back in Thunderbird as a folder. Convert to MBOX, then Thunderbird → ImportExportTools NG → import the .mbox.",
    troubleshooting: [
      {
        problem: "The mail client only imported one message.",
        solution:
          "MBOX concatenates messages with `From ` separator lines. If you converted a single .eml you get a one-message MBOX. To combine many, convert/append them into one MBOX (or use a client tool that imports a folder of .eml directly).",
      },
    ],
  },
  "eml-to-csv": {
    whyConvert:
      "Extract email metadata (from, to, subject, date) into a spreadsheet — for e-discovery review, an audit, building a contact list, or analyzing a thread's timeline.",
    example:
      "Compliance wants a spreadsheet of every email in a dispute: sender, recipient, subject, timestamp. Convert the .eml files to CSV here, load into Excel, sort by date for the timeline.",
    troubleshooting: [
      {
        problem: "The body isn't fully in the CSV.",
        solution:
          "CSV is metadata-oriented here; long HTML bodies are truncated/flattened into a cell because spreadsheets choke on huge multiline cells. For full-body review, use eml-to-pdf or eml-to-html per message; CSV is for the metadata index.",
      },
    ],
  },

  // ===== Batch 3d: finance (personal-finance import formats) =====
  "csv-to-ofx": {
    whyConvert:
      "Your bank only gives CSV, but your accounting/budget app (Quicken, GnuCash, older Money, some bookkeeping tools) imports OFX. Convert so the transactions land in your books with proper structure instead of a manual CSV mapping every time.",
    example:
      "Your bank exports CSV only. GnuCash's clean import path is OFX. Convert your statement CSV to OFX here, import into GnuCash — payee/amount/date mapped automatically.",
    troubleshooting: [
      {
        problem: "Dates or amounts imported wrong.",
        solution:
          "OFX expects specific date (YYYYMMDD) and signed-amount conventions. Make sure the source CSV's date column is unambiguous and debits are negative. If your bank's CSV uses a regional date format, normalize it in a spreadsheet before converting.",
      },
      {
        problem: "Duplicate transactions after import.",
        solution:
          "OFX uses FITID to dedupe; a CSV usually has no stable transaction ID, so re-importing overlapping date ranges can double up. Import non-overlapping ranges, or let your finance app's duplicate detection catch them.",
      },
    ],
  },
  "csv-to-qif": {
    whyConvert:
      "QIF is the legacy Quicken import format still accepted by GnuCash, Moneydance, and older Quicken/Money versions. Convert a bank CSV to QIF when your app's QIF path is more reliable than its CSV mapper.",
    example:
      "Moneydance imports QIF cleanly but its CSV importer needs fiddly column mapping each time. Convert the bank CSV to QIF here for a one-click import.",
    troubleshooting: [
      {
        problem: "Account type / categories wrong.",
        solution:
          "QIF is old and loosely specified — the `!Type:` header and category handling vary by app. We emit a standard bank-transaction QIF. Set the target account in your finance app at import time rather than relying on QIF to carry it.",
      },
    ],
  },
  "csv-to-qfx": {
    whyConvert:
      "QFX is Intuit's Quicken-specific OFX variant. Some Quicken versions only accept QFX (not generic OFX). Convert a bank CSV to QFX when Quicken rejects plain OFX.",
    example:
      "Quicken won't take your bank's CSV and rejects generic OFX with a financial-institution error. Convert CSV to QFX here for Quicken's Web Connect import.",
    troubleshooting: [
      {
        problem: "Quicken says the financial institution isn't recognized.",
        solution:
          "QFX embeds Intuit FI identifiers Quicken validates. A converted file uses generic identifiers, so some Quicken versions warn or block. If yours hard-blocks QFX without a real FI ID, csv-to-qif is the more tolerant path for manual imports.",
      },
    ],
  },
  "csv-to-qbo": {
    whyConvert:
      "QBO is the QuickBooks Web Connect import format. When your bank doesn't offer a QuickBooks direct feed and only gives CSV, converting to QBO gets transactions into QuickBooks without manual entry.",
    example:
      "A small-business client's bank has no QuickBooks integration, only CSV downloads. Convert each month's CSV to QBO here, import via QuickBooks → File → Utilities → Import → Web Connect.",
    troubleshooting: [
      {
        problem: "QuickBooks rejects the file or asks to set up the account.",
        solution:
          "QBO validates bank routing/FI identifiers. A converted file uses generic ones, so QuickBooks may prompt you to map it to an existing account the first time — that's expected; choose the right account and subsequent imports remember it.",
      },
    ],
  },

  // ===== Batch 3e: bibliography (extends the proven academic vertical) =====
  "bibtex-to-nbib": {
    whyConvert:
      "NBIB is PubMed's citation format and the import format for several medical/clinical reference workflows. Convert BibTeX to NBIB when collaborating with a PubMed-centric researcher or feeding a tool that ingests PubMed-format records.",
    example:
      "Your lab manages refs in BibTeX but the systematic-review tool the team uses imports NBIB (PubMed) only. Export `.bib`, convert to NBIB here, import into the review tool.",
    troubleshooting: [
      {
        problem: "Some fields didn't map.",
        solution:
          "BibTeX and NBIB have different field vocabularies; core fields (authors, title, journal, year, DOI) map cleanly, BibTeX-specific extras may drop. For pure round-tripping keep the BibTeX as the master copy.",
      },
    ],
  },
  "csv-to-bibtex": {
    whyConvert:
      "You compiled references in a spreadsheet (a lit-review tracker, a shared sheet, a scraped list) and need them in LaTeX. Convert to BibTeX so `\\cite{}` works and your bibliography compiles.",
    example:
      "Co-authors tracked 90 candidate papers in a Google Sheet (title, authors, year, journal, DOI columns). You need them in your LaTeX paper. Convert to BibTeX here, drop into `refs.bib`, cite away.",
    troubleshooting: [
      {
        problem: "Citation keys are awkward / collide.",
        solution:
          "We generate keys from author+year. Collisions get disambiguated, but if you have a key convention (e.g., `smith2024neural`) add a `key`/`citekey` column to the CSV and we'll use it verbatim.",
      },
      {
        problem: "Entry types are all @article.",
        solution:
          "Without a type column we default to @article. Add a `type`/`entrytype` column (book, inproceedings, phdthesis, ...) to the CSV to get correct BibTeX entry types.",
      },
    ],
  },
  "csl-json-to-bibtex": {
    whyConvert:
      "CSL-JSON is Zotero's and Pandoc's native bibliography format; BibTeX is what LaTeX needs. Convert when moving references from a Zotero/Pandoc workflow into a LaTeX manuscript.",
    example:
      "You manage refs in Zotero and export CSL-JSON for a Pandoc workflow, but a journal requires LaTeX submission. Convert the CSL-JSON to BibTeX here for the LaTeX build.",
    troubleshooting: [
      {
        problem: "Some CSL fields aren't in the BibTeX.",
        solution:
          "CSL-JSON has a richer field set than standard BibTeX; unmapped fields are dropped or moved to a note. Core bibliographic data is preserved. If you need lossless round-trips, keep CSL-JSON as the source of truth and regenerate BibTeX as needed.",
      },
    ],
  },

  // ===== Demand batch (added off real Search Console queries) =====
  "bibtex-to-xlsx": {
    whyConvert:
      "CSV opens fine but loses types, mangles long author lists on import, and looks raw. XLSX gives your reference list a real Excel sheet with proper columns, ready to filter and pivot, which is what most people searching \"bibtex to excel\" actually want.",
    example:
      "You are doing a systematic review and the screening template your team uses is an Excel workbook. Export the candidate set as .bib from Zotero, convert here, and paste the rows straight into the screening sheet without an import wizard.",
    troubleshooting: [
      {
        problem: "Excel splits one reference across several rows.",
        solution:
          "That happens when a title or abstract contains line breaks and the file was opened as CSV. This tool writes a real .xlsx, so each reference stays on one row. If you still see splitting, you opened an older CSV export, reconvert to XLSX.",
      },
      {
        problem: '"No references found".',
        solution:
          "The file is probably RIS or EndNote XML renamed to .bib. Open it and confirm it starts with `@article{` or `@book{`. Export specifically as BibTeX from your reference manager.",
      },
    ],
  },
  "ris-to-xlsx": {
    whyConvert:
      "RIS is a tagged text format meant for reference managers, not humans. Converting to XLSX turns it into a sortable sheet with author, title, journal, year, and DOI columns so you can audit a library or hand it to someone who does not use EndNote or Zotero.",
    example:
      "A journal sends you 200 submissions as a single RIS export. You need to assign reviewers in a spreadsheet. Convert to XLSX, add an \"assigned to\" column, and you have a working tracker in two minutes.",
    troubleshooting: [
      {
        problem: "Multiple authors are all in one cell.",
        solution:
          "That is intentional, authors are joined into one field so each reference stays a single row. Split in Excel with Data, Text to Columns on the separator if you need them apart.",
      },
      {
        problem: "Dates look odd in Excel.",
        solution:
          "RIS year and date fields are written as text to avoid Excel reinterpreting partial dates. Format the column as text or a custom date if you want a different display.",
      },
    ],
  },
  "nbib-to-xlsx": {
    whyConvert:
      "PubMed's .nbib export is built for citation managers. If you just want the search results in a spreadsheet to screen titles, dedupe by DOI, or chart publications per year, XLSX is the format that needs zero import steps.",
    example:
      "You run a PubMed query, hit Send to, Citation manager, and get a .nbib file. Convert it here and open the XLSX to sort 300 hits by year and skim titles for a literature review.",
    troubleshooting: [
      {
        problem: "Some records are missing the journal.",
        solution:
          "Older PubMed records sometimes omit the full journal tag and only carry the abbreviation. The abbreviation is what gets written. Re-export from PubMed with the MEDLINE format if you need the full title.",
      },
      {
        problem: '"No references found".',
        solution:
          "The export was likely the summary text format, not .nbib. In PubMed choose Send to, Citation manager (which produces .nbib) and reconvert.",
      },
    ],
  },
  "gedcom-to-xlsx": {
    whyConvert:
      "GEDCOM is a genealogy interchange format no spreadsheet reads natively. Converting to XLSX gives you one row per person with names, dates, places, and family links, so you can sort your tree by birth year, spot gaps, or share it with relatives who only have Excel.",
    example:
      "You exported a 1,200-person tree from Ancestry as .ged and want to find everyone born before 1850 with no death date. Convert to XLSX, filter the birth and death columns, and the gaps are obvious.",
    troubleshooting: [
      {
        problem: "Family relationships look like ID codes.",
        solution:
          "familyAsChild and familyAsSpouse hold GEDCOM family IDs on purpose so you can join people back to households. Sort or filter by those columns to group a family.",
      },
      {
        problem: "Accented or non-Latin names look wrong.",
        solution:
          "Older GEDCOM files use ANSEL or a non-UTF-8 encoding. Re-export as GEDCOM 5.5.1 with UTF-8 from your genealogy software, then reconvert.",
      },
    ],
  },
  "mbox-to-csv": {
    whyConvert:
      "An mbox archive is one giant text blob of concatenated emails. Converting to CSV gives you one row per message with date, from, to, cc, subject, and message-id, which is exactly what you need to index a mailbox, build an e-discovery log, or analyze who emailed whom.",
    example:
      "You exported your Gmail with Google Takeout and got a multi-gigabyte .mbox. You only need a list of who you emailed about an invoice. Convert to CSV, open in a spreadsheet, filter the subject column.",
    troubleshooting: [
      {
        problem: "Bodies are not in the CSV.",
        solution:
          "By design. Message bodies vary wildly in size and would make the spreadsheet unusable. This tool indexes headers. Use mbox-to-eml or mbox-to-pdf if you need the full content.",
      },
      {
        problem: "Fewer rows than expected.",
        solution:
          "Unparseable or truncated messages are skipped rather than failing the whole file. If a large block is missing, the mbox may have been cut mid-message during export, re-export it.",
      },
    ],
  },
  "fen-to-pgn": {
    whyConvert:
      "A FEN is a single frozen position. Engines, databases, and chess GUIs open games as PGN. Converting wraps the position in a standards-compliant PGN with the SetUp and FEN tags so you can load it into Lichess study, ChessBase, or an engine as a starting point for analysis.",
    example:
      "You found a tactics position posted as a FEN string. You want to analyze it on your desktop engine, which only imports PGN. Paste the FEN, convert, and open the .pgn in your GUI ready to play out lines.",
    troubleshooting: [
      {
        problem: "The PGN has no moves.",
        solution:
          "Correct, a FEN is a position, not a game, so the PGN only carries the starting position via the FEN tag. Your engine or GUI will let you play and save moves from there.",
      },
      {
        problem: '"Could not convert" error.',
        solution:
          "The FEN is malformed. It is validated before writing so a broken string fails loudly instead of producing a wrong game. Check the piece-placement field has eight ranks separated by slashes.",
      },
    ],
  },
  "fen-to-png": {
    whyConvert:
      "A FEN string is unreadable to anyone who is not a chess engine. Rendering it to a PNG board image lets you drop the position into notes, a blog post, a forum, or slides without a chess program, and it stays readable to everyone.",
    example:
      "You are writing a tactics article and want a clean diagram of the critical position. Paste the FEN, convert to PNG, and drop the image straight into your document. No screenshots of a chess site needed.",
    troubleshooting: [
      {
        problem: "Pieces look like boxes or are missing.",
        solution:
          "Pieces are drawn with Unicode chess glyphs. The render happens in your browser, so a browser or OS missing a Unicode chess font can show tofu boxes. Modern Chrome, Firefox, Safari, and Edge all include them.",
      },
      {
        problem: "I have many FENs.",
        solution:
          "This route renders the first position in the file. To batch many FENs, drop multiple files and each is rendered to its own PNG, then download them together.",
      },
    ],
  },

  // ===== Contacts / calendar / RTF batch =====
  "vcf-to-csv": {
    whyConvert:
      "A .vcf is fine for a phone but useless for a mail merge, a CRM import, or just cleaning up duplicates. Converting to CSV gives you one row per contact with name, email, phone, and organization columns you can sort, dedupe, and bulk edit in any spreadsheet.",
    example:
      "You exported all 800 contacts from your phone as a single .vcf and need to upload them into a new CRM that only accepts CSV. Convert here, open in Sheets, map the columns, import. No retyping.",
    troubleshooting: [
      {
        problem: "Only one row came out but I had hundreds of contacts.",
        solution:
          "Some phones export each contact as a separate file inside a zip rather than one multi-card .vcf. Unzip first and convert the combined .vcf, or drop all the .vcf files as a batch.",
      },
      {
        problem: "A long note got split or looks cut off.",
        solution:
          "vCard folds long lines across multiple physical lines. We unfold them per the spec before parsing, so the full note is preserved. If a value still looks wrong, the source file may use a non-standard fold; send a sample.",
      },
    ],
  },
  "csv-to-vcf": {
    whyConvert:
      "Phones and address books import .vcf, not spreadsheets. If your contacts live in a CSV (a CRM export, an event signup sheet, a list someone emailed you), converting to vCard is how you get them into iPhone, Android, or Outlook contacts in one import instead of typing each one.",
    example:
      "You collected 120 attendees in a Google Sheet and want them in your phone before the conference. Export the sheet as CSV, convert to .vcf here, AirDrop or email the file to yourself, open it, add all.",
    troubleshooting: [
      {
        problem: "Names or emails are blank in the imported contacts.",
        solution:
          "The converter maps columns by header name (fullName, firstName, lastName, email, phone, organization, title, url, birthday, address, note). Rename your CSV headers to match and reconvert.",
      },
      {
        problem: "Phone numbers lost their plus sign or leading zero.",
        solution:
          "That happens in the spreadsheet, not here: Excel/Sheets strip leading zeros and treat numbers as math. Format the phone column as plain text before exporting the CSV.",
      },
    ],
  },
  "vcf-to-json": {
    whyConvert:
      "If you are scripting against contacts (a sync job, a dedupe tool, an import pipeline) JSON is far easier to work with than raw vCard line folding and escaping. This gives you a clean array of contact objects with predictable keys.",
    example:
      "You are writing a script to merge contacts from three sources. Convert each .vcf export to JSON here, load the arrays, dedupe by email in code instead of parsing vCard by hand.",
    troubleshooting: [
      {
        problem: "I expected nested fields and got flat ones.",
        solution:
          "The output is intentionally flat (one object per contact with string fields) so it maps cleanly to a spreadsheet or a simple import. If you need structured N/ADR components, that is a different shape; ask and we can add a variant.",
      },
      {
        problem: '"No contacts found".',
        solution:
          "The file is probably not vCard. Open it and confirm it has BEGIN:VCARD / END:VCARD blocks. An exported CSV renamed .vcf will not parse.",
      },
    ],
  },
  "ics-to-csv": {
    whyConvert:
      "An .ics file is built for calendar apps, not for analysis. Converting to CSV gives you one row per event with start, end, summary, and location columns so you can total hours, filter by month, or import into a planner or invoicing tool.",
    example:
      "You need to bill a client for every meeting that had their name in the title last quarter. Export your calendar as .ics, convert to CSV, filter the summary column, sum the durations.",
    troubleshooting: [
      {
        problem: "Recurring events only show once.",
        solution:
          "We export each VEVENT as written. Recurrence rules (RRULE) are not expanded into individual instances, that needs a full calendar engine. For billing, export the date range you need from your calendar app so instances are already materialized.",
      },
      {
        problem: "Times look shifted.",
        solution:
          "iCal stores UTC (the trailing Z). We keep the stored value rather than guessing your timezone. If you need local time, offset in the spreadsheet or export from your calendar in local time.",
      },
    ],
  },
  "csv-to-ics": {
    whyConvert:
      "Bulk-creating calendar events by hand is painful. If your events are in a spreadsheet (a class schedule, a content calendar, a shift roster), converting to .ics lets you import them all into Google Calendar, Apple Calendar, or Outlook in one go.",
    example:
      "You have a 40-row content calendar in Sheets. Add summary, start, and end columns, export CSV, convert to .ics here, import into Google Calendar. Forty events created in one step.",
    troubleshooting: [
      {
        problem: '"CSV needs a summary or start column".',
        solution:
          "The converter needs at least a 'summary' or 'start' header to build events. Match the headers: summary, start, end, location, description, allDay. Dates as YYYY-MM-DD HH:MM:SS or YYYY-MM-DD.",
      },
      {
        problem: "All-day events show a time.",
        solution:
          "Set the allDay column to true and use a date-only start (YYYY-MM-DD). The converter then writes a DATE-valued event the calendar treats as all-day.",
      },
    ],
  },
  "ics-to-json": {
    whyConvert:
      "For any code that consumes calendar data (a dashboard, a sync script, an availability checker) JSON beats parsing iCalendar's folding and escaping yourself. You get a clean array of event objects.",
    example:
      "You are building an internal page that shows the team's upcoming events. Convert the shared .ics to JSON here, fetch it, render. No iCal parser dependency.",
    troubleshooting: [
      {
        problem: "Dates are strings, not Date objects.",
        solution:
          "JSON has no date type, so dates are normalized strings (YYYY-MM-DD HH:MM:SS). Parse them in your code with whatever timezone handling you need.",
      },
      {
        problem: '"No events found".',
        solution:
          "The file has no VEVENT blocks (it may be a to-do or free/busy file, or not iCalendar at all). Confirm it contains BEGIN:VEVENT.",
      },
    ],
  },
  "rtf-to-txt": {
    whyConvert:
      "RTF is a markup stream wrapped around your text. When you just need the words (to paste somewhere plain, to feed a script, to diff two versions) converting to TXT strips all the control codes and gives you the readable content.",
    example:
      "A government form arrived as .rtf and you need to paste its text into a web form that mangles rich text. Convert to TXT here, copy the clean text, paste.",
    troubleshooting: [
      {
        problem: "Formatting (bold, tables) is gone.",
        solution:
          "That is the point of TXT: it is plain text only. If you need to keep layout, use rtf-to-html instead, which preserves paragraph structure.",
      },
      {
        problem: "Some special characters look wrong.",
        solution:
          "We decode the common RTF escapes (\\'hh hex and \\uN unicode). A rare code page or an exotic escape can still slip through; send a sample and we will extend the decoder.",
      },
    ],
  },
  "rtf-to-html": {
    whyConvert:
      "If you want RTF content on a web page or in an email, HTML is the target, not RTF (browsers and mail clients do not render .rtf). This pulls the text into clean paragraph markup you can drop into a CMS or template.",
    example:
      "You are migrating old .rtf knowledge-base articles into a web CMS. Convert each to HTML here, paste the body into the editor, done, no manual reformatting.",
    troubleshooting: [
      {
        problem: "I lost fonts and colors.",
        solution:
          "This extracts structure and text, not visual styling. Font and color tables are intentionally dropped because inline RTF styling rarely maps cleanly to a site's own CSS. Style it with the destination's stylesheet.",
      },
      {
        problem: "Everything is one big paragraph.",
        solution:
          "The source RTF may use line breaks instead of real paragraph breaks (\\par). We split on paragraph breaks; if the original has none, there is no structure to recover. Check the source in an RTF editor.",
      },
    ],
  },

  // ===== Tier 1 audio batch (FFmpeg.wasm) =====
  "aac-to-mp3": {
    whyConvert:
      "Plenty of older car stereos, basic media players, and corporate audio systems still refuse AAC. MP3 is the universally compatible format, so converting once means the file plays everywhere without re-fighting codec support every time.",
    example:
      "You exported a podcast episode as .aac and your editing client opens it fine but the guest's car infotainment will not. Convert to MP3, email it back, problem solved.",
    troubleshooting: [
      {
        problem: "Output sounds slightly different from the source.",
        solution:
          "Re-encoding lossy audio twice (AAC then MP3) always loses a little quality. The default VBR ~190kbps is transparent for speech and most music. If you need pristine fidelity, keep the original AAC.",
      },
    ],
  },
  "opus-to-mp3": {
    whyConvert:
      "Opus is the format WhatsApp voice notes, Discord recordings, and most browser-captured audio use. It is excellent technically but still does not play in QuickTime, older Windows Media Player, in-car systems, or many podcast tools. MP3 fixes that.",
    example:
      "You exported a WhatsApp voice note (.opus) and need to send it to a transcription service that only accepts MP3. Convert here, upload, done.",
    troubleshooting: [
      {
        problem: "File is silent or extremely short after conversion.",
        solution:
          "Opus voice notes are often very low bitrate. If the source is corrupt or truncated the MP3 will be too. Re-export from the original app if possible.",
      },
    ],
  },
  "wma-to-mp3": {
    whyConvert:
      "Windows Media Audio shows up in old Windows Movie Maker exports, legacy voice recordings, and 2000s-era podcast archives. Almost nothing outside the Microsoft ecosystem plays it any more, so MP3 is the migration target.",
    example:
      "You inherited a folder of family videos with .wma narration tracks from a Windows XP era. Convert each to MP3 so they import cleanly into your modern editor.",
    troubleshooting: [
      {
        problem: "WMA with DRM fails to convert.",
        solution:
          "DRM-protected WMA (from Zune Marketplace and old subscription services) cannot be decoded. The file has to be DRM-free first, which is outside what this tool can do.",
      },
    ],
  },
  "aiff-to-mp3": {
    whyConvert:
      "AIFF is Apple's uncompressed audio: huge files coming out of Logic, GarageBand, Pro Tools sessions, or CD rips on a Mac. MP3 at VBR ~190kbps cuts size roughly 10x with no perceptible quality loss, which is what you want for sharing or upload.",
    example:
      "Your friend airdropped you a 60 MB AIFF mix. Convert to MP3 here, it becomes ~6 MB, fits in any email or messaging app.",
    troubleshooting: [
      {
        problem: "Multichannel AIFF gets downmixed.",
        solution:
          "MP3 supports stereo cleanly but is awkward with 5.1 or higher. The default re-encode preserves stereo. For surround masters, keep the AIFF or convert to a format that supports the channel count.",
      },
    ],
  },
  "amr-to-mp3": {
    whyConvert:
      "AMR is the narrowband telephony codec older Android phones and most basic voice-recorder apps use. It is fine for voice but barely anything else plays it. MP3 is the format you actually want for editing, sharing, or pasting into a transcription tool.",
    example:
      "You recorded a meeting with the stock Android Sound Recorder and it saved as .amr. Convert to MP3 here, drop into your transcription service of choice.",
    troubleshooting: [
      {
        problem: "Output sounds tinny.",
        solution:
          "AMR is narrowband (sampled around 8 kHz) so the source is already low fidelity. MP3 cannot recover detail that was never there. The conversion preserves what is in the source, no more.",
      },
    ],
  },
  "mp3-to-aac": {
    whyConvert:
      "AAC is the codec Apple devices, modern web players, and HLS or DASH streaming pipelines prefer. At a given perceived quality the file is smaller than MP3, which matters when you are targeting iOS or piping into a video workflow.",
    example:
      "You are building an HLS stream and your encoder wants AAC audio. Convert your MP3 master to AAC at 192 kbps here, then mux into the video pipeline.",
    troubleshooting: [
      {
        problem: "Is this lossless?",
        solution:
          "No. MP3 to AAC is two lossy codecs in a row, so there is a small quality cost. If you have the original uncompressed source (WAV, AIFF, FLAC), encode AAC directly from that for the best result.",
      },
    ],
  },
  "mp3-to-m4r": {
    whyConvert:
      "iPhones recognise .m4r as a ringtone, but only if the audio is AAC inside a properly muxed iPod-compatible MP4 container and is no longer than ~40 seconds. Renaming an .mp3 to .m4r does not work. This converter does the whole transform correctly.",
    example:
      "You want the chorus of a song as your ringtone. Trim the MP3 to 40 seconds or less in any audio tool, convert here, AirDrop the .m4r to your iPhone, set it as your ringtone in Settings.",
    troubleshooting: [
      {
        problem: "iPhone refuses the file as a ringtone.",
        solution:
          "iOS requires the file under 40 seconds. The converter caps duration at 40s automatically. If your iPhone still refuses, you may need to use the Files app (not iTunes/Finder transfer) and explicitly add it under Settings, Sounds & Haptics.",
      },
    ],
  },

  // ===== Tier 1 data batch (2026-05-27) =====
  "vcf-to-xlsx": {
    whyConvert:
      "CSV is the technical answer, XLSX is the answer non-technical people actually want. Same one-row-per-contact shape with proper Excel columns, opens in one click in Excel, Google Sheets, or Numbers, no import wizard, no encoding choices.",
    example:
      "You exported 400 contacts from your phone as a .vcf for a sales handoff. The new rep uses Excel, not a CRM. Convert here, send the .xlsx, they sort and filter immediately.",
    troubleshooting: [
      {
        problem: "Phone numbers come in as 'number' format and lose a leading plus.",
        solution:
          "Excel is overzealous about typing phone columns. Select the phone column, right-click, Format Cells, choose Text, then re-paste from the .xlsx or re-convert. The data we write is plain text; Excel re-interprets on open.",
      },
      {
        problem: "Some contacts are missing from the output.",
        solution:
          "We drop entries that fail to parse as valid vCards (no BEGIN:VCARD line, no FN, etc.). If your source is multiple .vcf files concatenated by hand, ensure each ends with END:VCARD before the next BEGIN:VCARD.",
      },
    ],
  },
  "ics-to-xlsx": {
    whyConvert:
      "Calendar apps render .ics natively, but billing tools, attendance trackers, and analytics templates speak Excel. Get every event with start, end, location, and summary as columns you can pivot, filter, and total.",
    example:
      "You billed by the meeting for last quarter. Export the project calendar as .ics, convert to XLSX, sum the duration column, send the invoice with line-by-line backup.",
    troubleshooting: [
      {
        problem: "All-day events show a date but the timed column 'allDay' says true.",
        solution:
          "That is intentional: iCal DATE-valued events have no time component, so the start cell carries just the date and allDay flags it. Filter on allDay to separate the two event kinds.",
      },
      {
        problem: "Recurring events appear only once.",
        solution:
          "We export each VEVENT as it appears in the file. Recurrence rules are not expanded. For billing, export the date range from your calendar app so instances are already materialised.",
      },
    ],
  },
  "xml-to-csv": {
    whyConvert:
      "Spreadsheets cannot open XML directly without a custom map. For the common 'list of records' shape (orders, products, transactions, RSS items) this converter finds the repeating element, treats each one as a row, and flattens scalar children plus attributes into columns. No XSLT needed.",
    example:
      "A vendor sends nightly product data as XML with <products><product>...</product></products>. You want to diff it against last week in a spreadsheet. Convert each night's file and use Excel's compare tools.",
    troubleshooting: [
      {
        problem: '"Could not find a repeating element" error.',
        solution:
          "The XML has only one record (or no list at all). CSV needs a list of similar records, so the converter looks for the first set of repeated sibling elements. If your XML is deeply nested with a single object, pre-shape it to a flat list with an XSLT or extract the inner array.",
      },
      {
        problem: "Nested objects appear as JSON strings in a cell.",
        solution:
          "Intentional. Truly nested data does not flatten cleanly to one row, so we JSON-stringify into a single cell to keep the row count honest. Open in Excel and parse with a formula if you need to split.",
      },
    ],
  },
  "csv-to-html": {
    whyConvert:
      "If you need to publish a small table on a webpage, in a CMS, or inside an email, HTML is the right format. Renders as a real styled table you can drop straight into a page or a rich-text editor, with HTML entities in cell values properly escaped so you cannot accidentally inject markup.",
    example:
      "You have a 30-row CSV pricing table and the marketing CMS only takes pasted HTML. Convert, copy the <table>...</table> from the output, paste into the CMS, done.",
    troubleshooting: [
      {
        problem: "The styling does not match my site.",
        solution:
          "The output ships with minimal CSS for standalone viewing. To match your site, delete the <style> block from the head and your site's CSS will style the table.",
      },
      {
        problem: "Special characters render literally (&lt; instead of <).",
        solution:
          "That is correct escaping. If your source CSV intentionally contains HTML you want rendered, you wanted a different tool, this one treats every cell as text.",
      },
    ],
  },

  // ===== Tier 1 video batch (2026-05-27) =====
  "m4v-to-mp4": {
    whyConvert:
      "M4V is Apple's MP4 variant from iTunes Store and old iOS recordings. The container is byte-compatible with MP4, but plenty of non-Apple editors and upload pipelines reject the extension on sight. Re-mux without re-encoding so it stays fast and lossless.",
    example:
      "You have a .m4v screen recording from an iPhone and your editor refuses it. Convert to .mp4 here, drop into the editor, no quality loss.",
    troubleshooting: [
      {
        problem: "Is this a re-encode?",
        solution:
          "No. We stream-copy the audio + video tracks into an MP4 container. The bytes inside are identical, only the wrapper changes. Conversion is fast and lossless.",
      },
    ],
  },
  "3gp-to-mp4": {
    whyConvert:
      "3GP is the mobile-video container older phones recorded to. Modern editors and uploaders prefer MP4. Re-encoded to H.264 + AAC at a transparent quality so the result plays on anything.",
    example:
      "You found an old .3gp clip from a 2007 phone and need to send it to someone who only has VLC or Premiere. Convert to MP4 first.",
    troubleshooting: [
      {
        problem: "Audio comes out quieter than the source.",
        solution:
          "AMR-NB audio inside 3GP is mono and low-bandwidth; the AAC re-encode preserves the level but the new container handles dynamics differently in some players. Normalize in your editor if needed.",
      },
    ],
  },
  "flv-to-mp4": {
    whyConvert:
      "FLV is the old Flash Video container. Browsers no longer play Flash, but the H.264 video inside legacy FLV files is fine once re-wrapped or re-encoded into an MP4. Old tutorials, screencasts, archived livestreams all live in FLV.",
    example:
      "You have a 2012 lecture recording in .flv and need to embed it in a modern LMS that only accepts MP4. Convert here, upload, embed.",
    troubleshooting: [
      {
        problem: "Output is bigger than the source FLV.",
        solution:
          "FLV often used VP6 or low-bitrate H.264; re-encoding to MP4 H.264 at standard quality can push file size up. Tune the quality flags in a dedicated editor if you need tight size control.",
      },
    ],
  },
  "wmv-to-mp4": {
    whyConvert:
      "WMV is Windows Media Video, the Microsoft container that defined Windows Movie Maker exports. Nothing outside the Microsoft ecosystem plays it cleanly any more. Re-encode to H.264 + AAC in an MP4 wrapper for universal playback.",
    example:
      "You inherited a folder of family videos in .wmv from a Windows XP era and want them on your phone or modern editor. Convert each to MP4.",
    troubleshooting: [
      {
        problem: "DRM-protected WMV fails.",
        solution:
          "Some WMV files from old subscription services (Zune Marketplace, PlaysForSure) were DRM-locked. Those cannot be decoded by anyone other than the original DRM authority. The file must be unprotected first.",
      },
    ],
  },
  "mts-to-mp4": {
    whyConvert:
      "MTS (and M2TS) is the AVCHD container Sony / Panasonic / Canon camcorders write to SD cards. Non-linear editors handle it but upload sites and most players prefer MP4. Re-encode to H.264 + AAC.",
    example:
      "You shot vacation footage on a camcorder; the SD card has .mts files. Convert each to .mp4 to upload to YouTube or send via cloud.",
    troubleshooting: [
      {
        problem: "Long files take a while.",
        solution:
          "MTS files from cameras are often quite long (single-take sessions). Re-encoding is CPU-bound. You can split first with a video editor and convert each part separately if needed.",
      },
    ],
  },
  "mp4-to-webm": {
    whyConvert:
      "WebM (VP9 + Opus) is the open codec target the modern web prefers. Smaller files than equivalent H.264 MP4 for background autoplay videos, no patent worries, native Chrome / Firefox playback. The right format if you are publishing web video.",
    example:
      "You want a hero background video on your landing page. MP4 is 8 MB; the WebM equivalent at the same perceived quality lands around 3 MB. Convert here, ship the WebM.",
    troubleshooting: [
      {
        problem: "Safari does not play the result on older iOS.",
        solution:
          "Safari only added VP9 / Opus in WebM support in iOS 14.5 (April 2021) and macOS Big Sur. For older Safari, serve MP4 as a fallback inside the same <video> tag.",
      },
    ],
  },
  "mov-to-gif": {
    whyConvert:
      "Apple screen recordings save as .mov. Turning them into GIFs is the standard 'demo loop for a README, tweet, or Slack' workflow. Uses FFmpeg's split + palettegen + paletteuse filter chain in one pass, which gives visibly cleaner colors than naive single-pass quantization.",
    example:
      "You recorded a 6-second app demo with Cmd+Shift+5 on Mac, saved as .mov. Convert here, paste the GIF into a Slack thread or a GitHub issue.",
    troubleshooting: [
      {
        problem: "The output GIF is huge.",
        solution:
          "GIF is an inefficient format for video; even with palette optimisation, multi-second recordings can easily hit MB-size. We cap framerate at 10fps to keep things sane. For smaller demos, consider WebM or MP4 instead and host on a service that supports embedded video.",
      },
    ],
  },

  // ===== Exotic batch 1: PSD + MSG (2026-05-27) =====
  "psd-to-png": {
    whyConvert:
      "Need to share a Photoshop comp with someone who does not have Photoshop, or post it on the web. PNG is the lossless raster format every browser, CMS, and design tool reads, and unlike JPG it keeps the transparency from your PSD intact.",
    example:
      "A client asks you to send the latest design comp by email. You have it as a 40 MB .psd. Convert to PNG, the client opens it in any browser or Preview, no Adobe license needed.",
    troubleshooting: [
      {
        problem: '"PSD has no composite image" error.',
        solution:
          "Photoshop only writes the flattened composite if 'Maximize Compatibility' is enabled at save time. Open the PSD in Photoshop, Save As, ensure that checkbox is on, then reconvert. Without it the PSD is layer-only and there is no rendered preview to extract.",
      },
      {
        problem: "Transparent areas come out black.",
        solution:
          "That happens with PNG only when the source layer had black with zero alpha; the alpha channel should still be correct. If you wanted a solid background, use psd-to-jpg, which flattens onto white.",
      },
    ],
  },
  "psd-to-jpg": {
    whyConvert:
      "JPG is the smallest, most-compatible raster format for sharing a Photoshop design when transparency does not matter. Email attachments, image galleries, social previews all want JPG. We flatten onto a white background since JPEG has no alpha channel.",
    example:
      "You have a finished poster as a .psd and want to upload a preview to a print-on-demand site that only accepts JPG. Convert and upload.",
    troubleshooting: [
      {
        problem: "The output looks slightly less crisp than the PSD preview in Photoshop.",
        solution:
          "JPG is lossy by definition. We use quality 0.92 which is visually transparent in most cases; if you need sharper text or fine detail, use psd-to-png instead.",
      },
      {
        problem: "Why is the background white, not transparent?",
        solution:
          "JPEG does not support an alpha channel. Any transparent pixel has to flatten onto a solid color, and white is the safe default. Use psd-to-png if you need transparency preserved.",
      },
    ],
  },
  "msg-to-eml": {
    whyConvert:
      "Outlook saves emails as .msg, a proprietary Microsoft compound-document format only Outlook reads cleanly. EML is the RFC 5322 standard every other mail client (Apple Mail, Thunderbird, Gmail import, Mac Mail) accepts. This is how you escape Outlook lock-in.",
    example:
      "You are migrating away from Outlook to Apple Mail or Thunderbird and need to keep important threads. Convert each .msg to .eml here, drag the result into your new client's inbox.",
    troubleshooting: [
      {
        problem: "Attachments are not in the EML.",
        solution:
          "By design in v1. The original attachment filenames are surfaced in an X-Original-Attachments header so nothing is silently lost. Full multipart MIME packaging of binary attachments is a separate route. For now extract attachments inside Outlook before converting if you need them transferred.",
      },
      {
        problem: '"MSG had no readable subject, sender, or body" error.',
        solution:
          "The .msg may be a calendar invitation or a task rather than an email, both of which use a different property layout. msg-to-eml currently targets email messages only.",
      },
    ],
  },
  "msg-to-csv": {
    whyConvert:
      "If you are processing a folder of Outlook messages for e-discovery, archival indexing, or just to log who emailed whom, CSV is the format any spreadsheet or analysis tool reads. Same column shape as mbox-to-csv so multi-file workflows stay consistent.",
    example:
      "You exported 500 .msg files from an Outlook PST and need a single index spreadsheet. Convert each, concatenate the CSV rows, open in Excel, filter and sort.",
    troubleshooting: [
      {
        problem: "Output is just one row.",
        solution:
          "Each .msg is one email and the converter emits one row per file. For a batch of .msg files, drop them all at once and the tool zips up per-file CSVs; concatenate in your spreadsheet.",
      },
    ],
  },
  "msg-to-pdf": {
    whyConvert:
      "For archiving or legal disclosure you often need an email as a single, fixed-layout PDF rather than a re-editable .msg. Renders the Outlook headers (From/To/Subject/Date) and body cleanly, attachments listed by filename.",
    example:
      "A discovery request asks for a specific Outlook thread as PDF. Drop the .msg, convert, hand over the PDF.",
    troubleshooting: [
      {
        problem: "Inline images do not appear.",
        solution:
          "We render the text body and headers, not embedded image attachments. If you need the visual fidelity of inline images, open the .msg in Outlook and use Print, Save as PDF instead.",
      },
    ],
  },

  // ===== Exotic batch 2 (2026-05-27): MPEG video =====
  "mpg-to-mp4": {
    whyConvert:
      "MPG is the classic MPEG-1 / MPEG-2 program stream container, the format old digital cameras, capture cards, and 1990s/2000s DVD rips wrote to. Modern editors, phones, and browsers want MP4. Re-encode to H.264 + AAC so it plays everywhere without a legacy codec pack.",
    example:
      "You have a folder of family camcorder clips from 2003 saved as .mpg and want them on your phone. Convert each to MP4, AirDrop or sync to the phone.",
    troubleshooting: [
      {
        problem: "Aspect ratio looks squashed in the output.",
        solution:
          "Older MPG often used non-square pixels (anamorphic 16:9 inside a 4:3 frame). FFmpeg preserves the input's pixel aspect ratio; if your player ignores PAR, re-encode in a desktop editor and set the display ratio explicitly.",
      },
    ],
  },
  "mpeg-to-mp4": {
    whyConvert:
      "The .mpeg extension is the same container as .mpg; people just write the filename differently. Same re-encode path: H.264 video + AAC audio in an MP4 wrapper, universal playback, no legacy codecs.",
    example:
      "A capture card saved a clip as .mpeg and your editor rejects the extension. Convert to MP4 and the editor accepts it immediately.",
    troubleshooting: [
      {
        problem: "Is this different from mpg-to-mp4?",
        solution:
          "Only the file extension. The container, the FFmpeg path, and the output are identical. We ship both routes so the file picker and the search-result page match what you actually have.",
      },
    ],
  },
  "vob-to-mp4": {
    whyConvert:
      "VOB is the MPEG-2 program stream variant used on DVDs. Home-video rips and old DVDR backups are full of .vob files; modern players, phones, and editors want MP4. Re-encode to H.264 + AAC keeps the content and drops the legacy DVD container.",
    example:
      "You have a folder of .vob files from a backed-up family DVD and need them as MP4 to upload to a cloud video archive. Convert each, upload.",
    troubleshooting: [
      {
        problem: "FFmpeg failed on a commercial-DVD .vob.",
        solution:
          "Commercial DVDs are CSS-encrypted. This converter cannot decrypt them; you need to decrypt the DVD with a dedicated tool (HandBrake, MakeMKV) first, then convert the resulting .vob or directly export to MP4.",
      },
    ],
  },

  // ===== Industry batch (2026-05-27): LRC lyrics + DICOM extensions =====
  "lrc-to-srt": {
    whyConvert:
      "LRC is the karaoke / lyric-display format; SRT is the universal subtitle format every video editor, YouTube uploader, and offline player accepts. Convert when you want a lyric track in a video editor, baked into an upload as a caption track, or shared with collaborators using SRT.",
    example:
      "You have an .lrc file from a karaoke library and want to burn the lyrics into a music video in Premiere or DaVinci Resolve. Convert to .srt, drop into the editor's caption track, ship.",
    troubleshooting: [
      {
        problem: "Repeated chorus shows up only once.",
        solution:
          "It should not. We expand multi-timestamp lines (like `[00:30.00][01:00.00]Refrain`) into one cue per timestamp. If you see only one, your LRC may have the chorus on separate lines with single timestamps each, which is also handled, just check the source.",
      },
      {
        problem: "Cue end times look long.",
        solution:
          "LRC only marks the START of each line. We set the end to the next line's start (or +4s for the final line) so SRT players have something to display until the next lyric. Edit the .srt in any text editor if you want tighter end times.",
      },
    ],
  },
  "lrc-to-vtt": {
    whyConvert:
      "WebVTT is the captioning format browsers read via the HTML5 <track> element. If you are building a music site or hosting a music video on your own page, lyrics as VTT plug directly into the <video> element with no extra player code.",
    example:
      "You are publishing a song on your artist site and want synchronised lyrics as a toggle in the player. Convert the LRC to VTT, point the <track> element at the file, browsers handle the rest.",
    troubleshooting: [
      {
        problem: "Lyrics do not show in my player.",
        solution:
          "Most browsers require the <track> element to have kind=\"captions\" or kind=\"subtitles\" plus the file served from the same origin (or with CORS headers). Check the network tab; the VTT should load with text/vtt MIME.",
      },
    ],
  },
  "srt-to-lrc": {
    whyConvert:
      "Reverse direction: if you already have subtitles for a music video as SRT and want to publish them as a karaoke-style LRC file (for use in Spotify lyric apps, karaoke players, or lyric databases), convert here. SRT end times are dropped (LRC only marks the start of each line) and multi-line cues are joined into one LRC line per timestamp.",
    example:
      "You captioned a music video in SRT for YouTube and now want to contribute the lyrics to a karaoke library that expects LRC. Convert and submit.",
    troubleshooting: [
      {
        problem: "Multi-line SRT cues come out as one long LRC line.",
        solution:
          "Intentional. LRC is a one-line-per-timestamp format. If you need to split a long line for display, edit the .lrc in any text editor and add a second timestamp for the wrap point.",
      },
    ],
  },
  "dicom-to-jpg": {
    whyConvert:
      "DICOM is the medical-imaging standard but no email client, social platform, or generic image viewer renders it. JPG is the universally-shareable raster format. Conversion runs entirely in your browser, so patient data never leaves the device, important for HIPAA-bound workflows.",
    example:
      "A patient wants a copy of their MRI scan to email to a second-opinion clinician. The portal gave them a .dcm file. Convert here to JPG, attach to email, done.",
    troubleshooting: [
      {
        problem: "Image looks too dark or too bright.",
        solution:
          "DICOM uses 12 to 16-bit grayscale with explicit window/level metadata. We use the metadata if present, otherwise auto-compute. If the result looks off, the source file may be missing the window/level tags; in that case open it in a real DICOM viewer to find the intended values.",
      },
      {
        problem: "Only one image came out of a multi-frame study.",
        solution:
          "We render the first frame for now. Multi-frame DICOMs (CT slices, time-series MR) need a sequence export which is a different shape. If you need every frame, use a desktop DICOM tool.",
      },
    ],
  },
  "dicom-to-pdf": {
    whyConvert:
      "For patient handouts, clinical reports, or archival packets you often want the DICOM as a single PDF page rather than a raw image. PDFs print correctly at any DPI, embed cleanly in EHR uploads, and email/storage systems trust them. Same in-browser HIPAA story as the other DICOM tools.",
    example:
      "You are assembling a referral packet that needs to include the chest X-ray as a printable PDF. Drop the .dcm, get a single-page PDF, attach to the referral letter.",
    troubleshooting: [
      {
        problem: "The image fills the page; can I add patient metadata as a header?",
        solution:
          "Not in v1, the PDF is image-only. If you need patient identifiers on the page, open the .dcm in your imaging viewer and use its built-in 'print with labels' export. A future route may add a sidecar metadata page.",
      },
    ],
  },

  // ===== Music sheet rendering batch (2026-05-28) =====
  "musicxml-to-svg": {
    whyConvert:
      "MusicXML is the universal interchange format every notation editor reads (Sibelius, Finale, MuseScore, Dorico). To embed the engraved sheet music on a webpage, in a blog post, or inside a presentation, you want SVG, the vector format that scales cleanly at any zoom. Rendered with Verovio, the same engraver IMSLP uses.",
    example:
      "You write an arrangement in MuseScore, export the .musicxml, and want to put the sheet music on your composer website. Convert here, drop the SVG into your CMS, it scales perfectly on retina screens with no rasterisation.",
    troubleshooting: [
      {
        problem: "Some symbols are missing or misaligned compared to MuseScore.",
        solution:
          "Verovio targets the SMuFL standard and engraves to a slightly different aesthetic than commercial notation editors. Cross-staff beams, complex articulations, and lyrics with specific font choices may render differently. For one-to-one fidelity to Finale or Sibelius output, export PDF from there instead.",
      },
      {
        problem: '"Verovio failed to load the MusicXML" error.',
        solution:
          "The file may use MusicXML 4.0 features Verovio does not support, or contain XML errors. Open in MuseScore (free), re-save as MusicXML 3.1, then reconvert.",
      },
    ],
  },
  "musicxml-to-pdf": {
    whyConvert:
      "PDF is what you print, hand to a musician, or distribute to an ensemble. Renders the MusicXML through Verovio to engraved SVG, then rasterises into a PDF page sized to fit a sheet of paper. Same in-browser story, no upload, no signup.",
    example:
      "You arranged a piece for a brass quintet and need to hand each player a printable part. Convert each part's MusicXML to PDF here, print, distribute.",
    troubleshooting: [
      {
        problem: "Print quality is fuzzy.",
        solution:
          "We rasterise the SVG to PNG at Verovio's native page size before embedding in the PDF. For sharper output at larger paper sizes, use musicxml-to-svg and convert to PDF in a tool that can preserve vector data (Inkscape: File, Save As, PDF).",
      },
    ],
  },
  "mxl-to-svg": {
    whyConvert:
      "MXL is the compressed MusicXML format most notation editors actually export (smaller files, single download). Same Verovio engraving as musicxml-to-svg, just with the unzip step inlined so you do not have to manually extract before converting.",
    example:
      "MuseScore exported your arrangement as .mxl, not .musicxml. Drop the .mxl directly, get the engraved SVG, no manual unzip step.",
    troubleshooting: [
      {
        problem: '"no inner MusicXML file found".',
        solution:
          "The .mxl container is missing or hiding the inner score file. Open in MuseScore and re-save (or save as uncompressed .musicxml and use musicxml-to-svg instead).",
      },
    ],
  },
  "wkt-to-geojson": {
    whyConvert:
      "WKT (Well-Known Text) is the OGC standard text encoding for geometry, used by PostGIS, Oracle Spatial, SQL Server, and GeoPandas. GeoJSON is what every web map (Leaflet, Mapbox, OpenLayers) actually consumes. This converts one to the other so you can take a literal pulled from a database column and plot it on a map.",
    example:
      "You copied a POLYGON((...)) literal out of a PostGIS query and want to verify it visually. Paste it into a .wkt file, convert here, drop the resulting GeoJSON into geojson.io or your Leaflet build.",
    troubleshooting: [
      {
        problem: '"Could not parse the input as WKT" error.',
        solution:
          "WKT must start with a geometry type keyword (POINT, LINESTRING, POLYGON, MULTIPOINT, MULTILINESTRING, MULTIPOLYGON, GEOMETRYCOLLECTION). EWKT prefixes like SRID=4326; are not part of WKT proper, strip them first.",
      },
    ],
  },
  "geojson-to-wkt": {
    whyConvert:
      "Every spatial database (PostGIS, Oracle Spatial, SQL Server, SQLite/SpatiaLite) takes WKT in its INSERT and UPDATE statements. If your data is GeoJSON (the format Mapbox, Leaflet, and most web APIs emit), you need to convert it to WKT before loading. Output is one WKT literal per line so you can paste it straight into a SQL editor or feed it into a script.",
    example:
      "You exported features from QGIS as GeoJSON and want to bulk-insert them into a PostGIS table. Convert here, then use the WKT in INSERT INTO geom_table (geom) VALUES (ST_GeomFromText('...')).",
    troubleshooting: [
      {
        problem: "Output is empty.",
        solution:
          "The input may be a FeatureCollection with no geometries (every Feature has geometry: null). Check the GeoJSON in a text editor and confirm the geometry objects are populated.",
      },
    ],
  },
  "wkb-to-geojson": {
    whyConvert:
      "WKB (Well-Known Binary) is what PostGIS stores internally and what ST_AsBinary emits. When you SELECT a geometry column raw from psql, you get a hex string. This converter accepts either the raw binary file or the hex string and outputs GeoJSON you can plot on any web map.",
    example:
      "You ran SELECT ST_AsBinary(geom) FROM parcels LIMIT 1 in psql and got back a hex string. Save it to a file, drop it here, get back the parcel polygon as GeoJSON.",
    troubleshooting: [
      {
        problem: '"Could not parse WKB" on a hex string.',
        solution:
          "PostGIS columns sometimes emit EWKB (extended WKB) with an SRID prefix. The first 4 bytes will look like 0x20000000 instead of 0x01. wkx auto-detects EWKB; if it still fails, the byte stream may be truncated, re-export from psql with proper escaping.",
      },
    ],
  },
  "geojson-to-wkb": {
    whyConvert:
      "WKB is the compact binary encoding spatial databases use natively. If you want to bulk-load geometries into PostGIS via COPY (the fast path), you need WKB hex strings, not text WKT. This converts GeoJSON to raw binary WKB; pipe the output through xxd if you want hex.",
    example:
      "You have a parcels.geojson and want to populate a PostGIS table at maximum speed. Convert to WKB and use COPY parcels (geom) FROM stdin (FORMAT binary).",
    troubleshooting: [
      {
        problem: "Output is one geometry but my input had hundreds.",
        solution:
          "WKB is a single-geometry encoding. For batch loads, iterate the input FeatureCollection in your script and convert each geometry separately, or use the WKT export and ST_GeomFromText.",
      },
    ],
  },
  "msgpack-to-json": {
    whyConvert:
      "MessagePack is the compact binary JSON used by Redis pipelines, the Aerospike client, lots of game-server protocols, and OpenAPI's binary preset. To inspect or edit a captured payload you need plain JSON; this decodes it. Binary blobs inside the document are emitted as base64 strings (matching msgpack-cli's convention).",
    example:
      "You captured a redis-cli MSGPACK frame on the wire and want to inspect the user state it carries. Save the bytes, drop here, get pretty JSON.",
    troubleshooting: [
      {
        problem: '"Could not decode MessagePack" error.',
        solution:
          "The byte stream may be truncated or be a sequence of multiple MessagePack messages concatenated. This converter expects a single root document. For streams, split them in your script first.",
      },
    ],
  },
  "json-to-msgpack": {
    whyConvert:
      "MessagePack is roughly 20–40 percent smaller than the same JSON, more if your data is integer-heavy. This converts a JSON payload to MessagePack so you can drop it into a Redis pipeline, hand it to a MessagePack-speaking microservice, or test client decode against a known-good encoding.",
    example:
      "You are writing a Unity game client that expects MessagePack-encoded server config. Author the config as JSON, convert here, ship the .msgpack to the client build.",
    troubleshooting: [],
  },
  "cbor-to-json": {
    whyConvert:
      "CBOR (RFC 8949) is the IETF-standard binary JSON, the encoding underneath COSE, WebAuthn attestation, and most modern IoT protocols on CoAP / LwM2M. To audit or modify a captured payload you usually want plain JSON; this decodes it with base64 for embedded byte strings.",
    example:
      "You captured a WebAuthn attestation statement and want to read the authenticatorData fields. Save the CBOR bytes, drop here, inspect the decoded JSON.",
    troubleshooting: [
      {
        problem: "Decoded JSON shows $binary wrappers everywhere.",
        solution:
          "CBOR distinguishes byte strings from text strings (JSON does not). We wrap byte strings as { \"$binary\": \"<base64>\" } so you can round-trip cleanly. If you only need the text view, post-process to decode the base64 back to the original strings.",
      },
    ],
  },
  "json-to-cbor": {
    whyConvert:
      "CBOR is the binary encoding behind COSE / WebAuthn / IoT stacks; to integration-test against a CBOR endpoint, you need a deterministic encoder. This takes hand-authored JSON, encodes it via cbor-x (the same implementation used by Node's @ipld/dag-cbor), and gives you a binary you can POST directly.",
    example:
      "You are testing a CoAP-over-CBOR endpoint on an ESP32 firmware. Hand-author the payload as JSON, convert here, send the resulting bytes with curl --data-binary.",
    troubleshooting: [],
  },
  "fasta-to-json": {
    whyConvert:
      "FASTA is the bioinformatics text format every sequence database (NCBI, UniProt, Ensembl) exports. Modern pipelines (pandas, BigQuery, Node tooling, REST APIs) all want JSON. This parses every FASTA record into a flat array of { id, description, sequence } objects so you can pivot, filter, or upload without writing a parser.",
    example:
      "You downloaded a multi-FASTA from NCBI containing 100 ribosomal sequences and want to load them into a Pandas DataFrame. Convert here, then pd.read_json gets you a typed frame in one line.",
    troubleshooting: [
      {
        problem: '"No FASTA records found" error.',
        solution:
          'Each record must start with ">" on its own line. If your file uses an unusual header marker (e.g. ";" for legacy PIR format), rewrite the headers to use ">" first.',
      },
    ],
  },
  "json-to-fasta": {
    whyConvert:
      "If you generated sequences (e.g. via a notebook, a primer design tool, or a downstream filtering step), you usually need them back in FASTA for the next tool in the pipeline (BLAST, BWA, samtools). This takes the same { id, description, sequence } JSON shape and emits a properly wrapped FASTA at 70 chars per line (NCBI convention).",
    example:
      "You filtered a list of 1000 contigs in a Pandas notebook and need to BLAST the survivors. df.to_json(orient='records'), convert here, paste the FASTA into BLAST.",
    troubleshooting: [],
  },
  "fastq-to-json": {
    whyConvert:
      "FASTQ is the standard short-read sequencing output (Illumina, MGI, PacBio HiFi). Every record carries a Phred quality string we usually want as a column in our downstream dataframe. This parses each 4-line record into { id, description, sequence, quality } so you can compute base-call quality stats, filter on average quality, or chunk for batching.",
    example:
      "You have a 500 MB FASTQ from an Illumina run and want to compute the per-read mean Phred quality before deciding what to trim. Convert here, then pandas + a string-to-quality decoder gets you a histogram in two lines.",
    troubleshooting: [
      {
        problem: '"FASTQ has N non-empty lines but records require exactly 4 lines each."',
        solution:
          "The file is truncated or contains extra blank lines inside records. FASTQ does NOT allow blank lines inside records. Validate the file with seqkit or fastqc first.",
      },
    ],
  },
  "json-to-fastq": {
    whyConvert:
      "If you generated synthetic reads (e.g. wgsim, dwgsim, or a custom simulator) or you re-quality-scored an existing run, you need FASTQ output so the rest of the alignment pipeline (BWA, minimap2, bowtie2) accepts the data. This takes the canonical { id, description, sequence, quality } JSON shape and emits a valid 4-line-per-record FASTQ.",
    example:
      "You simulated 10K paired-end reads in a notebook and want to align them with BWA. Export as JSON, convert here, pipe to BWA-MEM.",
    troubleshooting: [
      {
        problem: '"Record N: sequence and quality length mismatch."',
        solution:
          "FASTQ requires the quality string to be exactly as long as the sequence (one Phred char per base). Pad or trim your quality field to match before re-converting.",
      },
    ],
  },
  "bencode-to-json": {
    whyConvert:
      "Bencode is the dictionary format inside every .torrent file. The fields you actually want (announce URL, comment, name, file list, piece length) are buried under a binary wrapper. This decodes the whole structure to pretty JSON so you can inspect a torrent before downloading, audit a private tracker payload, or extract the file list programmatically.",
    example:
      "You received a .torrent file from a private tracker and want to confirm what files it claims to seed (and from which announce URL) before clicking. Convert here, read the JSON, decide.",
    troubleshooting: [
      {
        problem: 'I see lots of "$binary" wrappers in the output.',
        solution:
          'Bencode fields that contain non-text bytes (the "pieces" SHA1 blob is the big one) get wrapped as { "$binary": "<base64>" } to keep the output round-trippable through json-to-bencode. The wrappers are expected; just ignore them or post-process if you want raw hex.',
      },
    ],
  },
  "json-to-bencode": {
    whyConvert:
      "If you authored or modified a torrent structure as JSON (changed the announce URL, edited file paths, added a custom field), you need it back in bencode so a BitTorrent client will accept it. This re-encodes a fasta-to-json-shaped JSON back into the bencode dictionary format and writes a .torrent file you can hand to qBittorrent or Transmission.",
    example:
      "You wanted to add a custom comment to a torrent. Decode with bencode-to-json, edit the JSON, convert back here, replace the original .torrent.",
    troubleshooting: [
      {
        problem: "The resulting .torrent is rejected by my client.",
        solution:
          "Bencode is strict about types: the info dictionary keys must be byte strings in sorted order, and integer fields (piece length, length) must be JSON integers, not strings. If you stringified an integer field by accident during editing, the BitTorrent client will reject the info-hash. Verify the integer types in the JSON before re-encoding.",
      },
    ],
  },
  "asciidoc-to-html": {
    whyConvert:
      "AsciiDoc is the technical-writing source format behind Pro Git, the Spring reference docs, Eclipse, and many open-source project handbooks. To publish or preview the output you need HTML. This renders via Asciidoctor.js, the official reference implementation, so the output matches what readthedocs and AsciidoctorJ would produce.",
    example:
      "You write your project's handbook in .adoc and want a quick preview before committing. Drop the file here, get a self-contained HTML page you can open in any browser.",
    troubleshooting: [
      {
        problem: "My include::[] directives are not expanded.",
        solution:
          "Browser conversion has no filesystem access, so include::otherfile.adoc[] cannot resolve other files. Inline the includes before conversion, or use the Asciidoctor CLI locally.",
      },
    ],
  },
  "dot-to-svg": {
    whyConvert:
      "DOT is the Graphviz source language for directed and undirected graphs (CS textbooks, RFC diagrams, dependency graphs, state machines). To publish or embed the result you need SVG, the vector format that scales cleanly. Runs the upstream Graphviz dot engine compiled to WebAssembly, so the layout exactly matches what dot -Tsvg produces on the command line.",
    example:
      "You drafted a microservice dependency graph in DOT and want to drop it into a Notion doc as a scalable image. Convert here, the SVG is self-contained.",
    troubleshooting: [
      {
        problem: '"Graphviz failed to render the DOT source" error.',
        solution:
          "DOT is strict about syntax. Common gotchas: a missing closing brace, a node label that contains a hyphen without quotes, or a typo on the graph keyword (digraph vs graph). Validate locally with dot -Tsvg input.dot first if you have it installed.",
      },
    ],
  },
  "dot-to-png": {
    whyConvert:
      "Same Graphviz rendering as dot-to-svg, but rasterised to PNG for embed targets that only accept bitmaps (Slack message previews, Notion image blocks, legacy CMS image-only widgets). For docs sites and anywhere SVG works, prefer dot-to-svg, the output is smaller and stays sharp on retina screens.",
    example:
      "You want to share a quick state-machine diagram in a Slack thread. Convert to PNG here, drag into the channel, instant inline preview.",
    troubleshooting: [
      {
        problem: "The PNG is fuzzy when printed at full size.",
        solution:
          "PNG output is rasterised at the SVG's native pixel dimensions. For high-DPI printing use dot-to-svg and print from a vector tool (Inkscape, Illustrator), or open the SVG in your browser and use the browser's print-to-PDF.",
      },
    ],
  },
  "har-to-curl": {
    whyConvert:
      "HAR is what every browser DevTools (Chrome, Firefox, Safari, Edge) exports when you save a captured Network tab. To reproduce a failing API call against a different environment, replay a sequence in a bash script, or paste a captured request into Postman, you need it as curl commands. This emits one properly POSIX-quoted curl per HAR entry, ready to run.",
    example:
      'You are debugging why an API call works in your browser but not from your server. Capture the working request as HAR (DevTools → Network → right-click → "Save all as HAR with content"), convert here, run the curl against your dev environment.',
    troubleshooting: [
      {
        problem: "Some requests are missing from the output.",
        solution:
          'HAR entries without a "request.url" field are skipped (rare, but happens for some failed-to-start requests). All entries with a URL are included.',
      },
    ],
  },
  "curl-to-har": {
    whyConvert:
      "If you have a script of curl commands (from a colleague, a Stack Overflow answer, a CLI tool that emits them) and want to import them into a HAR-aware tool, you need them in HAR format. This parses each curl command (supports -X, -H, --data variants, --url, positional URL) and emits a HAR 1.2 document with one entry per command. The HAR can then be imported by mitmproxy, Charles, Insomnia, or any inspection tool.",
    example:
      "A teammate shared 5 curl commands for testing your new API. Paste them into a .sh file, convert here, drop the HAR into mitmproxy to replay them in batch.",
    troubleshooting: [
      {
        problem: '"All curl commands failed to parse" error.',
        solution:
          "Each command must start with curl at the beginning of a line. Line continuations with \\ work, but commands separated only by ; on the same line will be treated as one. Split them onto separate lines first.",
      },
    ],
  },
  "csl-json-to-ris": {
    whyConvert:
      "CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak; RIS is the tagged format EndNote, Mendeley, RefWorks, and most journal databases import. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and your next tool wants RIS. Drop the file here and get a clean RIS file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSL-JSON actually contained them. Open the source and confirm the field is populated; RIS cannot add data that was not there." },
    ],
  },
  "ris-to-csl-json": {
    whyConvert:
      "RIS is the tagged format EndNote, Mendeley, RefWorks, and most journal databases import; CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a .ris exported from a journal's \"cite\" button and your next tool wants CSL-JSON. Drop the file here and get a clean CSL-JSON file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source RIS actually contained them. Open the source and confirm the field is populated; CSL-JSON cannot add data that was not there." },
    ],
  },
  "csl-json-to-csv": {
    whyConvert:
      "CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak; CSV is a plain spreadsheet you can open in Excel, Sheets, or pandas. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and your next tool wants CSV. Drop the file here and get a clean CSV file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSL-JSON actually contained them. Open the source and confirm the field is populated; CSV cannot add data that was not there." },
    ],
  },
  "csv-to-csl-json": {
    whyConvert:
      "CSV is a plain spreadsheet you can open in Excel, Sheets, or pandas; CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a spreadsheet of references and your next tool wants CSL-JSON. Drop the file here and get a clean CSL-JSON file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSV actually contained them. Open the source and confirm the field is populated; CSL-JSON cannot add data that was not there." },
    ],
  },
  "csl-json-to-nbib": {
    whyConvert:
      "CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak; NBIB is PubMed's MEDLINE/NBIB export. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and your next tool wants NBIB. Drop the file here and get a clean NBIB file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSL-JSON actually contained them. Open the source and confirm the field is populated; NBIB cannot add data that was not there." },
    ],
  },
  "nbib-to-csl-json": {
    whyConvert:
      "NBIB is PubMed's MEDLINE/NBIB export; CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a PubMed export (Send to → Citation manager) and your next tool wants CSL-JSON. Drop the file here and get a clean CSL-JSON file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source NBIB actually contained them. Open the source and confirm the field is populated; CSL-JSON cannot add data that was not there." },
    ],
  },
  "csl-json-to-endnote-xml": {
    whyConvert:
      "CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak; EndNote XML is EndNote's XML library export. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and your next tool wants EndNote XML. Drop the file here and get a clean EndNote XML file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSL-JSON actually contained them. Open the source and confirm the field is populated; EndNote XML cannot add data that was not there." },
    ],
  },
  "endnote-xml-to-csl-json": {
    whyConvert:
      "EndNote XML is EndNote's XML library export; CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have an EndNote library exported as XML and your next tool wants CSL-JSON. Drop the file here and get a clean CSL-JSON file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source EndNote XML actually contained them. Open the source and confirm the field is populated; CSL-JSON cannot add data that was not there." },
    ],
  },
  "endnote-xml-to-csv": {
    whyConvert:
      "EndNote XML is EndNote's XML library export; CSV is a plain spreadsheet you can open in Excel, Sheets, or pandas. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have an EndNote library exported as XML and your next tool wants CSV. Drop the file here and get a clean CSV file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source EndNote XML actually contained them. Open the source and confirm the field is populated; CSV cannot add data that was not there." },
    ],
  },
  "csv-to-endnote-xml": {
    whyConvert:
      "CSV is a plain spreadsheet you can open in Excel, Sheets, or pandas; EndNote XML is EndNote's XML library export. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a spreadsheet of references and your next tool wants EndNote XML. Drop the file here and get a clean EndNote XML file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSV actually contained them. Open the source and confirm the field is populated; EndNote XML cannot add data that was not there." },
    ],
  },
  "endnote-xml-to-nbib": {
    whyConvert:
      "EndNote XML is EndNote's XML library export; NBIB is PubMed's MEDLINE/NBIB export. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have an EndNote library exported as XML and your next tool wants NBIB. Drop the file here and get a clean NBIB file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source EndNote XML actually contained them. Open the source and confirm the field is populated; NBIB cannot add data that was not there." },
    ],
  },
  "nbib-to-endnote-xml": {
    whyConvert:
      "NBIB is PubMed's MEDLINE/NBIB export; EndNote XML is EndNote's XML library export. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a PubMed export (Send to → Citation manager) and your next tool wants EndNote XML. Drop the file here and get a clean EndNote XML file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source NBIB actually contained them. Open the source and confirm the field is populated; EndNote XML cannot add data that was not there." },
    ],
  },
  "nbib-to-csv": {
    whyConvert:
      "NBIB is PubMed's MEDLINE/NBIB export; CSV is a plain spreadsheet you can open in Excel, Sheets, or pandas. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a PubMed export (Send to → Citation manager) and your next tool wants CSV. Drop the file here and get a clean CSV file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source NBIB actually contained them. Open the source and confirm the field is populated; CSV cannot add data that was not there." },
    ],
  },
  "csv-to-nbib": {
    whyConvert:
      "CSV is a plain spreadsheet you can open in Excel, Sheets, or pandas; NBIB is PubMed's MEDLINE/NBIB export. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a spreadsheet of references and your next tool wants NBIB. Drop the file here and get a clean NBIB file back in one step.",
    troubleshooting: [
      { problem: "Some references are missing fields after conversion.", solution: "Fields only carry across if the source CSV actually contained them. Open the source and confirm the field is populated; NBIB cannot add data that was not there." },
    ],
  },
  "endnote-xml-to-xlsx": {
    whyConvert:
      "EndNote XML is EndNote's XML library export; Excel (XLSX) is a native Excel workbook. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have an EndNote library exported as XML and your next tool wants Excel (XLSX). Drop the file here and get a clean Excel (XLSX) file back in one step.",
    troubleshooting: [
      { problem: "A column I expected is empty.", solution: "Only fields present in the source records are filled. If the source EndNote XML omits a field (no DOI, no pages), that cell stays blank; there is nothing to invent." },
    ],
  },
  "csl-json-to-xlsx": {
    whyConvert:
      "CSL-JSON is the Citation Style Language JSON that Zotero, pandoc, and citeproc speak; Excel (XLSX) is a native Excel workbook. This converts one to the other through a shared bibliographic model, so every field that round-trips (title, authors, year, journal, volume, pages, DOI) carries across without re-keying. Runs entirely in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and your next tool wants Excel (XLSX). Drop the file here and get a clean Excel (XLSX) file back in one step.",
    troubleshooting: [
      { problem: "A column I expected is empty.", solution: "Only fields present in the source records are filled. If the source CSL-JSON omits a field (no DOI, no pages), that cell stays blank; there is nothing to invent." },
    ],
  },
  "ris-to-markdown": {
    whyConvert:
      "RIS is a structured citation format; this turns it into a formatted Markdown reference list you can paste into Obsidian, a README, a GitHub wiki, or any Markdown note. Parses a .ris export from a journal or reference manager into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a .ris export from a journal or reference manager and want to paste the reference list straight into your Obsidian vault or project README. Drop the file here and get the Markdown back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source RIS actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "ris-to-html": {
    whyConvert:
      "RIS is a structured citation format; this turns it into a formatted HTML reference list you can drop into a webpage, a blog post, or a course page. Parses a .ris export from a journal or reference manager into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a .ris export from a journal or reference manager and want to drop the formatted reference list into your webpage or blog post. Drop the file here and get the HTML back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source RIS actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "ris-to-yaml": {
    whyConvert:
      "RIS is a structured citation format; this turns it into CSL-YAML, the bibliography format Pandoc reads via --bibliography refs.yaml when you build a document from Markdown. Parses a .ris export from a journal or reference manager into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a .ris export from a journal or reference manager and want to point Pandoc at the YAML with --bibliography to auto-format every citation in your paper. Drop the file here and get the YAML (CSL) back in one step.",
    troubleshooting: [
      { problem: "Pandoc does not pick up the references.", solution: "Pass the file with --bibliography refs.yaml, or paste the list (without the top-level references: key) into your document's YAML frontmatter under a references: block." },
    ],
  },
  "nbib-to-markdown": {
    whyConvert:
      "NBIB is a structured citation format; this turns it into a formatted Markdown reference list you can paste into Obsidian, a README, a GitHub wiki, or any Markdown note. Parses a PubMed/MEDLINE export into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a PubMed/MEDLINE export and want to paste the reference list straight into your Obsidian vault or project README. Drop the file here and get the Markdown back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source NBIB actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "nbib-to-html": {
    whyConvert:
      "NBIB is a structured citation format; this turns it into a formatted HTML reference list you can drop into a webpage, a blog post, or a course page. Parses a PubMed/MEDLINE export into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a PubMed/MEDLINE export and want to drop the formatted reference list into your webpage or blog post. Drop the file here and get the HTML back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source NBIB actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "nbib-to-yaml": {
    whyConvert:
      "NBIB is a structured citation format; this turns it into CSL-YAML, the bibliography format Pandoc reads via --bibliography refs.yaml when you build a document from Markdown. Parses a PubMed/MEDLINE export into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a PubMed/MEDLINE export and want to point Pandoc at the YAML with --bibliography to auto-format every citation in your paper. Drop the file here and get the YAML (CSL) back in one step.",
    troubleshooting: [
      { problem: "Pandoc does not pick up the references.", solution: "Pass the file with --bibliography refs.yaml, or paste the list (without the top-level references: key) into your document's YAML frontmatter under a references: block." },
    ],
  },
  "csl-json-to-markdown": {
    whyConvert:
      "CSL-JSON is a structured citation format; this turns it into a formatted Markdown reference list you can paste into Obsidian, a README, a GitHub wiki, or any Markdown note. Parses a Zotero or pandoc CSL-JSON file into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and want to paste the reference list straight into your Obsidian vault or project README. Drop the file here and get the Markdown back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source CSL-JSON actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "csl-json-to-html": {
    whyConvert:
      "CSL-JSON is a structured citation format; this turns it into a formatted HTML reference list you can drop into a webpage, a blog post, or a course page. Parses a Zotero or pandoc CSL-JSON file into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and want to drop the formatted reference list into your webpage or blog post. Drop the file here and get the HTML back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source CSL-JSON actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "csl-json-to-yaml": {
    whyConvert:
      "CSL-JSON is a structured citation format; this turns it into CSL-YAML, the bibliography format Pandoc reads via --bibliography refs.yaml when you build a document from Markdown. Parses a Zotero or pandoc CSL-JSON file into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have a Zotero or pandoc CSL-JSON file and want to point Pandoc at the YAML with --bibliography to auto-format every citation in your paper. Drop the file here and get the YAML (CSL) back in one step.",
    troubleshooting: [
      { problem: "Pandoc does not pick up the references.", solution: "Pass the file with --bibliography refs.yaml, or paste the list (without the top-level references: key) into your document's YAML frontmatter under a references: block." },
    ],
  },
  "endnote-xml-to-markdown": {
    whyConvert:
      "EndNote XML is a structured citation format; this turns it into a formatted Markdown reference list you can paste into Obsidian, a README, a GitHub wiki, or any Markdown note. Parses an EndNote XML library into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have an EndNote XML library and want to paste the reference list straight into your Obsidian vault or project README. Drop the file here and get the Markdown back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source EndNote XML actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "endnote-xml-to-html": {
    whyConvert:
      "EndNote XML is a structured citation format; this turns it into a formatted HTML reference list you can drop into a webpage, a blog post, or a course page. Parses an EndNote XML library into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have an EndNote XML library and want to drop the formatted reference list into your webpage or blog post. Drop the file here and get the HTML back in one step.",
    troubleshooting: [
      { problem: "A reference is missing its author or year.", solution: "The render only shows fields the source EndNote XML actually contained. Open the source and confirm the field is populated before converting." },
    ],
  },
  "endnote-xml-to-yaml": {
    whyConvert:
      "EndNote XML is a structured citation format; this turns it into CSL-YAML, the bibliography format Pandoc reads via --bibliography refs.yaml when you build a document from Markdown. Parses an EndNote XML library into a shared bibliographic model, then renders each entry. Everything runs in your browser, no upload.",
    example:
      "You have an EndNote XML library and want to point Pandoc at the YAML with --bibliography to auto-format every citation in your paper. Drop the file here and get the YAML (CSL) back in one step.",
    troubleshooting: [
      { problem: "Pandoc does not pick up the references.", solution: "Pass the file with --bibliography refs.yaml, or paste the list (without the top-level references: key) into your document's YAML frontmatter under a references: block." },
    ],
  },
  "enw-to-bibtex": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to BibTeX so you can use the references in a LaTeX/Overleaf bibliography. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in BibTeX for a LaTeX/Overleaf bibliography. Drop the .enw here and get BibTeX back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-ris": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to RIS so you can use the references in EndNote, Mendeley, or Zotero. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in RIS for EndNote, Mendeley, or Zotero. Drop the .enw here and get RIS back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-nbib": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to NBIB so you can use the references in a PubMed-style record. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in NBIB for a PubMed-style record. Drop the .enw here and get NBIB back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-endnote-xml": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to EndNote XML so you can use the references in an EndNote XML library. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in EndNote XML for an EndNote XML library. Drop the .enw here and get EndNote XML back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-csl-json": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to CSL-JSON so you can use the references in Zotero or pandoc. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in CSL-JSON for Zotero or pandoc. Drop the .enw here and get CSL-JSON back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-csv": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to CSV so you can use the references in a spreadsheet. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in CSV for a spreadsheet. Drop the .enw here and get CSV back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-xlsx": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to Excel (XLSX) so you can use the references in Excel. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in Excel (XLSX) for Excel. Drop the .enw here and get Excel (XLSX) back.",
    troubleshooting: [
      { problem: "A column is blank.", solution: "ENW only fills fields the export actually included; a missing %V or %R leaves that cell empty." },
    ],
  },
  "enw-to-markdown": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to Markdown so you can use the references in an Obsidian note or README. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in Markdown for an Obsidian note or README. Drop the .enw here and get Markdown back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-html": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to HTML so you can use the references in a webpage. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in HTML for a webpage. Drop the .enw here and get HTML back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "enw-to-yaml": {
    whyConvert:
      "EndNote ENW is the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. This converts it to YAML (CSL) so you can use the references in a Pandoc bibliography. Goes through the unified Citation model, so title, authors, year, journal, volume, pages, and DOI all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You clicked \"Download .enw\" on a journal article and need it in YAML (CSL) for a Pandoc bibliography. Drop the .enw here and get YAML (CSL) back.",
    troubleshooting: [
      { problem: "An author or the DOI is missing.", solution: "Check the .enw source has the matching tag (%A author, %R DOI, %T title). The converter carries across only what the export contained." },
    ],
  },
  "bibtex-to-enw": {
    whyConvert:
      "BibTeX is a LaTeX/Overleaf bibliography data; this rewrites it as the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. Use it when a tool or a colleague specifically wants a .enw file to import into EndNote. Goes through the unified Citation model so every field carries across.",
    example:
      "You have BibTeX references and need to hand someone a .enw to import into EndNote. Convert here and send the .enw.",
    troubleshooting: [
      { problem: "EndNote will not import the file.", solution: "EndNote expects the .enw extension and a %0 reference-type line per record, which this produces. If import still fails, open EndNote's import filter and pick \"EndNote Import\" or \"Refer/BibIX\"." },
    ],
  },
  "ris-to-enw": {
    whyConvert:
      "RIS is EndNote, Mendeley, or Zotero data; this rewrites it as the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. Use it when a tool or a colleague specifically wants a .enw file to import into EndNote. Goes through the unified Citation model so every field carries across.",
    example:
      "You have RIS references and need to hand someone a .enw to import into EndNote. Convert here and send the .enw.",
    troubleshooting: [
      { problem: "EndNote will not import the file.", solution: "EndNote expects the .enw extension and a %0 reference-type line per record, which this produces. If import still fails, open EndNote's import filter and pick \"EndNote Import\" or \"Refer/BibIX\"." },
    ],
  },
  "nbib-to-enw": {
    whyConvert:
      "NBIB is a PubMed-style record data; this rewrites it as the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. Use it when a tool or a colleague specifically wants a .enw file to import into EndNote. Goes through the unified Citation model so every field carries across.",
    example:
      "You have NBIB references and need to hand someone a .enw to import into EndNote. Convert here and send the .enw.",
    troubleshooting: [
      { problem: "EndNote will not import the file.", solution: "EndNote expects the .enw extension and a %0 reference-type line per record, which this produces. If import still fails, open EndNote's import filter and pick \"EndNote Import\" or \"Refer/BibIX\"." },
    ],
  },
  "endnote-xml-to-enw": {
    whyConvert:
      "EndNote XML is an EndNote XML library data; this rewrites it as the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. Use it when a tool or a colleague specifically wants a .enw file to import into EndNote. Goes through the unified Citation model so every field carries across.",
    example:
      "You have EndNote XML references and need to hand someone a .enw to import into EndNote. Convert here and send the .enw.",
    troubleshooting: [
      { problem: "EndNote will not import the file.", solution: "EndNote expects the .enw extension and a %0 reference-type line per record, which this produces. If import still fails, open EndNote's import filter and pick \"EndNote Import\" or \"Refer/BibIX\"." },
    ],
  },
  "csl-json-to-enw": {
    whyConvert:
      "CSL-JSON is Zotero or pandoc data; this rewrites it as the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. Use it when a tool or a colleague specifically wants a .enw file to import into EndNote. Goes through the unified Citation model so every field carries across.",
    example:
      "You have CSL-JSON references and need to hand someone a .enw to import into EndNote. Convert here and send the .enw.",
    troubleshooting: [
      { problem: "EndNote will not import the file.", solution: "EndNote expects the .enw extension and a %0 reference-type line per record, which this produces. If import still fails, open EndNote's import filter and pick \"EndNote Import\" or \"Refer/BibIX\"." },
    ],
  },
  "csv-to-enw": {
    whyConvert:
      "CSV is a spreadsheet of references; this rewrites it as the tagged \"Refer\" format behind the \"Download .enw\" or \"Export to EndNote\" link on journal sites, library catalogs, and databases. Use it when a tool or a colleague specifically wants a .enw file to import into EndNote. Goes through the unified Citation model so every field carries across.",
    example:
      "You have CSV references and need to hand someone a .enw to import into EndNote. Convert here and send the .enw.",
    troubleshooting: [
      { problem: "EndNote will not import the file.", solution: "EndNote expects the .enw extension and a %0 reference-type line per record, which this produces. If import still fails, open EndNote's import filter and pick \"EndNote Import\" or \"Refer/BibIX\"." },
    ],
  },
  "wos-to-bibtex": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to BibTeX so you can load the records into a LaTeX or Overleaf bibliography. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in BibTeX for a LaTeX or Overleaf bibliography. Drop the savedrecs.txt here and get BibTeX back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-ris": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to RIS so you can load the records into EndNote, Mendeley, or Zotero. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in RIS for EndNote, Mendeley, or Zotero. Drop the savedrecs.txt here and get RIS back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-nbib": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to NBIB so you can load the records into a PubMed-style citation manager. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in NBIB for a PubMed-style citation manager. Drop the savedrecs.txt here and get NBIB back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-endnote-xml": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to EndNote XML so you can load the records into an EndNote XML library. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in EndNote XML for an EndNote XML library. Drop the savedrecs.txt here and get EndNote XML back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-csl-json": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to CSL-JSON so you can load the records into Zotero or a pandoc workflow. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in CSL-JSON for Zotero or a pandoc workflow. Drop the savedrecs.txt here and get CSL-JSON back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-csv": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to CSV so you can load the records into a spreadsheet for screening or coding. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in CSV for a spreadsheet for screening or coding. Drop the savedrecs.txt here and get CSV back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-xlsx": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to Excel (XLSX) so you can load the records into Excel for systematic-review screening. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in Excel (XLSX) for Excel for systematic-review screening. Drop the savedrecs.txt here and get Excel (XLSX) back.",
    troubleshooting: [
      { problem: "A column is blank for some rows.", solution: "Web of Science omits tags it has no data for (a record with no DI has no DOI). The converter fills only what the export contained." },
    ],
  },
  "wos-to-markdown": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to Markdown so you can load the records into an Obsidian note or README. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in Markdown for an Obsidian note or README. Drop the savedrecs.txt here and get Markdown back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-html": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to HTML so you can load the records into a webpage. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in HTML for a webpage. Drop the savedrecs.txt here and get HTML back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "wos-to-yaml": {
    whyConvert:
      "Web of Science (Clarivate) and the older ISI export references as a tagged plain-text file, the format VOSviewer, bibliometrix, and CiteSpace read. This converts that export to YAML (CSL) so you can load the records into a Pandoc bibliography. Title, authors, year, source, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You ran a Web of Science search, chose Export then Plain Text, and need the records in YAML (CSL) for a Pandoc bibliography. Drop the savedrecs.txt here and get YAML (CSL) back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from Web of Science as Plain Text (the tagged format starting with FN and PT lines), not as Tab-delimited or BibTeX. Each record must end with an ER line." },
    ],
  },
  "refworks-to-bibtex": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to BibTeX so you can load the references into a LaTeX or Overleaf bibliography. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in BibTeX for a LaTeX or Overleaf bibliography. Drop the file here and get BibTeX back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-ris": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to RIS so you can load the references into EndNote, Mendeley, or Zotero. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in RIS for EndNote, Mendeley, or Zotero. Drop the file here and get RIS back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-nbib": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to NBIB so you can load the references into a PubMed-style manager. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in NBIB for a PubMed-style manager. Drop the file here and get NBIB back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-endnote-xml": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to EndNote XML so you can load the references into an EndNote XML library. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in EndNote XML for an EndNote XML library. Drop the file here and get EndNote XML back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-csl-json": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to CSL-JSON so you can load the references into Zotero or a pandoc workflow. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in CSL-JSON for Zotero or a pandoc workflow. Drop the file here and get CSL-JSON back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-csv": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to CSV so you can load the references into a spreadsheet. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in CSV for a spreadsheet. Drop the file here and get CSV back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-xlsx": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to Excel (XLSX) so you can load the references into Excel. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in Excel (XLSX) for Excel. Drop the file here and get Excel (XLSX) back.",
    troubleshooting: [
      { problem: "A column is blank for some rows.", solution: "RefWorks omits tags it has no value for; the converter fills only the fields the export contained." },
    ],
  },
  "refworks-to-markdown": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to Markdown so you can load the references into an Obsidian note or README. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in Markdown for an Obsidian note or README. Drop the file here and get Markdown back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-html": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to HTML so you can load the references into a webpage. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in HTML for a webpage. Drop the file here and get HTML back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "refworks-to-yaml": {
    whyConvert:
      "RefWorks (ProQuest) is the institutional reference manager many university libraries provide; it exports a tagged text file (RT, A1, T1, ...). This converts that export to YAML (CSL) so you can load the references into a Pandoc bibliography. Title, authors, year, journal, volume, issue, pages, DOI, and keywords all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported references from RefWorks as a tagged text file and need them in YAML (CSL) for a Pandoc bibliography. Drop the file here and get YAML (CSL) back.",
    troubleshooting: [
      { problem: "The file is not recognized.", solution: "Export from RefWorks in the Tagged Format (records begin with an RT line), not RIS or BibTeX. Each record needs an RT reference-type line." },
    ],
  },
  "bibtex-to-refworks": {
    whyConvert:
      "BibTeX is LaTeX or Overleaf bibliography data; this rewrites it as a RefWorks tagged file you can import into RefWorks. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have BibTeX references and your institution uses RefWorks. Convert here and import the tagged file into RefWorks.",
    troubleshooting: [
      { problem: "RefWorks will not import the file.", solution: "In RefWorks choose Import then the RefWorks Tagged Format filter. Each record this produces starts with an RT line and ends before the next blank line." },
    ],
  },
  "ris-to-refworks": {
    whyConvert:
      "RIS is EndNote, Mendeley, or Zotero data; this rewrites it as a RefWorks tagged file you can import into RefWorks. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have RIS references and your institution uses RefWorks. Convert here and import the tagged file into RefWorks.",
    troubleshooting: [
      { problem: "RefWorks will not import the file.", solution: "In RefWorks choose Import then the RefWorks Tagged Format filter. Each record this produces starts with an RT line and ends before the next blank line." },
    ],
  },
  "nbib-to-refworks": {
    whyConvert:
      "NBIB is PubMed-style manager data; this rewrites it as a RefWorks tagged file you can import into RefWorks. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have NBIB references and your institution uses RefWorks. Convert here and import the tagged file into RefWorks.",
    troubleshooting: [
      { problem: "RefWorks will not import the file.", solution: "In RefWorks choose Import then the RefWorks Tagged Format filter. Each record this produces starts with an RT line and ends before the next blank line." },
    ],
  },
  "endnote-xml-to-refworks": {
    whyConvert:
      "EndNote XML is EndNote XML library data; this rewrites it as a RefWorks tagged file you can import into RefWorks. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have EndNote XML references and your institution uses RefWorks. Convert here and import the tagged file into RefWorks.",
    troubleshooting: [
      { problem: "RefWorks will not import the file.", solution: "In RefWorks choose Import then the RefWorks Tagged Format filter. Each record this produces starts with an RT line and ends before the next blank line." },
    ],
  },
  "csl-json-to-refworks": {
    whyConvert:
      "CSL-JSON is Zotero or a pandoc workflow data; this rewrites it as a RefWorks tagged file you can import into RefWorks. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have CSL-JSON references and your institution uses RefWorks. Convert here and import the tagged file into RefWorks.",
    troubleshooting: [
      { problem: "RefWorks will not import the file.", solution: "In RefWorks choose Import then the RefWorks Tagged Format filter. Each record this produces starts with an RT line and ends before the next blank line." },
    ],
  },
  "csv-to-refworks": {
    whyConvert:
      "CSV is a spreadsheet of references; this rewrites it as a RefWorks tagged file you can import into RefWorks. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have CSV references and your institution uses RefWorks. Convert here and import the tagged file into RefWorks.",
    troubleshooting: [
      { problem: "RefWorks will not import the file.", solution: "In RefWorks choose Import then the RefWorks Tagged Format filter. Each record this produces starts with an RT line and ends before the next blank line." },
    ],
  },
  "mods-to-bibtex": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to BibTeX so you can reuse the metadata in a LaTeX or Overleaf bibliography. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in BibTeX for a LaTeX or Overleaf bibliography. Drop the .xml here and get BibTeX back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-ris": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to RIS so you can reuse the metadata in EndNote, Mendeley, or Zotero. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in RIS for EndNote, Mendeley, or Zotero. Drop the .xml here and get RIS back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-nbib": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to NBIB so you can reuse the metadata in a PubMed-style manager. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in NBIB for a PubMed-style manager. Drop the .xml here and get NBIB back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-endnote-xml": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to EndNote XML so you can reuse the metadata in an EndNote XML library. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in EndNote XML for an EndNote XML library. Drop the .xml here and get EndNote XML back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-csl-json": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to CSL-JSON so you can reuse the metadata in Zotero or a pandoc workflow. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in CSL-JSON for Zotero or a pandoc workflow. Drop the .xml here and get CSL-JSON back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-csv": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to CSV so you can reuse the metadata in a spreadsheet. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in CSV for a spreadsheet. Drop the .xml here and get CSV back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-xlsx": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to Excel (XLSX) so you can reuse the metadata in Excel. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in Excel (XLSX) for Excel. Drop the .xml here and get Excel (XLSX) back.",
    troubleshooting: [
      { problem: "A column is blank for some rows.", solution: "MODS records vary in completeness; the converter fills only the elements the record actually contains." },
    ],
  },
  "mods-to-markdown": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to Markdown so you can reuse the metadata in an Obsidian note or README. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in Markdown for an Obsidian note or README. Drop the .xml here and get Markdown back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-html": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to HTML so you can reuse the metadata in a webpage. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in HTML for a webpage. Drop the .xml here and get HTML back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "mods-to-yaml": {
    whyConvert:
      "MODS (Metadata Object Description Schema) is the Library of Congress XML format used by DSpace, Fedora, Islandora, and most institutional repositories and catalogs. This converts a MODS record to YAML (CSL) so you can reuse the metadata in a Pandoc bibliography. Title, authors, year, host journal, volume, issue, pages, DOI, ISSN, and subjects all carry across. Runs in your browser, nothing is uploaded.",
    example:
      "You exported a record from a repository as MODS XML and need it in YAML (CSL) for a Pandoc bibliography. Drop the .xml here and get YAML (CSL) back.",
    troubleshooting: [
      { problem: "Authors or the journal are missing.", solution: "Author names must be in name elements with namePart family/given, and the journal in a relatedItem of type host. Records using only display-form names may not map cleanly." },
    ],
  },
  "bibtex-to-mods": {
    whyConvert:
      "BibTeX is LaTeX or Overleaf bibliography data; this rewrites it as MODS XML (Library of Congress schema) so you can deposit the records into DSpace, Fedora, or another repository. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have BibTeX references and your repository ingests MODS. Convert here and load the MODS XML into the repository.",
    troubleshooting: [
      { problem: "The repository rejects the MODS.", solution: "The output is MODS v3.7 in the http://www.loc.gov/mods/v3 namespace. If your repository expects a single mods root rather than a modsCollection, extract one mods element, or configure the ingest to accept modsCollection." },
    ],
  },
  "ris-to-mods": {
    whyConvert:
      "RIS is EndNote, Mendeley, or Zotero data; this rewrites it as MODS XML (Library of Congress schema) so you can deposit the records into DSpace, Fedora, or another repository. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have RIS references and your repository ingests MODS. Convert here and load the MODS XML into the repository.",
    troubleshooting: [
      { problem: "The repository rejects the MODS.", solution: "The output is MODS v3.7 in the http://www.loc.gov/mods/v3 namespace. If your repository expects a single mods root rather than a modsCollection, extract one mods element, or configure the ingest to accept modsCollection." },
    ],
  },
  "nbib-to-mods": {
    whyConvert:
      "NBIB is PubMed-style manager data; this rewrites it as MODS XML (Library of Congress schema) so you can deposit the records into DSpace, Fedora, or another repository. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have NBIB references and your repository ingests MODS. Convert here and load the MODS XML into the repository.",
    troubleshooting: [
      { problem: "The repository rejects the MODS.", solution: "The output is MODS v3.7 in the http://www.loc.gov/mods/v3 namespace. If your repository expects a single mods root rather than a modsCollection, extract one mods element, or configure the ingest to accept modsCollection." },
    ],
  },
  "endnote-xml-to-mods": {
    whyConvert:
      "EndNote XML is EndNote XML library data; this rewrites it as MODS XML (Library of Congress schema) so you can deposit the records into DSpace, Fedora, or another repository. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have EndNote XML references and your repository ingests MODS. Convert here and load the MODS XML into the repository.",
    troubleshooting: [
      { problem: "The repository rejects the MODS.", solution: "The output is MODS v3.7 in the http://www.loc.gov/mods/v3 namespace. If your repository expects a single mods root rather than a modsCollection, extract one mods element, or configure the ingest to accept modsCollection." },
    ],
  },
  "csl-json-to-mods": {
    whyConvert:
      "CSL-JSON is Zotero or a pandoc workflow data; this rewrites it as MODS XML (Library of Congress schema) so you can deposit the records into DSpace, Fedora, or another repository. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have CSL-JSON references and your repository ingests MODS. Convert here and load the MODS XML into the repository.",
    troubleshooting: [
      { problem: "The repository rejects the MODS.", solution: "The output is MODS v3.7 in the http://www.loc.gov/mods/v3 namespace. If your repository expects a single mods root rather than a modsCollection, extract one mods element, or configure the ingest to accept modsCollection." },
    ],
  },
  "csv-to-mods": {
    whyConvert:
      "CSV is a spreadsheet of references; this rewrites it as MODS XML (Library of Congress schema) so you can deposit the records into DSpace, Fedora, or another repository. Goes through the unified Citation model so title, authors, year, journal, pages, and DOI carry across.",
    example:
      "You have CSV references and your repository ingests MODS. Convert here and load the MODS XML into the repository.",
    troubleshooting: [
      { problem: "The repository rejects the MODS.", solution: "The output is MODS v3.7 in the http://www.loc.gov/mods/v3 namespace. If your repository expects a single mods root rather than a modsCollection, extract one mods element, or configure the ingest to accept modsCollection." },
    ],
  },
  "marcxml-to-bibtex": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to BibTeX so you can reuse the bibliographic data in a LaTeX or Overleaf bibliography. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in BibTeX for a LaTeX or Overleaf bibliography. Drop the .xml here and get BibTeX back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-ris": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to RIS so you can reuse the bibliographic data in EndNote, Mendeley, or Zotero. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in RIS for EndNote, Mendeley, or Zotero. Drop the .xml here and get RIS back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-nbib": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to NBIB so you can reuse the bibliographic data in a PubMed-style manager. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in NBIB for a PubMed-style manager. Drop the .xml here and get NBIB back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-endnote-xml": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to EndNote XML so you can reuse the bibliographic data in an EndNote XML library. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in EndNote XML for an EndNote XML library. Drop the .xml here and get EndNote XML back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-csl-json": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to CSL-JSON so you can reuse the bibliographic data in Zotero or a pandoc workflow. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in CSL-JSON for Zotero or a pandoc workflow. Drop the .xml here and get CSL-JSON back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-csv": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to CSV so you can reuse the bibliographic data in a spreadsheet for cataloging or analysis. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in CSV for a spreadsheet for cataloging or analysis. Drop the .xml here and get CSV back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-xlsx": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to Excel (XLSX) so you can reuse the bibliographic data in Excel. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in Excel (XLSX) for Excel. Drop the .xml here and get Excel (XLSX) back.",
    troubleshooting: [
      { problem: "A column is blank for some rows.", solution: "MARC records vary in completeness; the converter fills only the fields present. Article-level data (volume, pages) comes from the 773 host-item field, which not every record carries." },
    ],
  },
  "marcxml-to-markdown": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to Markdown so you can reuse the bibliographic data in an Obsidian note or README. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in Markdown for an Obsidian note or README. Drop the .xml here and get Markdown back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-html": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to HTML so you can reuse the bibliographic data in a webpage or finding aid. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in HTML for a webpage or finding aid. Drop the .xml here and get HTML back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "marcxml-to-yaml": {
    whyConvert:
      "MARCXML is MARC21 catalog records in XML, the format library systems (Koha, Alma, Sierra) and the Library of Congress export. This converts a MARCXML record to YAML (CSL) so you can reuse the bibliographic data in a Pandoc bibliography. Title (245), authors (100/700), year, host journal (773), volume, issue, pages, DOI (024), ISSN (022), and ISBN (020) are extracted. Runs in your browser, nothing is uploaded.",
    example:
      "You exported records from your library catalog as MARCXML and need them in YAML (CSL) for a Pandoc bibliography. Drop the .xml here and get YAML (CSL) back.",
    troubleshooting: [
      { problem: "The DOI or year is missing.", solution: "DOIs must be in an 024 field with first indicator 7 and a $2 of doi. For journal articles the year is read from the 773 host-item string; records without a 773 fall back to the 260/264 publication date." },
    ],
  },
  "srt-to-txt": {
    whyConvert:
      "SRT is a timed caption format; this strips the timestamps, cue numbers, and inline markup to give you a clean plain-text transcript of what is said. Repeated lines from rolling auto-captions are collapsed, and each caption becomes one line. Runs in your browser, nothing is uploaded.",
    example:
      "You have a SRT caption file from a video and just want the words, e.g. to paste into a doc, summarize, or feed to an LLM. Drop the SRT here and get the transcript text back.",
    troubleshooting: [
      { problem: "Lines are split oddly or a caption is on two lines.", solution: "Each cue becomes one transcript line; a caption that was wrapped across two screen lines is joined with a space. If you need sentence-level paragraphs, the source captions did not encode sentence boundaries, so re-flow the text in your editor." },
    ],
  },
  "vtt-to-txt": {
    whyConvert:
      "VTT is a timed caption format; this strips the timestamps, cue numbers, and inline markup to give you a clean plain-text transcript of what is said. Repeated lines from rolling auto-captions are collapsed, and each caption becomes one line. Runs in your browser, nothing is uploaded.",
    example:
      "You have a VTT caption file from a video and just want the words, e.g. to paste into a doc, summarize, or feed to an LLM. Drop the VTT here and get the transcript text back.",
    troubleshooting: [
      { problem: "Lines are split oddly or a caption is on two lines.", solution: "Each cue becomes one transcript line; a caption that was wrapped across two screen lines is joined with a space. If you need sentence-level paragraphs, the source captions did not encode sentence boundaries, so re-flow the text in your editor." },
    ],
  },
  "ass-to-txt": {
    whyConvert:
      "ASS is a timed caption format; this strips the timestamps, cue numbers, and inline markup to give you a clean plain-text transcript of what is said. Repeated lines from rolling auto-captions are collapsed, and each caption becomes one line. Runs in your browser, nothing is uploaded.",
    example:
      "You have a ASS caption file from a video and just want the words, e.g. to paste into a doc, summarize, or feed to an LLM. Drop the ASS here and get the transcript text back.",
    troubleshooting: [
      { problem: "Lines are split oddly or a caption is on two lines.", solution: "Each cue becomes one transcript line; a caption that was wrapped across two screen lines is joined with a space. If you need sentence-level paragraphs, the source captions did not encode sentence boundaries, so re-flow the text in your editor." },
    ],
  },
  "sbv-to-txt": {
    whyConvert:
      "SBV is a timed caption format; this strips the timestamps, cue numbers, and inline markup to give you a clean plain-text transcript of what is said. Repeated lines from rolling auto-captions are collapsed, and each caption becomes one line. Runs in your browser, nothing is uploaded.",
    example:
      "You have a SBV caption file from a video and just want the words, e.g. to paste into a doc, summarize, or feed to an LLM. Drop the SBV here and get the transcript text back.",
    troubleshooting: [
      { problem: "Lines are split oddly or a caption is on two lines.", solution: "Each cue becomes one transcript line; a caption that was wrapped across two screen lines is joined with a space. If you need sentence-level paragraphs, the source captions did not encode sentence boundaries, so re-flow the text in your editor." },
    ],
  },
  "lrc-to-txt": {
    whyConvert:
      "LRC is a timed caption format; this strips the timestamps, cue numbers, and inline markup to give you a clean plain-text transcript of what is said. Repeated lines from rolling auto-captions are collapsed, and each caption becomes one line. Runs in your browser, nothing is uploaded.",
    example:
      "You have a LRC caption file from a video and just want the words, e.g. to paste into a doc, summarize, or feed to an LLM. Drop the LRC here and get the transcript text back.",
    troubleshooting: [
      { problem: "Lines are split oddly or a caption is on two lines.", solution: "Each cue becomes one transcript line; a caption that was wrapped across two screen lines is joined with a space. If you need sentence-level paragraphs, the source captions did not encode sentence boundaries, so re-flow the text in your editor." },
    ],
  },
  "vtt-to-sbv": {
    whyConvert:
      "Both VTT and SBV are subtitle formats; this re-times the cues from one into the other through a shared cue model, so the text and timing carry across exactly. Useful when a player, editor, or platform only accepts SBV. Runs in your browser, nothing is uploaded.",
    example:
      "You have VTT captions but your tool needs SBV. Drop the VTT here and get a SBV file with the same lines and timing.",
    troubleshooting: [
      { problem: "Styling or positioning is lost.", solution: "Plain timing and text always carry across. SBV and the plain formats do not carry ASS styling (fonts, colors, positioning), so only the text and timing convert." },
    ],
  },
  "ass-to-sbv": {
    whyConvert:
      "Both ASS and SBV are subtitle formats; this re-times the cues from one into the other through a shared cue model, so the text and timing carry across exactly. Useful when a player, editor, or platform only accepts SBV. Runs in your browser, nothing is uploaded.",
    example:
      "You have ASS captions but your tool needs SBV. Drop the ASS here and get a SBV file with the same lines and timing.",
    troubleshooting: [
      { problem: "Styling or positioning is lost.", solution: "Plain timing and text always carry across. SBV and the plain formats do not carry ASS styling (fonts, colors, positioning), so only the text and timing convert." },
    ],
  },
  "sbv-to-vtt": {
    whyConvert:
      "Both SBV and VTT are subtitle formats; this re-times the cues from one into the other through a shared cue model, so the text and timing carry across exactly. Useful when a player, editor, or platform only accepts VTT. Runs in your browser, nothing is uploaded.",
    example:
      "You have SBV captions but your tool needs VTT. Drop the SBV here and get a VTT file with the same lines and timing.",
    troubleshooting: [
      { problem: "Styling or positioning is lost.", solution: "Plain timing and text always carry across. SBV and the plain formats do not carry ASS styling (fonts, colors, positioning), so only the text and timing convert." },
    ],
  },
  "sbv-to-ass": {
    whyConvert:
      "Both SBV and ASS are subtitle formats; this re-times the cues from one into the other through a shared cue model, so the text and timing carry across exactly. Useful when a player, editor, or platform only accepts ASS. Runs in your browser, nothing is uploaded.",
    example:
      "You have SBV captions but your tool needs ASS. Drop the SBV here and get a ASS file with the same lines and timing.",
    troubleshooting: [
      { problem: "Styling or positioning is lost.", solution: "Plain timing and text always carry across. ASS styling tags are added with defaults since SBV/plain formats do not carry them." },
    ],
  },
  "svg-to-webp": {
    whyConvert:
      "WebP is the modern web image format: 25 to 35 percent smaller than PNG or JPEG at the same quality, with alpha transparency support. This converts SVG images to WebP entirely in your browser using the Canvas API, so the file never leaves your device. Transparency in the source is preserved.",
    example:
      "You have a SVG image and a tool, site, or workflow that needs WebP. Drop the SVG here and download the WebP in one step, no upload.",
    troubleshooting: [
      { problem: "The WebP looks slightly different in an old browser.", solution: "WebP is supported in all current browsers; very old versions may not render it. The file itself is a standard lossy WebP at quality 0.9." },
    ],
  },
  "gif-to-webp": {
    whyConvert:
      "WebP is the modern web image format: 25 to 35 percent smaller than PNG or JPEG at the same quality, with alpha transparency support. This converts GIF images to WebP entirely in your browser using the Canvas API, so the file never leaves your device. Transparency in the source is preserved.",
    example:
      "You have a GIF image and a tool, site, or workflow that needs WebP. Drop the GIF here and download the WebP in one step, no upload.",
    troubleshooting: [
      { problem: "The WebP looks slightly different in an old browser.", solution: "WebP is supported in all current browsers; very old versions may not render it. The file itself is a standard lossy WebP at quality 0.9." },
    ],
  },
  "bmp-to-webp": {
    whyConvert:
      "WebP is the modern web image format: 25 to 35 percent smaller than PNG or JPEG at the same quality, with alpha transparency support. This converts BMP images to WebP entirely in your browser using the Canvas API, so the file never leaves your device. Transparency in the source is preserved.",
    example:
      "You have a BMP image and a tool, site, or workflow that needs WebP. Drop the BMP here and download the WebP in one step, no upload.",
    troubleshooting: [
      { problem: "The WebP looks slightly different in an old browser.", solution: "WebP is supported in all current browsers; very old versions may not render it. The file itself is a standard lossy WebP at quality 0.9." },
    ],
  },
  "ico-to-webp": {
    whyConvert:
      "WebP is the modern web image format: 25 to 35 percent smaller than PNG or JPEG at the same quality, with alpha transparency support. This converts ICO images to WebP entirely in your browser using the Canvas API, so the file never leaves your device. Transparency in the source is preserved.",
    example:
      "You have a ICO image and a tool, site, or workflow that needs WebP. Drop the ICO here and download the WebP in one step, no upload.",
    troubleshooting: [
      { problem: "The WebP looks slightly different in an old browser.", solution: "WebP is supported in all current browsers; very old versions may not render it. The file itself is a standard lossy WebP at quality 0.9." },
    ],
  },
  "webp-to-gif": {
    whyConvert:
      "GIF is the universally supported format for simple graphics and the format many chat apps, forums, and legacy tools still require. This converts WebP images to GIF entirely in your browser using the Canvas API, so the file never leaves your device. Animated sources export their first frame as a static GIF.",
    example:
      "You have a WebP image and a tool, site, or workflow that needs GIF. Drop the WebP here and download the GIF in one step, no upload.",
    troubleshooting: [
      { problem: "My animated source only produced one frame.", solution: "Canvas reads a single frame, so animated GIF/WebP sources export the first frame as a static GIF. For animation-preserving conversion you need a frame-by-frame tool." },
    ],
  },
  "avif-to-gif": {
    whyConvert:
      "GIF is the universally supported format for simple graphics and the format many chat apps, forums, and legacy tools still require. This converts AVIF images to GIF entirely in your browser using the Canvas API, so the file never leaves your device. Animated sources export their first frame as a static GIF.",
    example:
      "You have a AVIF image and a tool, site, or workflow that needs GIF. Drop the AVIF here and download the GIF in one step, no upload.",
    troubleshooting: [
      { problem: "My animated source only produced one frame.", solution: "Canvas reads a single frame, so animated GIF/WebP sources export the first frame as a static GIF. For animation-preserving conversion you need a frame-by-frame tool." },
    ],
  },
  "bmp-to-gif": {
    whyConvert:
      "GIF is the universally supported format for simple graphics and the format many chat apps, forums, and legacy tools still require. This converts BMP images to GIF entirely in your browser using the Canvas API, so the file never leaves your device. Animated sources export their first frame as a static GIF.",
    example:
      "You have a BMP image and a tool, site, or workflow that needs GIF. Drop the BMP here and download the GIF in one step, no upload.",
    troubleshooting: [
      { problem: "My animated source only produced one frame.", solution: "Canvas reads a single frame, so animated GIF/WebP sources export the first frame as a static GIF. For animation-preserving conversion you need a frame-by-frame tool." },
    ],
  },
  "webp-to-bmp": {
    whyConvert:
      "BMP is the uncompressed bitmap format Windows tools, some scanners, and older software expect. This converts WebP images to BMP entirely in your browser using the Canvas API, so the file never leaves your device. Output is a standard uncompressed 24-bit bitmap.",
    example:
      "You have a WebP image and a tool, site, or workflow that needs BMP. Drop the WebP here and download the BMP in one step, no upload.",
    troubleshooting: [
      { problem: "The BMP file is large.", solution: "BMP is uncompressed by design, so it is much bigger than the source. If size matters, PNG (lossless, compressed) is usually the better target." },
    ],
  },
  "gif-to-bmp": {
    whyConvert:
      "BMP is the uncompressed bitmap format Windows tools, some scanners, and older software expect. This converts GIF images to BMP entirely in your browser using the Canvas API, so the file never leaves your device. Output is a standard uncompressed 24-bit bitmap.",
    example:
      "You have a GIF image and a tool, site, or workflow that needs BMP. Drop the GIF here and download the BMP in one step, no upload.",
    troubleshooting: [
      { problem: "The BMP file is large.", solution: "BMP is uncompressed by design, so it is much bigger than the source. If size matters, PNG (lossless, compressed) is usually the better target." },
    ],
  },
  "avif-to-bmp": {
    whyConvert:
      "BMP is the uncompressed bitmap format Windows tools, some scanners, and older software expect. This converts AVIF images to BMP entirely in your browser using the Canvas API, so the file never leaves your device. Output is a standard uncompressed 24-bit bitmap.",
    example:
      "You have a AVIF image and a tool, site, or workflow that needs BMP. Drop the AVIF here and download the BMP in one step, no upload.",
    troubleshooting: [
      { problem: "The BMP file is large.", solution: "BMP is uncompressed by design, so it is much bigger than the source. If size matters, PNG (lossless, compressed) is usually the better target." },
    ],
  },
};

export function getExtendedCopy(toolId: string): ExtendedCopy | undefined {
  return EXTENDED_COPY[toolId];
}
