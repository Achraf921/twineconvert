/**
 * Format metadata catalog.
 *
 * For every file format the engine touches as input or output, we have
 * a profile here with: human name, full-name expansion, technical
 * description, and "how to open" hints. These get reused across every
 * tool page that involves the format, so the same HEIC paragraph
 * appears on /heic-to-jpg, /heic-to-png, /heic-to-webp, /heic-to-pdf
 * without us writing it four times.
 *
 * Voice: specific, factual, no AI-slop fillers. State the actual
 * year/version/origin where possible. State limits honestly. No
 * "embark on your conversion journey" energy.
 */

export interface FormatProfile {
  /** Display name shown to the user, e.g. "HEIC", "PDF". */
  name: string;
  /** Long-form expansion, e.g. "High Efficiency Image Format". */
  fullName: string;
  /** "About" paragraph, 60-100 words, factual. Quote year/origin. */
  description: string;
  /** Practical "how do I open one?" guidance, 50-80 words, specific apps. */
  howToOpen: string;
  /** Single most common use case (one sentence). */
  primaryUse: string;
  /** True if the format is a binary container (vs plain text). */
  binary?: boolean;
}

const PROFILES: Record<string, FormatProfile> = {
  jpg: {
    name: "JPG",
    fullName: "Joint Photographic Experts Group",
    description:
      "JPG (also written JPEG) is the most widely used photo format on the web. The format dates to 1992 and uses lossy compression, discarding image detail in exchange for dramatically smaller files. It can't carry transparency. Modern alternatives like WebP and AVIF compress 25-50% better at the same visual quality, but JPG remains the universal compatibility default: every browser, OS, and image editor in existence reads it.",
    howToOpen:
      "Every operating system opens JPG natively, double-click on Windows, macOS, Linux, iOS, or Android and the system viewer launches. Browsers render JPGs inline. Image editors (Photoshop, GIMP, Affinity Photo, Pixelmator, Photopea in the browser) all read and write JPG.",
    primaryUse: "Photographs and any web image where transparency isn't needed.",
    binary: true,
  },
  jpeg: {
    name: "JPEG",
    fullName: "Joint Photographic Experts Group",
    description:
      "JPEG is the same format as JPG, different file extension, identical bytes. The .jpeg extension was the original; .jpg was adopted because early Windows versions limited extensions to 3 characters. Today the two are fully interchangeable.",
    howToOpen: "Identical to JPG, every modern OS, browser, and image editor opens .jpeg files without conversion.",
    primaryUse: "Photographs and web imagery (interchangeable with .jpg).",
    binary: true,
  },
  png: {
    name: "PNG",
    fullName: "Portable Network Graphics",
    description:
      "PNG is a lossless image format, the file size is larger than JPG, but every pixel is preserved exactly. It supports full transparency (alpha channel), which JPG cannot. Created in 1996 specifically as a patent-free replacement for GIF, PNG is the standard for screenshots, logos, icons, UI graphics, and any image that needs sharp text or transparent backgrounds.",
    howToOpen: "Universal support, every OS, browser, and image editor reads PNG. macOS Preview, Windows Photos, and any web browser open PNGs without any conversion step.",
    primaryUse: "Screenshots, logos, UI graphics, and any image needing transparency.",
    binary: true,
  },
  webp: {
    name: "WebP",
    fullName: "Web Picture",
    description:
      "WebP is Google's image format, designed in 2010 specifically for the web. It compresses 25-35% smaller than JPG at equivalent quality, supports transparency like PNG, and supports animation like GIF. Browser support is universal as of 2020 (Safari was the last holdout). The main reason most images aren't already WebP: legacy software (older Office versions, some email clients) doesn't open it.",
    howToOpen: "All modern browsers display WebP natively. Photoshop added native support in version 23 (2021); earlier versions need a plugin. macOS Preview reads WebP since macOS Monterey. On Windows, the Photos app supports it; older viewers may not.",
    primaryUse: "Modern web imagery where smaller files load faster.",
    binary: true,
  },
  heic: {
    name: "HEIC",
    fullName: "High Efficiency Image Container",
    description:
      "HEIC is the format your iPhone saves photos as by default since iOS 11 (2017). It's a container around HEVC-compressed image data, roughly half the file size of an equivalent JPEG with no visible quality loss. The catch is compatibility: most non-Apple software still can't open HEIC files without a plugin or conversion step, which is why most iPhone users end up converting them.",
    howToOpen: "macOS, iOS, and iPadOS open HEIC natively. Windows 10 and 11 require the (paid) HEIF Image Extensions from the Microsoft Store. Most browsers don't display HEIC inline. If you received a HEIC file and don't want to install codecs, converting to JPG is the standard fix.",
    primaryUse: "Photos taken on iPhone (the default format since 2017).",
    binary: true,
  },
  heif: {
    name: "HEIF",
    fullName: "High Efficiency Image Format",
    description:
      "HEIF is the parent specification; HEIC is the most common variant of HEIF (using HEVC for compression). For most practical purposes the .heif and .heic extensions refer to the same kind of file.",
    howToOpen: "Same compatibility profile as HEIC, Apple devices open it natively, Windows needs an extension, most browsers don't.",
    primaryUse: "iPhone photos; identical to HEIC for most users.",
    binary: true,
  },
  avif: {
    name: "AVIF",
    fullName: "AV1 Image File Format",
    description:
      "AVIF uses AV1 video codec compression for still images, typically 30-50% smaller than JPG and 20% smaller than WebP at the same visual quality. Supported in Chrome since 2020, Firefox since 2021, Safari since 16.4 (2023). The encoding step is significantly slower than JPG, which is why CDNs adopt it slowly. Best fit: hero images and photo galleries on modern sites where bandwidth matters.",
    howToOpen: "All current browsers (2024+) display AVIF inline. Native OS viewer support varies, Windows 11 supports it natively, macOS only since Ventura. Older photo editors may need a plugin.",
    primaryUse: "Modern web images where every kilobyte matters.",
    binary: true,
  },
  bmp: {
    name: "BMP",
    fullName: "Bitmap Image File",
    description:
      "BMP is Microsoft's original bitmap format from the late 1980s. It stores raw pixel data with minimal compression, which makes BMP files enormous (a 1080p screenshot is about 6 MB as BMP, 200 KB as PNG). The format remains common in Windows-internal contexts (clipboard, certain printer drivers, older industrial software) but is rarely chosen as a delivery format today.",
    howToOpen: "Universal, every OS, browser, and image editor reads BMP. The format is so old it predates compatibility concerns.",
    primaryUse: "Legacy Windows software, hardware drivers, certain industrial applications.",
    binary: true,
  },
  gif: {
    name: "GIF",
    fullName: "Graphics Interchange Format",
    description:
      "GIF dates to 1987 and is best known today for animated short clips. The format is limited to 256 colors per frame, which is why photographic GIFs look blotchy, but for low-color animations and reaction loops it's the universal compatibility format. For any animation longer than a few seconds, MP4 is dramatically smaller (often 10-20×) and every social platform converts uploaded GIFs to MP4 internally.",
    howToOpen: "Every browser and OS displays GIFs inline. Windows, macOS, iOS, Android, and Linux all open them by default with no extra software.",
    primaryUse: "Short animated loops; reaction images; legacy compatibility.",
    binary: true,
  },
  svg: {
    name: "SVG",
    fullName: "Scalable Vector Graphics",
    description:
      "SVG describes images as math (paths, shapes, fills) instead of pixels. The result scales to any size without losing sharpness, perfect for logos, icons, and UI graphics. SVG files are XML text, which means they can be edited in any text editor and styled with CSS. Browsers render SVG natively; for rasterized output (PNG/JPG) you can convert.",
    howToOpen: "Every browser displays SVG inline. Vector editors (Illustrator, Affinity Designer, Inkscape, Figma) edit them. Any text editor can open the underlying XML.",
    primaryUse: "Logos, icons, illustrations, and any graphic that needs to scale crisply.",
    binary: false,
  },
  tiff: {
    name: "TIFF",
    fullName: "Tagged Image File Format",
    description:
      "TIFF is the workhorse format for professional imaging, scanning, prepress, archival photography. It supports lossless compression, multiple pages per file, layered data, and 16-bit-per-channel color depth (vs 8-bit in JPG/PNG). Files are large; the tradeoff is fidelity. Most consumer software doesn't display TIFF in browsers, which is why archivists frequently convert to JPG or PDF for sharing.",
    howToOpen: "macOS Preview, Windows Photos, and most professional image editors (Photoshop, Capture One, Lightroom) read TIFF. Browsers generally do not display it inline; you'll need a viewer or to convert.",
    primaryUse: "Scanning, prepress, archival imagery, multi-page documents.",
    binary: true,
  },
  ico: {
    name: "ICO",
    fullName: "Icon",
    description:
      "ICO is Microsoft's icon format, a single file containing the same icon at multiple sizes (typically 16, 32, 48, 64, 128, 256 pixels). Browsers use the favicon at the top of every tab. Modern websites can use PNG favicons too, but ICO remains the universally-supported choice especially for older browsers and Windows desktop integration.",
    howToOpen: "Browsers and Windows recognize ICO natively. macOS treats them as standard images. Modern image editors read multi-resolution ICOs; some older tools only see the first size.",
    primaryUse: "Browser favicons and Windows desktop icons.",
    binary: true,
  },

  pdf: {
    name: "PDF",
    fullName: "Portable Document Format",
    description:
      "PDF is the universal document format for fixed-layout content, invoices, contracts, scanned documents, e-books, forms. Created by Adobe in 1993 and made an open ISO standard in 2008, PDF preserves exact layout, fonts, and images across every device. Files can be searchable text, scanned images, or both. Most modern PDFs include a text layer that copy/paste and search work against.",
    howToOpen: "Every modern browser opens PDFs natively. Acrobat Reader is free; macOS Preview, Windows Edge, and ChromeOS all open PDFs without extra software. For editing, Adobe Acrobat Pro or open-source PDFsam are common.",
    primaryUse: "Documents that need to look identical on every device.",
    binary: true,
  },
  docx: {
    name: "DOCX",
    fullName: "Microsoft Word Document",
    description:
      "DOCX is the file format Microsoft Word has used since 2007, a zip containing XML, images, and styles. It replaced the older binary .doc format and is now the de facto standard for editable documents. Google Docs, Apple Pages, and LibreOffice all read and write DOCX, though formatting fidelity varies for complex layouts (tables, embedded objects, custom styles).",
    howToOpen: "Microsoft Word (paid), Google Docs (free, web), Apple Pages (free, macOS/iOS), LibreOffice (free, all platforms), or any modern web-based editor like OnlyOffice.",
    primaryUse: "Editable text documents; the de facto office document standard.",
    binary: true,
  },
  doc: {
    name: "DOC",
    fullName: "Microsoft Word Document (legacy)",
    description:
      "DOC is the binary file format Microsoft Word used from 1997 to 2007. Since 2007, Word has saved as .docx by default, DOC is the older, less interoperable format. Modern Word and most other office suites still read .doc files for backward compatibility. Converting to DOCX or PDF is recommended for sharing.",
    howToOpen: "Microsoft Word (all versions), LibreOffice, Google Docs, Apple Pages. Compatibility with the legacy format is universal but cosmetic differences may appear.",
    primaryUse: "Legacy Word documents from before 2007.",
    binary: true,
  },
  xlsx: {
    name: "XLSX",
    fullName: "Microsoft Excel Spreadsheet",
    description:
      "XLSX is the spreadsheet format Excel has used since 2007, like DOCX, it's a zip containing XML for cells, formulas, formatting, and embedded objects. Replaces the older binary .xls format. Read and written by Excel, Google Sheets, Apple Numbers, and LibreOffice Calc, with high fidelity for standard cell data and reasonable fidelity for complex formulas and pivot tables.",
    howToOpen: "Microsoft Excel, Google Sheets, Apple Numbers, LibreOffice Calc. CSV is a more portable format if you only need the raw cell values.",
    primaryUse: "Spreadsheets with formulas, formatting, multiple sheets.",
    binary: true,
  },
  csv: {
    name: "CSV",
    fullName: "Comma-Separated Values",
    description:
      "CSV is plain text, one row per line, fields separated by commas. The simplest possible tabular data format, which is exactly why it remains the most portable: every spreadsheet, database, programming language, and analytics tool reads CSV. Tradeoffs: no formulas, no formatting, no multiple sheets, and various edge cases around quoting fields that contain commas or newlines.",
    howToOpen: "Excel, Google Sheets, Apple Numbers, LibreOffice Calc, any text editor, every database import wizard, every programming language with one line of code.",
    primaryUse: "Universal tabular data interchange.",
    binary: false,
  },
  json: {
    name: "JSON",
    fullName: "JavaScript Object Notation",
    description:
      "JSON is a lightweight text format for structured data, nested objects, arrays, strings, numbers, booleans. It's the lingua franca of web APIs, configuration files, and data interchange between programs. Human-readable when formatted, machine-parseable in every programming language, and roughly half the size of equivalent XML.",
    howToOpen: "Any text editor reads JSON. Browsers display .json files in a formatted tree view. VS Code and similar editors highlight syntax.",
    primaryUse: "API responses, configuration files, structured data interchange.",
    binary: false,
  },

  // Audio
  mp3: {
    name: "MP3",
    fullName: "MPEG Audio Layer III",
    description:
      "MP3 is the most widely-supported audio format ever, every device, app, and music player on the planet reads it. It uses lossy compression (typically removing audio frequencies humans can't hear well) to shrink files to about a tenth of their uncompressed size. At 192 kbps and above, the difference vs lossless is inaudible to most listeners on most equipment.",
    howToOpen: "Every audio player ever made. iOS Music, Android, VLC, iTunes, Windows Media Player, browsers, smart speakers, universal.",
    primaryUse: "Music files, podcasts, audiobooks, voice recordings.",
    binary: true,
  },
  wav: {
    name: "WAV",
    fullName: "Waveform Audio File",
    description:
      "WAV is uncompressed audio, every sample stored as raw PCM data. Developed by IBM and Microsoft in 1991 as the standard for Windows audio. Files are 10× larger than MP3 but bit-perfect, which is why audio engineers and music producers work in WAV during editing and switch to MP3/AAC only for final delivery.",
    howToOpen: "Universal compatibility, every audio player, DAW (Logic, Pro Tools, Ableton, FL Studio, Reaper), and editing tool reads WAV.",
    primaryUse: "Audio editing, mastering, archival. Anywhere you need bit-perfect sound.",
    binary: true,
  },
  m4a: {
    name: "M4A",
    fullName: "MPEG-4 Audio",
    description:
      "M4A is AAC-encoded audio inside an MP4 container, Apple's preferred audio format. Higher quality than MP3 at the same bitrate (AAC is a generation newer than MP3). All Apple devices use it natively; iTunes/Apple Music ripped CDs as M4A by default. Compatibility on non-Apple devices has improved dramatically, most modern Android and Windows players read M4A directly.",
    howToOpen: "All Apple devices, modern Android/Windows players, VLC, browsers (HTML5 audio). Older feature phones and some car stereos may need MP3 instead.",
    primaryUse: "Higher-quality audio than MP3, especially in Apple ecosystems.",
    binary: true,
  },
  flac: {
    name: "FLAC",
    fullName: "Free Lossless Audio Codec",
    description:
      "FLAC is lossless compression, about half the size of WAV with bit-perfect audio (no quality lost). The audiophile and archive standard since 2001. Files are larger than MP3 (typically 4-5× depending on source) but the trade is no degradation, ever. Streaming services like Tidal, Qobuz, and Apple Music's lossless tier deliver FLAC.",
    howToOpen: "VLC, foobar2000, Audacity, every modern music player, native iOS support since 2017, native Android support since version 3. Older Apple devices need a third-party app.",
    primaryUse: "Archival music, audiophile listening, lossless streaming.",
    binary: true,
  },
  ogg: {
    name: "OGG",
    fullName: "Ogg Vorbis",
    description:
      "OGG is an open-source audio container, most commonly carrying Vorbis-encoded audio (similar quality to MP3 but patent-free at the time of its creation). Used heavily in open-source software, video games (Spotify shipped OGG Vorbis for years), and Linux audio. Less universal than MP3, older iPods and some legacy hardware don't read it.",
    howToOpen: "VLC, foobar2000, every modern web browser (HTML5 audio), most Android players, Audacity. Apple devices typically need a third-party app.",
    primaryUse: "Open-source audio, game audio assets, web audio.",
    binary: true,
  },

  // Video
  mp4: {
    name: "MP4",
    fullName: "MPEG-4 Part 14",
    description:
      "MP4 is the dominant video container on the web, H.264 video plus AAC audio, in a structure designed for streaming. Every browser, mobile device, smart TV, and editing tool reads MP4. The format is technically a container (not a codec), so two MP4 files can have very different internal codecs, but the H.264+AAC default is what enables universal playback.",
    howToOpen: "Every video player on the planet, VLC, QuickTime, Windows Media Player, browsers (HTML5 video), iOS, Android, smart TVs, game consoles. Universal.",
    primaryUse: "Web video, mobile video recording, video sharing.",
    binary: true,
  },
  mov: {
    name: "MOV",
    fullName: "QuickTime Movie",
    description:
      "MOV is Apple's QuickTime container, used by macOS and iOS for screen recordings and the iPhone Camera app. Structurally very similar to MP4, the two formats share most of the same internal codecs (H.264, HEVC) and can usually be losslessly remuxed between each other without re-encoding. Universal compatibility, slightly favored on Apple platforms.",
    howToOpen: "QuickTime Player (macOS), every modern video player. Some older Windows software may not handle the QuickTime container, converting to MP4 fixes it without quality loss.",
    primaryUse: "iPhone screen recordings, Apple ecosystem video.",
    binary: true,
  },
  webm: {
    name: "WebM",
    fullName: "WebM",
    description:
      "WebM is Google's open-source video container, designed for web streaming. Uses VP8/VP9 video and Vorbis/Opus audio. About 25-35% smaller than equivalent H.264 MP4 at the same quality. Universal browser support; less common on standalone media players and older hardware.",
    howToOpen: "All modern web browsers, VLC, MPV. Some smart TVs and older players don't recognize WebM, converting to MP4 is the standard fix.",
    primaryUse: "Web video where smaller file size matters more than universal playback.",
    binary: true,
  },
  avi: {
    name: "AVI",
    fullName: "Audio Video Interleave",
    description:
      "AVI is Microsoft's video container from 1992, a workhorse for older Windows software, security camera systems, and legacy editing workflows. The format itself is durable but inefficient compared to MP4: same content takes 2-3× more disk space. Modern video software reads AVI but rarely writes it; converting old AVI archives to MP4 is the standard modernization path.",
    howToOpen: "VLC, every video player, every video editor. Smart TVs and mobile devices may struggle, convert to MP4 if you want to play AVI on a TV.",
    primaryUse: "Legacy video, security camera footage, older Windows workflows.",
    binary: true,
  },
  mkv: {
    name: "MKV",
    fullName: "Matroska Video",
    description:
      "MKV is an open-source container that holds essentially any video/audio codec combination plus subtitles, chapters, and metadata. The format of choice for high-quality video archives, fan-subtitled content, and anything that benefits from multiple audio tracks. The catch: not every player supports it, and converting MKV to MP4 is the standard fix for the won't-play-on-my-TV problem.",
    howToOpen: "VLC reads everything MKV. Plex and Kodi handle MKV libraries. Browsers and many TVs do not, converting to MP4 makes MKV content universally playable.",
    primaryUse: "High-quality video archives with multiple audio/subtitle tracks.",
    binary: true,
  },

  // Sundry niche / professional formats, abbreviated descriptions for ones
  // that appear less frequently as paired formats on tool pages.
  ofx: {
    name: "OFX",
    fullName: "Open Financial Exchange",
    description:
      "OFX is the standard file format banks use to export account history. Created in 1997 by Microsoft, Intuit, and CheckFree, it carries transactions, balances, and account metadata in XML. Quicken, GnuCash, Tiller, Money in Excel, and most personal-finance apps import OFX directly.",
    howToOpen: "Quicken, GnuCash, Moneydance, Tiller, most accounting software. Plain-text editors can view the XML structure.",
    primaryUse: "Bank statements imported into personal-finance software.",
    binary: false,
  },
  qfx: {
    name: "QFX",
    fullName: "Quicken Financial Exchange",
    description:
      "QFX is Intuit's variant of OFX with extra Intuit-specific tags (INTU.BID, INTU.USERID). Identical to OFX in transaction structure. Used by Quicken, files marked .qfx are typically what you download from your bank for Quicken specifically.",
    howToOpen: "Quicken (paid), or rename to .ofx and use any OFX-compatible app.",
    primaryUse: "Quicken-specific bank statement imports.",
    binary: false,
  },
  qbo: {
    name: "QBO",
    fullName: "QuickBooks Web Connect",
    description:
      "QBO is QuickBooks's variant of OFX 2.x. Same transaction structure as OFX, with QuickBooks-specific header. Used to import bank statements into QuickBooks Desktop or Online.",
    howToOpen: "QuickBooks (paid). Convert to CSV/OFX for use in other accounting software.",
    primaryUse: "Bank statement import for QuickBooks users.",
    binary: false,
  },
  qif: {
    name: "QIF",
    fullName: "Quicken Interchange Format",
    description:
      "QIF is the original Quicken text format, predating OFX. Single-letter field codes (D for date, T for amount, P for payee). Still used by older Quicken builds, GnuCash, and many international banks that haven't moved to OFX.",
    howToOpen: "Quicken, GnuCash, MoneyDance, AceMoney. Plain text editors.",
    primaryUse: "Legacy Quicken files; international bank exports.",
    binary: false,
  },
  epub: {
    name: "EPUB",
    fullName: "Electronic Publication",
    description:
      "EPUB is the open-standard ebook format used by every major reader except Kindle. Files are zips containing reflowable HTML, CSS, and metadata, text adapts to any screen size. EPUB 3 added audio, video, and interactive elements but most ebooks still ship as EPUB 2 for compatibility.",
    howToOpen: "Apple Books, Calibre, Adobe Digital Editions, Google Play Books, Kobo readers, Nook, most e-readers except Kindle.",
    primaryUse: "Ebooks across non-Kindle readers.",
    binary: true,
  },

  // ==================== Bibliography ====================
  bibtex: {
    name: "BibTeX",
    fullName: "BibTeX bibliography",
    description:
      "BibTeX is the de facto bibliography format for LaTeX since 1985, plain-text entries like @article{key, author={...}, title={...}, journal={...}, year={2024}}. Used by every academic publisher's LaTeX template and supported as an import/export format by Zotero, Mendeley, EndNote, and Papers. Strengths: trivially diff-able in git, scriptable, tooling-rich. Weakness: there's no single canonical spec, so different parsers handle edge cases (special characters, cross-references, @string macros) inconsistently.",
    howToOpen: "Any text editor (the format is plain text). Reference managers like Zotero, Mendeley, JabRef, BibDesk all read and write it natively.",
    primaryUse: "Academic citations in LaTeX papers; reference-manager export.",
    binary: false,
  },
  ris: {
    name: "RIS",
    fullName: "Research Information Systems",
    description:
      "RIS is a tagged citation format from Research Information Systems (the Reference Manager company), now an industry-standard interchange. Two-letter tags (TY=type, AU=author, TI=title, JO=journal, etc.), one per line, records terminated by ER. Most academic databases (PubMed, Web of Science, JSTOR, Scopus) export to RIS. Reference managers all import and export it.",
    howToOpen: "Zotero, Mendeley, EndNote, Papers, RefWorks, Citavi, every modern reference manager. Plain text in any editor.",
    primaryUse: "Citation interchange between databases and reference managers.",
    binary: false,
  },
  nbib: {
    name: "NBIB",
    fullName: "PubMed citation format",
    description:
      "NBIB is the National Library of Medicine's citation format for PubMed exports. Structurally identical to RIS with a different tag dictionary (PMID, FAU, JT, AID instead of ID, AU, JO, DO). Reference managers treat .nbib files as RIS-flavored with PubMed-specific extensions. The format ships with PubMed downloads and the major systematic-review tools (Covidence, Rayyan).",
    howToOpen: "Zotero, Mendeley, EndNote, Papers, all read NBIB natively. Plain text in any editor.",
    primaryUse: "PubMed citation export; systematic review imports.",
    binary: false,
  },
  "endnote-xml": {
    name: "EndNote XML",
    fullName: "EndNote XML export",
    description:
      "EndNote XML is the structured XML format used by EndNote (Clarivate's reference manager) for backups and interchange. Each <record> wraps contributors, titles, dates, and identifiers with explicit semantic tagging, much richer than RIS or BibTeX. Useful when you want to preserve EndNote's full data model (custom fields, attached files, ratings).",
    howToOpen: "EndNote (paid). Zotero and Mendeley import EndNote XML cleanly. Any text editor for inspection.",
    primaryUse: "EndNote backup; cross-platform reference-manager migration.",
    binary: false,
  },

  // ==================== Genealogy ====================
  gedcom: {
    name: "GEDCOM",
    fullName: "Genealogical Data Communication",
    description:
      "GEDCOM is the universal interchange format for family-tree data. The current spec is GEDCOM 7.0 (2021) but most genealogy software still emits GEDCOM 5.5.1 (2019) for compatibility. Plain-text hierarchical records: 0-level lines define individuals (INDI) and families (FAM); deeper levels (1, 2, 3...) attach attributes like names, dates, and places. Every major genealogy app reads and writes GEDCOM.",
    howToOpen: "Ancestry, MyHeritage, FamilySearch, RootsMagic, Family Tree Maker, Gramps, MacFamilyTree. Plain text in any editor.",
    primaryUse: "Family tree interchange between genealogy programs.",
    binary: false,
  },

  // ==================== Amateur radio ====================
  adif: {
    name: "ADIF",
    fullName: "Amateur Data Interchange Format",
    description:
      "ADIF is THE universal interchange for ham radio QSO logs since 1996, every logging app from N1MM Logger to ACLog to fldigi to WSJT-X to Log4OM exports and imports it. Format is tag-length-value: <CALL:5>K1ABC, then <EOR> between contacts. The current spec is ADIF 3.1.4 with ADIF 3.2 in development.",
    howToOpen: "All ham radio logging software. eQSL.cc, LoTW (ARRL), QRZ.com, Club Log all import ADIF for verifying contacts.",
    primaryUse: "Logbook interchange between ham radio software.",
    binary: false,
  },
  cabrillo: {
    name: "Cabrillo",
    fullName: "Cabrillo contest log",
    description:
      "Cabrillo is the contest-log submission format used by ARRL, CQ World Wide, RDXC, and other major amateur radio contests. Each QSO is a fixed-format line beginning with QSO:, followed by header lines declaring CALLSIGN, CONTEST, CATEGORY-* metadata. Contest organizers' robots parse Cabrillo logs to score and cross-check thousands of submissions automatically.",
    howToOpen: "All ham radio contest logging software (N1MM Logger+, WriteLog, TRLog) writes Cabrillo. Plain text, any editor opens it for review.",
    primaryUse: "Contest log submission to ARRL/CQ/RDXC scoring committees.",
    binary: false,
  },

  // ==================== Chess ====================
  pgn: {
    name: "PGN",
    fullName: "Portable Game Notation",
    description:
      "PGN is the universal text format for chess games, every chess engine, every chess server (chess.com, lichess), every analysis tool reads it. A PGN file is a sequence of game blocks; each block has 7-tag headers (Event, Site, Date, Round, White, Black, Result) followed by the moves in algebraic notation. A single PGN file can contain thousands of games.",
    howToOpen: "chess.com, lichess.org (paste it into the analysis board), ChessBase, Scid, every chess engine. Plain text in any editor.",
    primaryUse: "Sharing and analyzing chess games.",
    binary: false,
  },
  fen: {
    name: "FEN",
    fullName: "Forsyth–Edwards Notation",
    description:
      "FEN is a single-line text representation of one chess position, piece placement, side to move, castling rights, en passant target, halfmove clock, and fullmove number. Used by chess engines for position analysis, by chess servers for sharing puzzles, and by GUIs for board setup. Unlike PGN (which represents a game), FEN represents a single static position.",
    howToOpen: "Any chess engine, GUI, or website's analysis board. Just paste the FEN string.",
    primaryUse: "Sharing chess positions for analysis.",
    binary: false,
  },

  // ==================== BIM / Architecture ====================
  ifc: {
    name: "IFC",
    fullName: "Industry Foundation Classes",
    description:
      "IFC is the open BIM (Building Information Modeling) interchange standard maintained by buildingSMART. Used by every major AEC software, Revit, ArchiCAD, AutoCAD, Tekla, Bentley, to exchange architectural and structural model data. The format is text-based STEP (ISO 10303), verbose but human-readable. The current spec is IFC 4.3 (released 2024).",
    howToOpen: "Revit, ArchiCAD, AutoCAD, Tekla, Bentley OpenBuildings. Free viewers: BIMcollab Zoom, IFC++, BIMVision, Solibri Anywhere.",
    primaryUse: "Architectural/structural BIM model interchange between disciplines.",
    binary: false,
  },
  gltf: {
    name: "glTF",
    fullName: "GL Transmission Format",
    description:
      "glTF (\"the JPEG of 3D\") is the runtime asset format for 3D scenes, designed by Khronos for fast loading in web/AR/VR applications. Two flavors: .gltf (JSON + external textures) and .glb (binary, single-file, what we produce here). Native viewer support in macOS/iOS Quick Look, Windows 3D Viewer, every modern browser via three.js or babylon.js.",
    howToOpen: "macOS / iOS Quick Look, Windows 3D Viewer, every WebGL/WebGPU 3D viewer (Three.js, Babylon.js), Blender (with importer), every game engine.",
    primaryUse: "3D model delivery to web/AR/VR/game engines.",
    binary: true,
  },

  // ==================== 3D mesh ====================
  stl: {
    name: "STL",
    fullName: "Stereolithography",
    description:
      "STL is the lingua franca of 3D printing, every slicer (PrusaSlicer, Bambu Studio, Cura, Simplify3D) reads it. Files are unstructured triangle soup: no scene graph, no materials, no scale info, just vertices and triangles. The format is ancient (1987) and primitive but its simplicity is exactly why it's universal. Two variants: ASCII (human-readable, big) and binary (compact, what most software produces).",
    howToOpen: "Every 3D printing slicer, every CAD/3D tool (Blender, FreeCAD, Fusion 360, SolidWorks, Tinkercad). Free viewers: ViewSTL, MeshLab, online STL viewers.",
    primaryUse: "3D printing, feed an STL into your slicer to get G-code.",
    binary: true,
  },
  obj: {
    name: "OBJ",
    fullName: "Wavefront Object",
    description:
      "OBJ is Wavefront's text-based 3D mesh format from 1990, the most-used asset interchange in computer graphics for decades. Plain text: \"v\" lines for vertices, \"f\" for faces, \"vn\" for normals, \"vt\" for texture coordinates. Optional companion .mtl file describes materials. Universal compatibility across 3D software but lacks newer features like PBR materials, animations, and skeletons.",
    howToOpen: "Blender, Maya, 3ds Max, Cinema 4D, ZBrush, Modo, MeshLab, every 3D software ever. Plain text in any editor.",
    primaryUse: "3D mesh interchange between modeling/rendering applications.",
    binary: false,
  },
  "3mf": {
    name: "3MF",
    fullName: "3D Manufacturing Format",
    description:
      "3MF is the modern successor to STL, designed by the 3MF Consortium (Microsoft, HP, Autodesk, Bambu Lab, Prusa, Ultimaker). Zip-packaged XML carries mesh geometry, materials, color info, slicer settings, and multi-object scenes, everything STL lacks. Bambu Lab and Prusa have adopted 3MF as their preferred format; many MakerWorld and Printables downloads now ship as 3MF only.",
    howToOpen: "PrusaSlicer, Bambu Studio, OrcaSlicer, Cura, Simplify3D, all modern slicers. Microsoft 3D Viewer (Windows), Apple Preview (macOS Sonoma+).",
    primaryUse: "3D printing with full color/material/multi-object scene data.",
    binary: true,
  },

  // ==================== Color palettes ====================
  ase: {
    name: "ASE",
    fullName: "Adobe Swatch Exchange",
    description:
      "ASE is Adobe's binary palette format used across Creative Cloud (Photoshop, Illustrator, InDesign). Each entry stores RGB/CMYK/Lab/Grayscale color values plus a name. Designed for sharing brand color systems between team members, load an ASE in Photoshop and the swatches appear in your Swatches panel.",
    howToOpen: "Photoshop, Illustrator, InDesign, Affinity apps, Krita, GIMP (with plugin), Procreate.",
    primaryUse: "Brand color systems shared across Adobe Creative Cloud teams.",
    binary: true,
  },
  aco: {
    name: "ACO",
    fullName: "Adobe Color",
    description:
      "ACO is Photoshop's older binary color palette format (predates ASE). Two versions exist: v1 (color values only) and v2 (adds names). Most contemporary Photoshop users have moved to ASE for cross-Adobe-app compatibility, but ACO remains the format you get when Photoshop's swatch panel exports.",
    howToOpen: "Photoshop natively. Krita, GIMP (with plugin), Affinity Photo. Convert to ASE for Illustrator/InDesign use.",
    primaryUse: "Photoshop swatch panel exports.",
    binary: true,
  },
  gpl: {
    name: "GPL",
    fullName: "GIMP Palette",
    description:
      "GPL is GIMP's plain-text palette format. Each line: R G B Name (R/G/B as 0-255 integers). Trivially diff-able, scriptable, and human-readable, which is why open-source design tools (Inkscape, Krita) and many web color tools support GPL natively even when they don't read ASE/ACO.",
    howToOpen: "GIMP, Inkscape, Krita, Aseprite, MyPaint. Plain text in any editor, generate or edit them programmatically.",
    primaryUse: "Color palette sharing in open-source design workflows.",
    binary: false,
  },

  // ==================== LUT (color grading) ====================
  cube: {
    name: "CUBE",
    fullName: "Adobe CUBE LUT",
    description:
      "CUBE is the Adobe / SpeedGrade color grading LUT format and the most widely supported 3D LUT format in video editing. Plain text: a header declares the grid size (LUT_3D_SIZE 17/33/65), then the body lists RGB triplets in R-major order. Every NLE and color grading tool reads CUBE, DaVinci Resolve, Premiere Pro, Final Cut Pro, FilmConvert.",
    howToOpen: "DaVinci Resolve, Premiere Pro, Final Cut Pro, Avid Media Composer, OBS Studio. Plain text in any editor.",
    primaryUse: "Video color grading, apply a film look or correction LUT.",
    binary: false,
  },
  "3dl": {
    name: "3DL",
    fullName: "Autodesk Lustre 3D LUT",
    description:
      "3DL is Autodesk Lustre's LUT format, also adopted by Quantel and several film post tools. Text-based: a coordinate ladder line declares the grid resolution, then RGB triplets in B-major (B varies fastest) order. Output values are integers in the declared bit depth (typically 10-bit, 0-1023). Common in film and high-end TV post workflows.",
    howToOpen: "DaVinci Resolve, Lustre, Quantel Genetic Engineering, FilmLight Baselight. Plain text in any editor.",
    primaryUse: "Film/post color grading LUT interchange.",
    binary: false,
  },
  csp: {
    name: "CSP",
    fullName: "Cinespace LUT",
    description:
      "CSP is the Cinespace (Rising Sun Research, now part of Autodesk) LUT format. Text-based with optional 1D preLUT blocks for separate per-channel curves before the 3D mapping, useful for combining tone curves with color grading in one file. Supported by DaVinci Resolve and Lustre.",
    howToOpen: "DaVinci Resolve, Lustre, Mistika. Plain text in any editor.",
    primaryUse: "Color grading workflows that need preLUT + 3D combined.",
    binary: false,
  },

  // ==================== Embroidery ====================
  dst: {
    name: "DST",
    fullName: "Tajima DST",
    description:
      "DST is Tajima's industrial embroidery file format and the most universally-supported design format on commercial machines. 512-byte header followed by 3-byte stitch records. Brother, Janome, Bernina, Singer, Husqvarna Viking, all read DST as a fallback even when their native format is different.",
    howToOpen: "Every commercial embroidery machine. Free viewers: Embird (paid), Embroidermodder (free), online embroidery viewers like StitchView.",
    primaryUse: "Universal embroidery design interchange.",
    binary: true,
  },
  pes: {
    name: "PES",
    fullName: "Brother Embroidery",
    description:
      "PES is Brother's native embroidery format, also used by Babylock and Bernina-XJ machines. The file embeds a PEC subsection containing the actual stitch data. PES is the format most embroidery design marketplaces (Etsy, Embroidery Library) ship with by default because Brother dominates the home/hobbyist market.",
    howToOpen: "Brother and Babylock home machines (PE Design software, Brother Embroidery Box). Free: Embroidermodder, online PES viewers.",
    primaryUse: "Brother home embroidery machine designs.",
    binary: true,
  },
  jef: {
    name: "JEF",
    fullName: "Janome Embroidery Format",
    description:
      "JEF is Janome's embroidery format (also Memorycraft, Elna). 116-byte header with thread color list, then 2-byte stitch deltas. Used by Janome Memorycraft 9700/11000/15000 series and Elna eXpressive machines.",
    howToOpen: "Janome Digitizer, Elna sewing software, Embird. Free: Embroidermodder.",
    primaryUse: "Janome and Elna embroidery machines.",
    binary: true,
  },
  exp: {
    name: "EXP",
    fullName: "Melco Expanded",
    description:
      "EXP is Melco's expanded embroidery format (also used by Bernina Artista). Simplest of the major formats: no header, just a stream of 2-byte stitch deltas with control codes for jumps, color changes, and end-of-design. Universal compatibility because of the format's simplicity.",
    howToOpen: "Melco DesignShop, Bernina Embroidery Software, Embird, Embroidermodder.",
    primaryUse: "Melco and Bernina industrial/professional embroidery.",
    binary: true,
  },

  // ==================== Music notation ====================
  midi: {
    name: "MIDI",
    fullName: "Musical Instrument Digital Interface",
    description:
      "MIDI files (.mid/.midi) carry note-on/note-off events plus tempo and instrument changes, not audio waveforms. Standardized in 1983 and unchanged in core. Every DAW (Logic, Ableton, FL Studio, Pro Tools, Reaper, GarageBand) reads and writes MIDI. Use it for: scoring, MIDI-controlled hardware (keyboards, drum machines), and the 1990s-era General MIDI ringtones.",
    howToOpen: "Every DAW (Logic, Ableton, FL Studio, Pro Tools, Reaper, GarageBand, Studio One). MuseScore for notation. VLC and QuickTime can play MIDI through software synth.",
    primaryUse: "Capturing musical performance as note events for editing/playback.",
    binary: true,
  },
  musicxml: {
    name: "MusicXML",
    fullName: "MusicXML notation",
    description:
      "MusicXML is the lingua franca of digital sheet music, XML schema designed by Recordare (now MakeMusic, makers of Finale). Carries staves, notes, articulations, dynamics, lyrics, and layout in a way that survives transfer between notation programs (Finale, Sibelius, Dorico, MuseScore). Most digital sheet music sites (musicnotes.com, sheetmusicplus.com) sell MusicXML alongside PDF.",
    howToOpen: "Finale, Sibelius, Dorico, MuseScore, Notion, StaffPad, every modern notation app. Plain XML in any editor.",
    primaryUse: "Sheet music interchange between notation programs.",
    binary: false,
  },
  mxl: {
    name: "MXL",
    fullName: "Compressed MusicXML",
    description:
      "MXL is the compressed (zipped) variant of MusicXML, a zip containing the inner XML score plus a META-INF/container.xml manifest pointing at it. Most digital sheet music ships as MXL because it's typically 70-80% smaller than the uncompressed MusicXML. Every notation app that reads MusicXML reads MXL.",
    howToOpen: "Same as MusicXML, Finale, Sibelius, Dorico, MuseScore, Notion all read MXL natively.",
    primaryUse: "Compressed sheet music distribution.",
    binary: true,
  },

  // ==================== Apple iWork ====================
  pages: {
    name: "Pages",
    fullName: "Apple Pages document",
    description:
      "Pages is Apple's word processor (the macOS/iOS counterpart to Word). Files are zip-packaged with proprietary iWork XML inside, not OOXML, not openable outside Apple's ecosystem without conversion. macOS/iOS Quick Look shows a thumbnail; reading the actual content on Windows/Linux requires either iCloud Pages (web) or converting to PDF/DOCX first.",
    howToOpen: "Pages on macOS/iOS (free with any Apple device since 2013). iCloud.com Pages on any browser. Convert to PDF or DOCX for Windows/Linux compatibility.",
    primaryUse: "Word processing on Mac/iPad/iPhone.",
    binary: true,
  },
  numbers: {
    name: "Numbers",
    fullName: "Apple Numbers spreadsheet",
    description:
      "Numbers is Apple's spreadsheet app, paired with Pages and Keynote in iWork. Files are zip-packaged proprietary iWork XML. Core functionality overlaps with Excel but Numbers favors free-form layout (multiple tables per sheet, embedded charts, design templates) over Excel's grid-everywhere convention. Same compatibility caveats as Pages, convert to XLSX/CSV for non-Apple use.",
    howToOpen: "Numbers on macOS/iOS, iCloud.com Numbers in any browser. Convert to XLSX or CSV for Excel/Google Sheets users.",
    primaryUse: "Spreadsheets on Mac/iPad/iPhone.",
    binary: true,
  },
  keynote: {
    name: "Keynote",
    fullName: "Apple Keynote presentation",
    description:
      "Keynote is Apple's presentation app, the iWork answer to PowerPoint. Files are zip-packaged proprietary iWork XML. Keynote is widely admired for its motion design (Magic Move transitions, smooth Cinema-style animations) but lockstep Apple-only. Convert to PPTX or PDF for sharing with Windows/Google Slides users.",
    howToOpen: "Keynote on macOS/iOS, iCloud.com Keynote in browser. Convert to PPTX or PDF for non-Apple recipients.",
    primaryUse: "Presentations on Mac/iPad/iPhone.",
    binary: true,
  },

  // ==================== Personal data exports ====================
  "kindle-clippings": {
    name: "Kindle Clippings",
    fullName: "Kindle My Clippings.txt",
    description:
      "My Clippings.txt is the file every Kindle device maintains internally, a plain-text log of every highlight, note, and bookmark you've made across all your books. Plug your Kindle into a computer via USB and it appears in /documents/My Clippings.txt. The format is line-based with == separators; great for archiving your reading history into Notion, Obsidian, Readwise, or any markdown system.",
    howToOpen: "Plain text, open in any text editor. The file is machine-readable, which is why people convert it into structured formats (CSV, Markdown, Notion-compatible CSV) for import into knowledge-management tools.",
    primaryUse: "Archiving Kindle highlights for personal knowledge management.",
    binary: false,
  },
  "whatsapp-chat": {
    name: "WhatsApp Chat",
    fullName: "WhatsApp chat export",
    description:
      "WhatsApp lets users export individual chats as either a .txt transcript or a .zip containing the txt plus all the referenced media. Used for: archiving conversations before switching phones, court evidence (a chat transcript is increasingly admissible), and personal record-keeping. The format is line-per-message: \"[date, time] sender: message\" on iOS or \"date, time - sender: message\" on Android.",
    howToOpen: "Plain text in any editor. The .zip needs unzipping first; inside is the txt + media files. Convert to PDF for paginated archiving or CSV/JSON for structured analysis.",
    primaryUse: "Archiving personal chat history before phone migration or for legal records.",
    binary: false,
  },
  "discord-chat": {
    name: "Discord Export",
    fullName: "DiscordChatExporter JSON",
    description:
      "DiscordChatExporter (Tyrrrz) is the de facto tool for exporting Discord channel/server logs to JSON, HTML, CSV, or plain text. JSON output is the most data-rich, full message structure with author, timestamp, content, attachments, reactions, mentions, embeds. Used by community moderators, OSINT researchers (Bellingcat publishes a guide), and Discord server admins archiving before deletion.",
    howToOpen: "DiscordChatExporter for fresh exports. JSON files open in any editor; for human reading, convert to Markdown, PDF, or rendered HTML.",
    primaryUse: "Community moderation logs; OSINT investigations; archival of Discord servers.",
    binary: false,
  },
  "twitter-archive": {
    name: "Twitter Archive",
    fullName: "Twitter (X) data export",
    description:
      "Twitter's GDPR-compliant data export lets users download their entire account history as a zip, every tweet, DM, like, follow, ad interaction. The structure is JavaScript files (window.YTD.tweets.part0 = [...]) inside a data/ directory, with a manifest declaring which files contain what. Used heavily during the 2022-2023 X migration wave when users wanted a permanent record of their old tweets.",
    howToOpen: "Twitter's own browser-based archive viewer (open the included Your archive.html). Online tools like sk22.github.io/twitter-archive-browser. Convert to CSV for spreadsheet analysis.",
    primaryUse: "Personal record of Twitter activity; analysis of one's tweet history.",
    binary: false,
  },
  "instagram-data": {
    name: "Instagram Data",
    fullName: "Instagram data export",
    description:
      "Instagram's data export (downloadable from Settings → Privacy → Data Download) is a zip containing all your posts, stories, comments, messages, follower history, and ad preferences as JSON files. Structure has shifted across Meta's export-format versions but always uses /your_instagram_activity/ as the root directory.",
    howToOpen: "Plain JSON files, any text editor. Convert to CSV/HTML for human-friendly browsing of your post history.",
    primaryUse: "Personal record before account deletion; analysis of one's Instagram activity.",
    binary: false,
  },
  "facebook-archive": {
    name: "Facebook Archive",
    fullName: "Facebook data export",
    description:
      "Facebook's data export (Settings → Your Facebook Information → Download Your Information) lets users download an account's full history. Output is either an HTML browseable bundle or JSON. The JSON shape includes posts, photos, messages, ads-targeting categories, and friend relationships. Useful for migrating to other social platforms or maintaining a personal record.",
    howToOpen: "HTML version is browser-openable as a static site. JSON requires conversion to CSV/HTML for casual browsing.",
    primaryUse: "Personal record; account migration; data portability.",
    binary: false,
  },
  "apple-health": {
    name: "Apple Health Export",
    fullName: "Apple Health export.zip",
    description:
      "Apple Health on iOS lets users export their entire health/fitness history as export.zip, heart rate samples, step counts, sleep stages, workouts, blood pressure, every recorded metric. Inside the zip is one big export.xml file (often hundreds of megabytes for multi-year users) listing every Record element. Quantified-self enthusiasts, researchers, and healthcare providers all want this data in CSV/JSON for analysis.",
    howToOpen: "iOS Health app (where it originated). For analysis: convert export.xml to CSV/JSON and load into any spreadsheet/notebook (Excel, Pandas, R).",
    primaryUse: "Health data export for analysis, backup, or healthcare provider sharing.",
    binary: false,
  },
  "apple-health-heart-rate": {
    name: "Apple Health Heart Rate",
    fullName: "Apple Health heart rate records",
    description:
      "Heart rate readings from your Apple Watch (and iPhone, where applicable) live inside the Apple Health export. Each reading has a precise timestamp, a value in BPM, and the source device. Athletes use these for HRV analysis, doctors review them for arrhythmia screening, and quantified-self folks correlate them with sleep and stress data.",
    howToOpen: "iOS Health app shows them in the Heart Rate section. For analysis, extract from export.zip and load into a spreadsheet or analytics notebook.",
    primaryUse: "Heart rate trend analysis from Apple Watch data.",
    binary: false,
  },
  "apple-health-steps": {
    name: "Apple Health Steps",
    fullName: "Apple Health step counts",
    description:
      "Step-count records from iPhone's motion coprocessor and Apple Watch live in the Health export. Each entry has a time range, count, and source. Useful for rolling daily/weekly step trends, comparing across years, or feeding into a personal fitness dashboard.",
    howToOpen: "iOS Health app's Activity section. For analysis, extract from export.zip into CSV.",
    primaryUse: "Step trend analysis; personal fitness dashboards.",
    binary: false,
  },
  "apple-health-sleep": {
    name: "Apple Health Sleep",
    fullName: "Apple Health sleep stages",
    description:
      "Sleep stage records from Apple Watch (when worn overnight), Asleep, Awake, Core, Deep, REM stages, plus In Bed periods. The Watch's sleep tracking became reliable in watchOS 9 (2022); older watchOS sleep data is just in/out of bed without stages.",
    howToOpen: "iOS Health app's Sleep section. For analysis, extract sleep records from export.zip into CSV.",
    primaryUse: "Sleep quality analysis; correlating sleep with workouts/HRV.",
    binary: false,
  },
  "apple-health-workouts": {
    name: "Apple Health Workouts",
    fullName: "Apple Health workout history",
    description:
      "Workout records from Apple Watch, activity type (running, cycling, yoga, etc.), duration, distance, calories burned, average heart rate. Each workout shows up as a single Workout element in export.xml with totals plus an inner timeline of associated heart-rate Record entries.",
    howToOpen: "iOS Fitness app. For analysis, extract Workout entries from export.zip into CSV.",
    primaryUse: "Fitness history; training load analysis.",
    binary: false,
  },

  // ==================== Legal / B2B / Security ====================
  "pacer-docket": {
    name: "PACER Docket",
    fullName: "PACER federal court docket",
    description:
      "PACER (Public Access to Court Electronic Records) is the US federal courts' electronic filing system. Users can download case dockets as HTML pages, listing every filing, ruling, and order in chronological order. Paralegals, journalists, and legal researchers routinely scrape PACER dockets to build case timelines.",
    howToOpen: "PACER itself (paid per-page); after download, any browser opens the HTML. Convert to CSV for spreadsheet analysis or merging multiple dockets.",
    primaryUse: "Legal research; case timeline analysis.",
    binary: false,
  },
  sarif: {
    name: "SARIF",
    fullName: "Static Analysis Results Interchange Format",
    description:
      "SARIF is the OASIS-standardized JSON format for static analysis tool output. Every modern security/quality scanner, CodeQL, Semgrep, Bandit, ESLint, Snyk, Checkmarx, Sonar, exports SARIF. GitHub Code Scanning consumes SARIF natively for its security alerts UI. The format is verbose but well-typed, with rich location, fix-suggestion, and rule metadata.",
    howToOpen: "Microsoft's sarif-web-component (browser viewer), VS Code SARIF extension. GitHub renders SARIF natively in the Security tab. Convert to CSV/HTML for sharing scan results with non-engineering stakeholders.",
    primaryUse: "Static analysis result interchange between tools and review platforms.",
    binary: false,
  },
  edi: {
    name: "EDI X12",
    fullName: "ANSI ASC X12 EDI",
    description:
      "EDI X12 is the dominant electronic-data-interchange standard in North American B2B commerce, purchase orders (850), invoices (810), ship notices (856), payment remittances (820). Used by Walmart, Amazon, Target, every large retailer's supply chain. Plain text with delimiter conventions declared in the ISA header.",
    howToOpen: "Specialized EDI software (Stedi, Cleo, OpenText). For analysis or debugging: convert segments to CSV for spreadsheet review.",
    primaryUse: "B2B supply-chain transactions in North American retail.",
    binary: false,
  },
  edifact: {
    name: "EDIFACT",
    fullName: "UN/EDIFACT",
    description:
      "EDIFACT is the UN-standardized EDI format used in European and global supply chains (the international counterpart to ANSI X12). Same idea, segment-based plain text with declared delimiters in the UNB envelope, different message types (ORDERS, INVOIC, DESADV, PAYORD).",
    howToOpen: "Specialized EDI integration platforms. Convert to CSV for human-friendly review.",
    primaryUse: "B2B logistics, retail, and customs filings outside North America.",
    binary: false,
  },

  // ==================== Email ====================
  eml: {
    name: "EML",
    fullName: "RFC 822 email message",
    description:
      "EML is the IETF-standard email message format (.eml extension), plain-text headers (From, To, Subject, Date), a blank line, then the body. MIME multipart structure handles HTML email bodies and attachments. Most email clients (Outlook, Apple Mail, Thunderbird) save individual messages as EML when you drag them out of the inbox.",
    howToOpen: "Outlook, Apple Mail, Thunderbird, Gmail's web import. Plain text in any editor for header inspection.",
    primaryUse: "Email message archiving and forensic preservation.",
    binary: false,
  },
  mbox: {
    name: "MBOX",
    fullName: "Unix mbox mailbox",
    description:
      "MBOX is the Unix tradition for mailbox storage, a plain-text file containing many email messages back-to-back, separated by lines beginning with \"From \" (with trailing space). Used by Thunderbird, Apple Mail, Postfix, and as the export format from Gmail's Takeout service. Files for power users with years of mail can hit gigabytes.",
    howToOpen: "Thunderbird (drop into a folder), Apple Mail (Import Mailboxes), Mozilla SeaMonkey, mutt. Convert to PDF for archival or single EMLs for individual message work.",
    primaryUse: "Mass email archival; Gmail Takeout exports; long-term mail backups.",
    binary: false,
  },

  // ==================== Generic text formats ====================
  txt: {
    name: "TXT",
    fullName: "Plain text",
    description:
      "Plain text, the simplest data format. No formatting, no metadata, just characters. Universal compatibility across every device and program ever made. UTF-8 encoding has been the de facto default for over a decade.",
    howToOpen: "Every text editor on every platform. Browser previews. Universal.",
    primaryUse: "Universal text interchange.",
    binary: false,
  },
  text: {
    name: "Text",
    fullName: "Plain text",
    description:
      "Plain text, the simplest data format. No formatting, no metadata, just characters. Universal compatibility across every device and program ever made.",
    howToOpen: "Every text editor on every platform. Browser previews.",
    primaryUse: "Universal text interchange.",
    binary: false,
  },
  html: {
    name: "HTML",
    fullName: "HyperText Markup Language",
    description:
      "HTML is the markup language of the web, every browser displays HTML documents natively. Files contain text plus tags (<h1>, <p>, <a>, etc.) describing structure and links. Modern HTML5 also supports embedded media (audio/video) and complex semantic markup.",
    howToOpen: "Every web browser. Any text editor for source. Modern editors (VS Code) syntax-highlight HTML.",
    primaryUse: "Web pages; structured document interchange; readable archives.",
    binary: false,
  },
  markdown: {
    name: "Markdown",
    fullName: "Markdown",
    description:
      "Markdown is plain text with simple punctuation conventions for formatting, # for headings, * for lists, ** for bold, links as [text](url). Created by John Gruber in 2004 and now the default for GitHub READMEs, documentation sites, and modern note-taking apps (Obsidian, Notion-export, Bear).",
    howToOpen: "Any text editor (raw). Rendered: GitHub, GitLab, VS Code preview, Obsidian, Bear, Notion (importable), Typora, MarkText, Markdown Editor.",
    primaryUse: "Documentation, READMEs, notes, blog posts.",
    binary: false,
  },
  md: {
    name: "Markdown (.md)",
    fullName: "Markdown",
    description:
      "Markdown is plain text with simple punctuation conventions for formatting, # for headings, * for lists, ** for bold, links as [text](url). The .md extension is the most common Markdown file extension; .markdown is the older form. GitHub READMEs, documentation sites, and Obsidian/Bear use Markdown universally.",
    howToOpen: "Any text editor. Rendered: GitHub, GitLab, VS Code preview, Obsidian, Bear, Typora, MarkText.",
    primaryUse: "Documentation, READMEs, notes, blog posts.",
    binary: false,
  },
  css: {
    name: "CSS",
    fullName: "Cascading Style Sheets",
    description:
      "CSS describes how HTML elements should be displayed, colors, fonts, layout, animations. Plain text. Every browser parses CSS to render web pages. Modern CSS has cascade variables, container queries, and a vibrant ecosystem of preprocessors and frameworks (Tailwind, PostCSS).",
    howToOpen: "Any text editor. Browsers parse CSS automatically when linked from HTML.",
    primaryUse: "Web styling; design system distribution.",
    binary: false,
  },
  hex: {
    name: "Hex codes",
    fullName: "Hex color list",
    description:
      "A plain text list of hex color codes (e.g. #FF6B35, one per line). The most portable color-list format, any modern design tool accepts hex. Often the format used by color-palette generators (Coolors, Adobe Color, Khroma) for export.",
    howToOpen: "Any text editor. Pastes directly into design tools.",
    primaryUse: "Color palette interchange between web/design tools.",
    binary: false,
  },
  image: {
    name: "Image",
    fullName: "Image (any format)",
    description:
      "Generic image input, JPG, PNG, WebP, BMP, GIF, or any other format your browser can decode. The OCR pipeline accepts any of these because Tesseract.js works on raw pixels regardless of source format.",
    howToOpen: "Every image viewer on every platform.",
    primaryUse: "OCR input, extract text from any image.",
    binary: true,
  },
  kml: {
    name: "KML",
    fullName: "Keyhole Markup Language",
    description:
      "KML is Google Earth's XML format for geographic data, points, lines, polygons, with optional descriptions and styles. Originally Keyhole Inc.'s format (Google acquired Keyhole and created Google Earth from it). Standardized as OGC KML in 2008.",
    howToOpen: "Google Earth (free), Google My Maps, QGIS, ArcGIS. Plain XML in any editor.",
    primaryUse: "Geographic visualization in Google Earth and GIS tools.",
    binary: false,
  },

  // ==================== Output-specific (Kindle clippings destinations) ====================
  "obsidian-md": {
    name: "Obsidian Markdown",
    fullName: "Obsidian-flavored Markdown",
    description:
      "Standard Markdown with Obsidian-specific extensions, YAML frontmatter for metadata, [[wikilinks]] for cross-references, #tags for organization, ![[]] for embedded media. Drop into your Obsidian vault and the file is immediately searchable, linkable, and graph-visualizable.",
    howToOpen: "Obsidian primarily. Renders fine as regular Markdown elsewhere, you just lose the wikilink magic.",
    primaryUse: "Knowledge graphs in Obsidian.",
    binary: false,
  },
  "notion-csv": {
    name: "Notion-import CSV",
    fullName: "Notion-compatible CSV",
    description:
      "CSV with column names that map cleanly to Notion's database properties, Notion's import wizard (File → Import → CSV) treats first-column entries as page titles and remaining columns as properties. Used to bulk-import structured data (research notes, highlights, contacts) into a fresh Notion database.",
    howToOpen: "Notion import wizard creates a database from the CSV. Otherwise opens in any spreadsheet.",
    primaryUse: "Bulk-loading structured data into Notion.",
    binary: false,
  },
  "readwise-csv": {
    name: "Readwise-import CSV",
    fullName: "Readwise-compatible CSV",
    description:
      "CSV formatted to match Readwise's import schema, Highlight, Title, Author, Note, Location, Date columns. Drop into Readwise's importer to bulk-add highlights from sources Readwise doesn't natively integrate with (or to migrate from a competing service).",
    howToOpen: "Readwise's CSV importer at readwise.io/import_csv. Otherwise standard CSV in any editor.",
    primaryUse: "Bulk-importing highlights into Readwise.",
    binary: false,
  },
};

