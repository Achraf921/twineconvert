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
};

export function getExtendedCopy(toolId: string): ExtendedCopy | undefined {
  return EXTENDED_COPY[toolId];
}
