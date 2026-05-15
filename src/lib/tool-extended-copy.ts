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
};

export function getExtendedCopy(toolId: string): ExtendedCopy | undefined {
  return EXTENDED_COPY[toolId];
}