/** Look up by extension or by name (case-insensitive). */
export function getFormat(key: string): FormatProfile | undefined {
  const k = key.toLowerCase().replace(/^\./, "");
  return PROFILES[k];
}

/** All format keys with a real profile. Used by /formats/[format] route
 *  to pre-render dedicated format-info pages. */
export function listFormatKeys(): string[] {
  return Object.keys(PROFILES);
}

/**
 * Best-effort: extract input + output format keys from a converter id like
 * "heic-to-jpg" → ["heic", "jpg"]. Returns a fallback profile (just the
 * key as name) if the format isn't in our catalog yet.
 */
export function getProfilesForToolId(id: string): { input: FormatProfile; output: FormatProfile } | null {
  const parts = id.split("-to-");
  if (parts.length !== 2) return null;
  const [inputKey, outputKey] = parts;
  return {
    input: getFormat(inputKey) ?? fallbackProfile(inputKey),
    output: getFormat(outputKey) ?? fallbackProfile(outputKey),
  };
}

function fallbackProfile(key: string): FormatProfile {
  return {
    name: key.toUpperCase(),
    fullName: key.toUpperCase(),
    description: `${key.toUpperCase()} is a file format we support converting. Detailed format information is being added, for now, drop your file in the converter above and you'll get the conversion you came for.`,
    howToOpen: "Most operating systems open this format with a default application; if not, search for a free reader/viewer for the format.",
    primaryUse: "File interchange.",
    binary: true,
  };
}
