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
  fbx: {
    name: "FBX",
    fullName: "Autodesk Filmbox",
    description:
      "FBX is Autodesk's proprietary 3D interchange format, originally built for Kaydara's FilmBox motion-capture tool (hence the name) and acquired by Autodesk in 2006. It carries meshes, materials, rigs, skeletal animation, blend shapes, cameras, and lights in one file, which made it the de facto asset format for game engines: Unreal Engine, Unity, and Epic's Fab marketplace all ingest FBX as a first-class citizen. Two encodings exist, binary (common) and ASCII, both versioned; modern tools write FBX 7.x.",
    howToOpen:
      "Unreal Engine and Unity import FBX directly. Blender opens it via File > Import > FBX. Autodesk's free FBX Review (Windows/macOS) previews files without a full DCC install. Maya, 3ds Max, Cinema 4D, and Houdini all read and write it natively.",
    primaryUse: "Shipping rigged, animated 3D assets into game engines and between DCC tools.",
    binary: true,
  },
  ply: {
    name: "PLY",
    fullName: "Polygon File Format (Stanford Triangle Format)",
    description:
      "PLY was designed at Stanford's 3D scanning lab by Greg Turk (1994) to store scanned geometry, and it remains the standard output of 3D scanners and photogrammetry pipelines (Meshroom, RealityCapture, COLMAP). A fully self-describing header declares elements and typed properties, so files can carry per-vertex normals, colors, and confidence values alongside positions. Three encodings exist and all are common: ascii, binary little-endian, and binary big-endian. Blender imports and exports PLY natively.",
    howToOpen:
      "Blender (File > Import > Stanford PLY), MeshLab, and CloudCompare all open PLY, including point-cloud-only files. Windows 3D Viewer reads mesh PLYs. The ascii flavor is inspectable in any text editor.",
    primaryUse: "3D scan and photogrammetry output, both meshes and point clouds.",
    binary: true,
  },
  dae: {
    name: "DAE",
    fullName: "COLLADA (Collaborative Design Activity)",
    description:
      "DAE is the file extension of COLLADA, the XML-based 3D asset exchange schema Sony and the Khronos Group standardized in the mid-2000s (ISO/PAS 17506). It stores scenes, geometry, materials, physics, and animation as human-readable XML. COLLADA was the neutral interchange format of its era, used by Google Earth and SketchUp models and early game pipelines, before glTF took over that role. A great deal of legacy content still ships as .dae, which is why every major DCC tool keeps an importer.",
    howToOpen:
      "Blender (File > Import > Collada), SketchUp, Cinema 4D, and MeshLab open DAE directly. macOS Preview and Xcode render .dae natively (SceneKit's editor format). Because it is XML, any text editor shows the structure.",
    primaryUse: "Legacy 3D scene and model exchange, especially SketchUp/Google Earth era content.",
    binary: false,
  },
  "3ds": {
    name: "3DS",
    fullName: "3D Studio Mesh",
    description:
      "3DS is the binary mesh format of Autodesk 3D Studio for DOS (1990), one of the oldest 3D formats still circulating. Its chunk-based structure stores triangle meshes, basic materials, and keyframe data, with hard legacy limits: 16-bit vertex indices cap each mesh at 65,536 vertices and object names at 10 characters. Despite its age, enormous archives of stock models and game mods still ship as .3ds, so modern tools keep read support.",
    howToOpen:
      "Blender imports 3DS via File > Import > 3D Studio. 3ds Max, Cinema 4D, MeshLab, and most asset managers read it. Converting to a modern format is recommended before further editing.",
    primaryUse: "Opening legacy stock models and archives from the 3D Studio era.",
    binary: true,
  },
  usdz: {
    name: "USDZ",
    fullName: "Universal Scene Description (zip archive)",
    description:
      "USDZ is Apple's packaging of Pixar's USD (Universal Scene Description): a single uncompressed zip archive holding a .usda/.usdc scene plus its textures, with 64-byte data alignment so the file can be memory-mapped. It is the native format of AR Quick Look, meaning iPhones and iPads can place a USDZ model in the room straight from Safari with no app install. Announced at WWDC 2018 and now the standard for web AR product previews on Apple devices.",
    howToOpen:
      "On iPhone/iPad, tapping a USDZ link opens AR Quick Look automatically. On macOS, Preview and Quick Look render it. Reality Composer (Apple) and Blender 4.x (via USD) can edit the contents; usdzip and usdview ship with Pixar's USD toolset.",
    primaryUse: "AR Quick Look product previews on iOS and macOS.",
    binary: true,
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

  // ===== Color formats =====
  rgb: {
    name: "RGB",
    fullName: "Red Green Blue color tuple",
    description:
      "RGB describes a color by the intensity of red, green, and blue light needed to produce it on a screen — each channel 0 to 255. It's the native model of every display device since CRT monitors, and the underlying representation behind hex codes (#FF6347 is just rgb(255, 99, 71) in hexadecimal). Used directly in CSS, web design, every image format, and digital photography pipelines. Doesn't represent print colors well, that's CMYK's job.",
    howToOpen:
      "RGB values appear as text in CSS files, design tool color pickers, and web inspector tools. Pasting `rgb(255, 99, 71)` into Chrome DevTools' color input gives you a swatch. Designers most often deal with RGB through HEX codes (the same data, different encoding).",
    primaryUse: "Specifying screen colors in code and design tools.",
    binary: false,
  },
  hsl: {
    name: "HSL",
    fullName: "Hue Saturation Lightness color model",
    description:
      "HSL describes a color by hue (0-360° around the color wheel), saturation (0-100% gray to vivid), and lightness (0-100% black to white). Designers prefer it over RGB because shifting one dimension keeps the others intact — drop saturation and you get a desaturated version of the same color, no manual rebalancing. CSS supports HSL natively (`hsl(207, 87%, 56%)`) and most modern color systems (Tailwind, Material) generate palettes by varying HSL axes.",
    howToOpen:
      "HSL values appear in CSS files, design system tokens, and color-picker tools. Chrome DevTools, Figma, and every modern design app accept `hsl()` notation directly.",
    primaryUse: "Designer-friendly color specification where you want to vary one dimension.",
    binary: false,
  },
  cmyk: {
    name: "CMYK",
    fullName: "Cyan Magenta Yellow Key color model",
    description:
      "CMYK describes how much cyan, magenta, yellow, and black ink to lay down to produce a color on paper — each channel 0 to 100%. It's the print industry's color model because printers add ink (subtractive color) instead of emitting light (additive RGB). The same color almost always renders slightly differently on-screen vs in print because the gamut differs. Required by every commercial print shop and built into Photoshop's print prep workflow.",
    howToOpen:
      "Adobe Photoshop, Illustrator, InDesign all natively work in CMYK mode (Image → Mode → CMYK Color). Affinity Photo, GIMP via plugins. Print-shop submission portals accept CMYK PDFs directly.",
    primaryUse: "Print-shop color specifications and prepress workflows.",
    binary: false,
  },
  "color-name": {
    name: "CSS color name",
    fullName: "CSS named color (CSS Color Module Level 4)",
    description:
      "CSS defines 147 standard color names (red, tomato, rebeccapurple, midnightblue, etc.) that browsers translate to specific hex values. Originated from the X11 color list and standardized through CSS1, CSS3, and Color Level 4. Names like 'gray' and 'grey' are intentional aliases, both legal. Useful in code reviews and design discussions where 'tomato' is more memorable than '#FF6347'.",
    howToOpen:
      "Type the name directly in any CSS property accepting a color: `color: tomato;`. Browser DevTools, Figma, and most design tools accept CSS color names in their color inputs.",
    primaryUse: "Memorable CSS color shorthand in code.",
    binary: false,
  },

  // ===== Encoding formats =====
  base64: {
    name: "Base64",
    fullName: "Base64 binary-to-text encoding (RFC 4648)",
    description:
      "Base64 encodes any byte sequence as ASCII text using 64 printable characters (A-Z, a-z, 0-9, +, /, with = padding). Output is ~33% larger than input but survives every text channel that strips or mangles binary: email attachments (MIME), JSON fields, URLs (URL-safe variant), data: URIs, JWT payloads. The format dates to RFC 989 (1987) and was standardized in RFC 4648.",
    howToOpen:
      "Any text editor displays base64. To decode back to bytes: `base64 -d` on Mac/Linux, `certutil -decode` on Windows, or paste into any base64 web decoder. Used heavily in dev tools, API debugging, and security workflows.",
    primaryUse: "Embedding binary data in text-only channels (email, JSON, URLs).",
    binary: false,
  },
  "url-encoded": {
    name: "URL-encoded text",
    fullName: "Percent-encoding (RFC 3986)",
    description:
      "URL encoding (also called percent-encoding) replaces characters that have special meaning in URLs (`?`, `&`, `=`, space, `#`) with their `%XX` hex escape. Multi-byte UTF-8 characters expand to multiple `%XX` sequences. Required for query strings, form bodies, and any URL component that contains user input. The standard is RFC 3986; JavaScript's `encodeURIComponent` is the most common implementation.",
    howToOpen:
      "Any text editor displays URL-encoded strings. Browser DevTools shows decoded forms in the Network tab's request inspector. Online decoders abound; most languages have a native function (`urllib.parse.unquote` in Python, `decodeURIComponent` in JS).",
    primaryUse: "Safely passing arbitrary text through URL query strings and form bodies.",
    binary: false,
  },

  // ===== Hash formats =====
  md5: {
    name: "MD5 checksum",
    fullName: "Message Digest 5 (RFC 1321)",
    description:
      "MD5 produces a 128-bit (32 hex character) fingerprint of any input. Designed by Ron Rivest in 1991, it's been cryptographically broken since 2004 (collisions can be manufactured) — still widely used for non-security checks like file integrity verification on package mirrors, CDN caches, and data deduplication where collision attacks aren't a concern. Output format matches the standard `md5sum` CLI: `<hex>  <filename>`.",
    howToOpen:
      "Any text editor opens the .md5 checksum file. Verify with `md5sum -c file.md5` on Linux/Mac (Windows: `certutil -hashfile`). Most package managers and CDNs publish .md5 alongside downloads to detect transfer corruption.",
    primaryUse: "File-integrity verification on package mirrors and CDN downloads.",
    binary: false,
  },
  sha1: {
    name: "SHA-1 checksum",
    fullName: "Secure Hash Algorithm 1 (FIPS 180-4)",
    description:
      "SHA-1 produces a 160-bit (40 hex character) fingerprint. Standardized by NIST in 1995 and deprecated for cryptographic use since the SHAttered collision attack (2017). Still used widely in non-security contexts: Git uses SHA-1 to identify every commit, blob, and tree. Output matches the `shasum` CLI format.",
    howToOpen:
      "Any text editor. Verify with `shasum -c file.sha1` (`-a 1` for explicit algorithm). Git's plumbing commands (`git cat-file -p <sha1>`) all reference SHA-1 hashes.",
    primaryUse: "Git's content-addressable storage and legacy file integrity.",
    binary: false,
  },
  sha256: {
    name: "SHA-256 checksum",
    fullName: "Secure Hash Algorithm 256 (FIPS 180-4)",
    description:
      "SHA-256 produces a 256-bit (64 hex character) fingerprint. Part of the SHA-2 family, currently the default cryptographic hash for security-sensitive integrity checks: TLS certificates, Bitcoin block hashes, signed package distributions (Debian, npm, PyPI), code-signing manifests. No known practical collision attacks. Output matches `shasum -a 256` CLI format.",
    howToOpen:
      "Verify with `shasum -a 256 -c file.sha256` (`sha256sum` on Linux, `Get-FileHash` on PowerShell). Required for download verification by every reputable open-source distribution channel.",
    primaryUse: "Cryptographic file integrity for security-sensitive downloads.",
    binary: false,
  },
  sha512: {
    name: "SHA-512 checksum",
    fullName: "Secure Hash Algorithm 512 (FIPS 180-4)",
    description:
      "SHA-512 produces a 512-bit (128 hex character) fingerprint. Larger output than SHA-256 with no practical security difference for typical use, but standard for high-assurance contexts (government, military, enterprise compliance). Frequently faster than SHA-256 on 64-bit hardware because it processes 1024-bit blocks. Used in many BLAKE-family algorithms as a primitive.",
    howToOpen:
      "Verify with `shasum -a 512 -c file.sha512`. The longer hex string is awkward to compare visually but copy-paste verification works the same as SHA-256.",
    primaryUse: "High-assurance file integrity (government, enterprise compliance).",
    binary: false,
  },
  file: {
    name: "Any file",
    fullName: "Any binary or text file",
    description:
      "Hash converters accept any file as input — they read the raw bytes and produce a fixed-length fingerprint that uniquely identifies the contents. Two files with even one byte different produce wildly different hashes; identical files produce identical hashes. This is the property that makes hashes useful for integrity checking and content-addressable storage.",
    howToOpen:
      "Drop any file: PDF, image, video, archive, executable, plain text. The converter reads its bytes and computes the digest. Output is a small text file containing the hex hash and the original filename.",
    primaryUse: "Generating file fingerprints for integrity verification.",
    binary: true,
  },

  // ===== Config formats =====
  ini: {
    name: "INI",
    fullName: "INI configuration file",
    description:
      "INI is a simple `key = value` config format with optional `[section]` headers, originally from MS-DOS and Windows 3.x. Still widely used because of its readability — Git, MySQL, PHP, Python's configparser, and countless tools use INI for their configs. No standard spec, so dialects vary: some allow `:` as separator, some support `;` or `#` comments, some allow nested sections with dots in keys.",
    howToOpen:
      "Any text editor. Most operating systems associate `.ini` with Notepad/TextEdit by default. Tools that consume INI files load them directly without manual parsing.",
    primaryUse: "Human-editable application configuration.",
    binary: false,
  },
  env: {
    name: ".env",
    fullName: "Environment variable file (dotenv)",
    description:
      "A `.env` file lists shell-style `KEY=value` lines that get loaded as environment variables by tools that support dotenv (Node's dotenv package, Docker Compose, Laravel, Rails, Vercel). Originated as a Twelve-Factor App convention (2011) and now ubiquitous in web app deployment. Lines starting with `#` are comments. Values with spaces or special chars need quoting.",
    howToOpen:
      "Any text editor. macOS Finder hides files starting with `.` by default — Cmd+Shift+. to toggle visibility. Most IDEs and code editors syntax-highlight .env files.",
    primaryUse: "Storing app config and secrets outside the codebase.",
    binary: false,
  },
  properties: {
    name: ".properties",
    fullName: "Java properties file",
    description:
      "A Java `.properties` file is a `key=value` (or `key:value`) text format used by every Java/Kotlin/Spring/Gradle/Log4j project for configuration. Keys traditionally use dot-separated namespaces (`server.port`, `spring.datasource.url`). Supports backslash escapes (`\\n`, `\\t`, `\\uXXXX`) and `#`/`!` comments. Standardized by `java.util.Properties` since JDK 1.0.",
    howToOpen:
      "Any text editor. IntelliJ IDEA, Eclipse, and VS Code with Java extensions provide auto-completion and validation against the surrounding Java/Spring code.",
    primaryUse: "Java/Spring application configuration.",
    binary: false,
  },
  po: {
    name: ".po",
    fullName: "Gettext Portable Object",
    description:
      "A PO file is the interchange format used by every gettext-based software localization toolchain: GNU gettext, Babel (Python), Poedit, Lokalise, Crowdin, Weblate, Transifex, polib, react-i18next, Django, Symfony, WordPress translations, and many more. Each entry pairs a source string (`msgid`) with its translation (`msgstr`), plus optional disambiguation context (`msgctxt`), plural forms (`msgid_plural` / `msgstr[N]`), translator/developer comments, source-file references, and gettext flags. Spec dates to 1995 with the original GNU gettext release; still the de-facto standard 30 years later.",
    howToOpen:
      "Poedit (free, all platforms) is the most common editor. Lokalise/Crowdin/Weblate/Transifex import PO directly via web upload. Any text editor opens them as plain text. Linguists prefer Poedit for translation memory and validation; developers usually edit them in their IDE.",
    primaryUse: "Software localization (UI strings, error messages, in-app text in every language).",
    binary: false,
  },
  ass: {
    name: "ASS",
    fullName: "Advanced SubStation Alpha",
    description:
      "ASS (Advanced SubStation Alpha, sometimes spelled .ssa for its predecessor SubStation Alpha) is the styled-subtitle format used by Aegisub, fansubbed anime, and nearly every video player that supports advanced typesetting (VLC, MPV, mpv-style, IINA, PotPlayer). It's a section-based INI: `[Script Info]` for metadata, `[V4+ Styles]` for fonts/colors/positioning, `[Events]` for the actual `Dialogue:` lines. Captions can specify per-line styling, hard breaks (`\\N`), inline override codes (`{\\b1}bold{\\b0}`, `{\\i1}italic{\\i0}`, `{\\fnArial}font`), karaoke effects, and absolute screen positioning — none of which SRT or WebVTT express. Created in 2003; libass is the de-facto rendering engine across mpv, ffmpeg, and most modern players.",
    howToOpen:
      "Aegisub is the canonical editor (free, all platforms). VLC, MPV, IINA, and PotPlayer render ASS overlays natively. ffmpeg can burn ASS into a video track or pass through as a soft subtitle stream. Any text editor opens .ass as plain UTF-8.",
    primaryUse: "Styled subtitles for video — anime fansubs, professional video typesetting, karaoke timings.",
    binary: false,
  },
  dicom: {
    name: "DICOM",
    fullName: "Digital Imaging and Communications in Medicine",
    description:
      "DICOM is the universal medical imaging format — every X-ray, CT scan, MRI, ultrasound, mammogram, PET scan, and most pathology slides from every modern PACS (Picture Archiving and Communication System) is DICOM. The format wraps a pixel-data payload (the actual image) with a rich metadata header carrying patient identifiers, study/series/instance UIDs, imaging modality, acquisition parameters, window/level presets, and per-vendor private tags. Spec maintained by NEMA (National Electrical Manufacturers Association); first published in 1985 as ACR-NEMA 1.0, became DICOM 3.0 in 1993, still actively versioned today. Wire format: 128-byte preamble + `DICM` magic + tagged-value stream where each tag is a (group, element) pair indexing into the DICOM Data Dictionary.",
    howToOpen:
      "Hospital workstations open DICOM natively. For desktop viewing: RadiAnt, OsiriX (macOS), Horos (macOS, free), MicroDicom (Windows, free), Weasis (cross-platform Java). For programmatic access: dcmtk (CLI), pydicom (Python), dcm4che (Java). The free MyChart-equivalent apps from most hospital systems also surface DICOMs from your own scans.",
    primaryUse: "Medical imaging interchange — sharing scans between hospitals, second opinions, research datasets, patient downloads from EHR portals.",
    binary: true,
  },
  glb: {
    name: "GLB",
    fullName: "glTF 2.0 Binary",
    description:
      "GLB is the binary container for glTF 2.0 — the Khronos Group's web-native 3D format, often called \"the JPEG of 3D.\" A single .glb file packs the model's JSON metadata (scene graph, materials, animations) and binary buffers (vertex positions, normals, UVs, indices, textures) into one self-contained download, ideal for streaming over HTTP. Universal support across the modern 3D stack: Three.js, Babylon.js, model-viewer (Google's `<model-viewer>` web component), Sketchfab, Facebook 3D posts, Microsoft 3D Viewer, Apple QuickLook (via USDZ conversion), Blender (import/export), Unreal Engine, Unity. Every WebXR/AR/VR pipeline reads GLB. Spec finalized in 2017 as glTF 2.0; binary chunk format kept stable since.",
    howToOpen:
      "Drag-and-drop into https://gltf-viewer.donmccurdy.com or https://sandbox.babylonjs.com/. Blender opens .glb via File → Import → glTF 2.0. The `<model-viewer>` web component renders them on any webpage with `<model-viewer src=\"model.glb\">`. Microsoft 3D Viewer (Windows) and macOS Preview (with USDZ Tools) handle GLB natively.",
    primaryUse: "3D model delivery for the web (AR product viewers, WebXR scenes, embedded 3D widgets) and modern game-engine workflows.",
    binary: true,
  },
  dxf: {
    name: "DXF",
    fullName: "AutoCAD Drawing Exchange Format",
    description:
      "DXF (Drawing Exchange Format) is AutoCAD's interchange format and the closest thing 2D CAD has to a universal lingua franca. Every meaningful CAD tool reads it: AutoCAD, LibreCAD, QCAD, BricsCAD, FreeCAD, OnShape (export), Fusion 360 (export), TinkerCAD, KiCad, EAGLE, plus laser-cutter and CNC-control software. Wire format is pair-based ASCII (a group code followed by a value, one per line), organized into sections — HEADER, TABLES, BLOCKS, and the ENTITIES section that carries the actual geometry: LINE, CIRCLE, ARC, POLYLINE, LWPOLYLINE, POINT, TEXT, INSERT, HATCH, DIMENSION, and several dozen others. Spec dates to AutoCAD 1.0 (1982) and is still emitted by current AutoCAD 2025; binary DXF exists but is rare. We render the ENTITIES section's drawable entities (LINE, CIRCLE, ARC, polylines, points, text) to SVG or structured JSON.",
    howToOpen:
      "AutoCAD opens DXF natively. LibreCAD and QCAD are free desktop alternatives (Linux/macOS/Windows). FreeCAD imports DXF via its Draft module. ShareCAD.org views them in-browser. Any text editor opens ASCII DXF as plain text (the format is human-readable, group code then value pairs).",
    primaryUse: "2D CAD interchange — sharing drawings between AutoCAD and other CAD/CAM tools, importing into laser-cutter and CNC software, embedding into web pages as SVG.",
    binary: false,
  },
  toml: {
    name: "TOML",
    fullName: "Tom's Obvious Minimal Language",
    description:
      "TOML is a config format designed by GitHub co-founder Tom Preston-Werner in 2013 as a more readable alternative to YAML and INI. Its appeal is unambiguous syntax — TOML files always parse the same way regardless of indentation. Used by Cargo (Rust), pyproject.toml (Python packaging), pnpm-workspace, Hugo, Netlify, and many others. v1.0.0 spec finalized in 2021.",
    howToOpen:
      "Any text editor. Most modern IDEs ship TOML syntax highlighting; VS Code's Even Better TOML extension adds validation.",
    primaryUse: "Application/package config in Rust, modern Python, and static site generators.",
    binary: false,
  },
  yaml: {
    name: "YAML",
    fullName: "YAML Ain't Markup Language",
    description:
      "YAML is a human-readable config format that's a strict superset of JSON. Used by Docker Compose, Kubernetes manifests, GitHub Actions workflows, Ansible playbooks, OpenAPI/Swagger specs, and CircleCI configs. Indentation matters, which trips up users accustomed to brace-based configs. Spec versions: 1.1 (2005, Ruby/Python ecosystems) and 1.2 (2009, current). Most tools default to a 1.1/1.2 hybrid.",
    howToOpen:
      "Any text editor. VS Code, IntelliJ, and most modern IDEs ship YAML syntax highlighting and validation. The `yamllint` CLI catches indentation bugs before they reach CI.",
    primaryUse: "DevOps configuration (Kubernetes, Docker Compose, CI workflows).",
    binary: false,
  },
  hcl: {
    name: "HCL",
    fullName: "HashiCorp Configuration Language",
    description:
      "HCL is the config language behind Terraform, Packer, Vault, Consul, and Nomad — all HashiCorp tools. Designed to be more concise than JSON and more human-friendly than YAML. Blocks describe resources (`resource \"aws_s3_bucket\" \"example\" { ... }`), attributes use `=`. HCL2 (current) supports expressions, conditionals, and string interpolation.",
    howToOpen:
      "Terraform Language Server (in VS Code, IntelliJ, Vim) provides syntax highlighting + validation. `terraform fmt` reformats. Files use `.tf`, `.hcl`, or `.tfvars` extensions.",
    primaryUse: "Infrastructure-as-code config for Terraform and HashiCorp tools.",
    binary: false,
  },
  json5: {
    name: "JSON5",
    fullName: "JSON5 (relaxed JSON)",
    description:
      "JSON5 is JSON plus the things every developer wishes JSON had: `// line comments` and `/* block comments */`, trailing commas, unquoted keys, single-quoted strings, multi-line strings, hex literals. Released in 2012, it's the format behind tsconfig.json, Babel configs, and many other dev tooling configs. Strict JSON parsers reject these extensions; JSON5 parsers accept both.",
    howToOpen:
      "Any text editor with JSON5 syntax mode (VS Code has built-in support via `.json5` extension). To run with strict-JSON tools, convert to JSON first.",
    primaryUse: "Developer-friendly configs (tsconfig, Babel, build tooling).",
    binary: false,
  },
  jsonl: {
    name: "JSONL",
    fullName: "JSON Lines (newline-delimited JSON)",
    description:
      "JSONL is one JSON value per line, no enclosing array brackets. Each line stands alone — readable and writable in streaming fashion without buffering the whole file. Used by BigQuery, ClickHouse, fluentd, OpenAI fine-tuning, LangChain training data, and most modern data pipelines. Also called NDJSON. The line break IS the record separator.",
    howToOpen:
      "Any text editor displays JSONL as plain text. `jq` processes it line-by-line: `cat data.jsonl | jq .name`. Convert to JSON for tools that expect a single document.",
    primaryUse: "Streaming data pipelines and ML training datasets.",
    binary: false,
  },

  // ===== Tabular subformats =====
  tsv: {
    name: "TSV",
    fullName: "Tab-separated values",
    description:
      "TSV is CSV's tab-separated cousin: columns delimited by tab characters instead of commas. Preferred when cell values themselves contain commas (so you don't have to quote everything). Excel reads TSV directly without import wizard prompts. Used by Bioinformatics tools (BLAST, BED format), data export from Postgres (`COPY ... FORMAT csv DELIMITER E'\\t'`), and many scientific datasets.",
    howToOpen:
      "Excel, Google Sheets, Numbers, and LibreOffice Calc all open TSV directly. Pandas reads with `pd.read_csv(..., sep='\\t')`. Less ambiguity than CSV because tabs almost never appear inside data values.",
    primaryUse: "Tab-delimited data exchange where comma-quoting is annoying.",
    binary: false,
  },
  xml: {
    name: "XML",
    fullName: "Extensible Markup Language",
    description:
      "XML is a hierarchical text format with opening + closing tags, originated at W3C in 1998 as a structured alternative to HTML. Still the lingua franca for legacy enterprise data exchange (SOAP web services, Office Open XML/.docx, RSS feeds, Java Spring configs, SVG, financial reporting like XBRL). JSON has displaced it in modern web APIs; XML lives on in compliance, document formats, and B2B integrations.",
    howToOpen:
      "Any text editor with XML syntax highlighting. Browsers render most XML files with collapsible tree views. Validators against XSD schemas come with most IDEs.",
    primaryUse: "Hierarchical data interchange (legacy APIs, document formats, B2B).",
    binary: false,
  },
  "markdown-table": {
    name: "Markdown table",
    fullName: "GitHub-flavored Markdown table",
    description:
      "A Markdown table uses pipes (`|`) for column separators and a dash row for the header divider. Renders to HTML on GitHub, GitLab, every Markdown-aware static site generator, and dev tooling like MkDocs. Particularly useful when documentation lives next to code — paste data into a README.md and it renders as a real table.",
    howToOpen:
      "Any text editor (Markdown is plain text). VS Code, Obsidian, Typora, and most Markdown editors live-preview tables. GitHub renders them automatically in commits, issues, PR descriptions.",
    primaryUse: "Embedding tabular data in Markdown docs and READMEs.",
    binary: false,
  },
  "html-table": {
    name: "HTML table",
    fullName: "HTML <table> element",
    description:
      "An HTML table uses `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` elements to render tabular data in a browser. Predates CSS layouts and remains the right tool for actual tabular data (with appropriate ARIA for accessibility). Email clients still depend heavily on tables for layout because CSS support varies.",
    howToOpen:
      "Open in any browser to render. View Source to see the markup. Email-template tools render HTML tables to email-client-safe layouts.",
    primaryUse: "Rendering tabular data in web pages and HTML emails.",
    binary: false,
  },

  // ===== Geographic formats =====
  gpx: {
    name: "GPX",
    fullName: "GPS Exchange Format",
    description:
      "GPX is the de-facto interchange format for GPS data — waypoints (single locations), tracks (recorded routes you walked/biked/drove), and routes (planned paths). XML-based, version 1.1 (2004) is current. Every GPS device, fitness app (Strava, Garmin Connect, Komoot), and mapping tool reads/writes GPX. Cyclists, hikers, and pilots use it to share routes and analyze trips.",
    howToOpen:
      "Garmin BaseCamp, Strava (drag-drop upload), Komoot, Google Earth, Gaia GPS, every GPS unit's companion software. Online viewers like gpx.studio render tracks on a map without download.",
    primaryUse: "GPS track and waypoint exchange between devices and apps.",
    binary: false,
  },
  geojson: {
    name: "GeoJSON",
    fullName: "Geographic JSON (RFC 7946)",
    description:
      "GeoJSON encodes geographic features (points, lines, polygons) as JSON objects following RFC 7946 (2016). Coordinates are always [longitude, latitude] in WGS84. Supported natively by Leaflet, Mapbox GL, OpenLayers, ArcGIS, QGIS, and PostGIS — the default exchange format for web mapping. Lighter and easier to inspect than KML or shapefile (.shp).",
    howToOpen:
      "GitHub renders GeoJSON files inline as interactive maps. geojson.io provides an in-browser editor + validator. QGIS opens .geojson directly. Leaflet/Mapbox apps consume it programmatically.",
    primaryUse: "Web mapping data exchange (Leaflet, Mapbox, ArcGIS).",
    binary: false,
  },

  // ===== Subtitle formats =====
  srt: {
    name: "SRT",
    fullName: "SubRip Subtitle",
    description:
      "SRT is the simplest subtitle format: a numbered list of cues, each with a `HH:MM:SS,mmm --> HH:MM:SS,mmm` timestamp and one or more lines of caption text. Originated in 2001 from the SubRip ripping tool and became the universal default — every video player (VLC, MPV, mpv, every web video framework), every subtitle editor, and every video platform reads SRT.",
    howToOpen:
      "Any text editor (it's just text). VLC autoloads `<videoname>.srt` if it's next to the video file. Subtitle editors like Subtitle Edit, Aegisub, and EditSubs provide visual timing tools.",
    primaryUse: "Universal subtitle format for video players and editors.",
    binary: false,
  },
  vtt: {
    name: "WebVTT",
    fullName: "Web Video Text Tracks",
    description:
      "WebVTT is the W3C standard subtitle format for HTML5 video, used by every browser when you set `<track src=\"captions.vtt\">` on a `<video>` element. Differs from SRT mainly in syntax (`.` decimal in timestamps, `WEBVTT` header, no cue numbers required) plus optional cue settings for position and style. YouTube, Vimeo, and modern OTT platforms all accept WebVTT.",
    howToOpen:
      "Any text editor. Browsers render WebVTT inline when attached to a video element. Subtitle Edit and other tools convert between WebVTT and SRT.",
    primaryUse: "HTML5 video captions and accessibility tracks.",
    binary: false,
  },
  sbv: {
    name: "SBV",
    fullName: "SubViewer (YouTube subtitle format)",
    description:
      "SBV is YouTube's legacy subtitle download format — `H:MM:SS.mmm,H:MM:SS.mmm` start/end timestamps separated by a comma, then caption text on the next lines. YouTube Studio still exports captions as SBV when you click 'Download captions' in the video editor. Single-digit hours, period decimal, no header.",
    howToOpen:
      "Any text editor. Most subtitle editors (Subtitle Edit, Aegisub) auto-detect SBV from the timestamp shape. Convert to SRT/WebVTT for use outside YouTube.",
    primaryUse: "Downloading and editing YouTube auto-generated captions.",
    binary: false,
  },

  // ===== Spreadsheet =====
  ods: {
    name: "ODS",
    fullName: "OpenDocument Spreadsheet",
    description:
      "ODS is the OpenDocument format spreadsheet, used by LibreOffice Calc, Apache OpenOffice Calc, and Collabora Online. ZIP-packaged XML structure standardized by ISO/IEC 26300. The free/open-source counterpart to Microsoft's XLSX. Excel reads ODS but with feature loss on complex formulas; LibreOffice reads XLSX with similar caveats.",
    howToOpen:
      "LibreOffice Calc (free, every desktop OS) is the native editor. Microsoft Excel opens ODS but pins it as 'OpenDocument' with a downgraded ribbon. Google Sheets imports ODS via File → Import.",
    primaryUse: "Spreadsheet exchange in the LibreOffice/OpenOffice ecosystem.",
    binary: true,
  },

  // ===== Web fonts =====
  ttf: {
    name: "TTF",
    fullName: "TrueType Font",
    description:
      "TTF is the font container format developed by Apple in the late 1980s and adopted by Microsoft in Windows 3.1. Stores quadratic Bézier glyph outlines, hinting data, and font metadata (kerning, OS/2 flags, naming). Every operating system reads TTF natively. Mostly superseded for web use by WOFF/WOFF2 (smaller compressed wrappers around the same SFNT data) but TTF remains the source format and the universal install target.",
    howToOpen:
      "Double-click on any OS to preview + install. Font management tools (FontBook on macOS, Windows Fonts, Linux fc-cache) handle batch installs. To use on the web, convert to WOFF2 first.",
    primaryUse: "Desktop font installation and the source format for web fonts.",
    binary: true,
  },
  otf: {
    name: "OTF",
    fullName: "OpenType Font",
    description:
      "OTF is the modern font container format (Microsoft + Adobe, late 1990s) that supersedes TTF. Same SFNT wrapper but supports CFF (PostScript) glyph outlines in addition to TrueType outlines, plus advanced typographic features like ligatures, alternate glyphs, small caps, and contextual substitutions. Every modern OS reads OTF as natively as TTF; many designer fonts ship as OTF for the typographic features.",
    howToOpen:
      "Same as TTF: double-click to install on Windows, macOS, Linux. Use in CSS via `@font-face` (or convert to WOFF2 first for web delivery).",
    primaryUse: "Designer typography with advanced OpenType features.",
    binary: true,
  },
  woff: {
    name: "WOFF",
    fullName: "Web Open Font Format (W3C)",
    description:
      "WOFF wraps a TTF or OTF in a compressed container (zlib) optimized for web download. Standardized by the W3C in 2012. Smaller than the source font but larger than WOFF2 (which uses Brotli). Supported by every browser since IE9. Many sites ship WOFF as a fallback for older browsers that don't support WOFF2.",
    howToOpen:
      "Browsers consume WOFF via CSS `@font-face` declarations. Desktop systems don't install WOFF directly — convert to TTF first. Font editing tools (FontForge, Glyphs, FontLab) read WOFF for editing.",
    primaryUse: "Web font delivery with fallback compatibility.",
    binary: true,
  },

  // ===== SQL =====
  sql: {
    name: "SQL",
    fullName: "SQL dump (CREATE TABLE + INSERT INTO)",
    description:
      "A SQL dump file contains the SQL statements needed to recreate a database: CREATE TABLE for schema, INSERT INTO for rows, optionally indexes, constraints, and triggers. The portable subset (single-quoted strings, ANSI types) runs unmodified on Postgres, MySQL, SQLite, and SQL Server. The output of `pg_dump`, `mysqldump`, and SQLite's `.dump` command — the standard backup/seed format for relational databases.",
    howToOpen:
      "Any text editor. To execute: `psql < dump.sql`, `mysql < dump.sql`, `sqlite3 db < dump.sql`. Database GUIs (DBeaver, TablePlus, DataGrip, pgAdmin) all import SQL dump files via their migration wizards.",
    primaryUse: "Database backups and data seeding.",
    binary: false,
  },

  // ===== Date/time formats =====
  unix: {
    name: "Unix timestamp",
    fullName: "Unix epoch seconds",
    description:
      "A Unix timestamp is the number of seconds (or milliseconds) since 1970-01-01T00:00:00 UTC, the moment the original Unix systems counted from. Compact, language-neutral, and never affected by timezone or DST changes. Logged by every server log line, returned by every API time field, stored in every analytics warehouse. Auto-detection is straightforward: 10-digit values are seconds, 13-digit are milliseconds.",
    howToOpen:
      "Any tool that handles numbers. To make readable: every programming language has a function (`Date.now()` in JS, `time.time()` in Python, `date -d @<ts>` on Linux/Mac).",
    primaryUse: "Compact, timezone-neutral timestamp storage in logs and APIs.",
    binary: false,
  },
  iso: {
    name: "ISO 8601",
    fullName: "ISO 8601 date/time string",
    description:
      "ISO 8601 is the international standard for representing dates and times as strings: `2024-06-10T14:30:00Z` (UTC) or with explicit offset (`2024-06-10T14:30:00+02:00`). Unambiguous, sortable lexicographically, and the format every modern API uses (REST, GraphQL, JSON Schema). Standardized in 1988; the JavaScript `Date.toISOString()` and Python `datetime.isoformat()` both emit it.",
    howToOpen:
      "Any text editor or programming language. To parse: every language ships a function (`new Date(iso)` in JS, `datetime.fromisoformat(iso)` in Python 3.11+).",
    primaryUse: "Timezone-explicit timestamp exchange in APIs and data files.",
    binary: false,
  },
  timestamp: {
    name: "Timestamp",
    fullName: "Unix timestamp or ISO 8601 input",
    description:
      "Generic timestamp input — accepts both Unix epoch numbers (10-digit seconds, 13-digit milliseconds) and ISO 8601 date strings. Useful when you have a column of mixed-format dates from heterogeneous sources (different APIs, log shippers, exports) and need to normalize them.",
    howToOpen:
      "Plain text. Any text editor or scripting language can read the input column.",
    primaryUse: "Normalizing mixed timestamp formats from different sources.",
    binary: false,
  },
  readable: {
    name: "Readable date",
    fullName: "Human-readable UTC date string",
    description:
      "Human-readable date format like `Mon, 15 Jan 2024 14:30:00 UTC` — based on RFC 1123 with `UTC` substituted for `GMT` for clarity. Always UTC and locale-independent so cross-region teams see identical strings, the whole point of normalization. Useful for audit logs, status pages, and any context where humans need to verify timestamps quickly.",
    howToOpen:
      "Any text editor. The format is structured enough to parse mechanically (`Date.parse` accepts it) but readable enough to scan visually.",
    primaryUse: "Human verification of timestamps in audit logs and reports.",
    binary: false,
  },

  // ===== Bibliography (CSL-JSON for Zotero/Pandoc/Mendeley) =====
  "csl-json": {
    name: "CSL-JSON",
    fullName: "Citation Style Language JSON",
    description:
      "CSL-JSON is the modern interop format for citation metadata. Zotero exports it natively (right-click a collection → Export → CSL JSON). Pandoc consumes it as `--bibliography file.json` for reference rendering. Every major reference manager (Zotero, Mendeley, Citavi, Papers, Bookends) reads or writes it. Defined by the Citation Style Language project; covers ~100 fields across journals, books, chapters, theses, software, datasets, and more. The de-facto replacement for BibTeX in modern academic toolchains.",
    howToOpen:
      "Any JSON viewer or text editor. Zotero imports via File → Import → CSL JSON. Pandoc references it as bibliography input. JabRef, Citavi, and Bookends all accept CSL-JSON drop-ins.",
    primaryUse: "Cross-tool bibliography exchange between reference managers.",
    binary: false,
  },

  // ===== Medical formats =====
  hl7: {
    name: "HL7 v2",
    fullName: "Health Level 7 version 2.x messaging",
    description:
      "HL7 v2 is the universal messaging standard between U.S. hospital systems — Epic, Cerner, Meditech, Allscripts, Athena all speak it for ADT (admit/discharge/transfer), ORU (observation results), ORM (orders), and billing messages. Format dates to 1989; v2.5 (2003) is the most-deployed version. Pipe-delimited segments with caret-separated components and tilde-separated repetitions; the MSH header carries encoding characters and routing metadata. Despite FHIR's modern push, v2 still powers the operational backbone of most hospital networks.",
    howToOpen:
      "Any text editor — HL7 v2 is plain text with `|`/`^`/`~` as delimiters. Specialized viewers (Mirth Connect, Iguana, NextGen Connect, IBM Sterling) parse + index segments. For programmatic use, libraries exist for every language (HAPI in Java/.NET, hl7v2-js in Node).",
    primaryUse: "Hospital-to-hospital and intra-hospital clinical messaging.",
    binary: false,
  },
  fhir: {
    name: "FHIR",
    fullName: "Fast Healthcare Interoperability Resources (HL7 R4)",
    description:
      "FHIR is HL7's modern healthcare data standard — REST APIs over JSON resources (Patient, Observation, Condition, MedicationRequest, etc.) plus a Bundle wrapper for batch transfer. Released as Standard for Trial Use in 2014, R4 (current normative release) finalized 2019. Adopted by Apple Health, Epic's MyChart API, the U.S. ONC Cures Act 21st Century interoperability rules, every EHR vendor. Replacing HL7 v2 for new integrations though v2 remains dominant for legacy systems.",
    howToOpen:
      "FHIR is JSON, so any text editor + JSON viewer. Specialized tools: Postman with FHIR collections, HAPI FHIR's reference server, Inferno test harness. Most modern EHRs expose FHIR endpoints directly via OAuth-secured REST.",
    primaryUse: "Modern healthcare API integrations and clinical data exchange.",
    binary: false,
  },
  "fhir-bundle": {
    name: "FHIR Bundle",
    fullName: "FHIR R4 Bundle resource",
    description:
      "A FHIR Bundle is a JSON wrapper that carries multiple FHIR resources (Patient, Observation, Condition, MedicationRequest) as a single transferable unit. Bundle types: `transaction` (atomic batch of API operations), `collection` (grouped resources without operation semantics), `searchset` (server search response). The standard format for cross-system clinical data transfer in modern healthcare integrations.",
    howToOpen:
      "Any JSON viewer or FHIR-aware tool. Postman with FHIR collections, HAPI FHIR's reference server, Smart Health Cards verifier. EHR vendors accept Bundles via standard `$process-message` and `$transaction` endpoints.",
    primaryUse: "Atomic batch transfer of clinical resources between FHIR servers.",
    binary: false,
  },
  ccda: {
    name: "C-CDA",
    fullName: "Consolidated Clinical Document Architecture",
    description:
      "C-CDA is the HL7 XML format every U.S. EHR exports for transition-of-care documents — discharge summary, continuity of care document (CCD), referral note, history & physical. Required for ONC certification and Meaningful Use / Promoting Interoperability incentive programs. Templates standardize how to represent allergies, medications, problems, vital signs, lab results across vendors. Files are typically 100KB-2MB of XML; the document is human-readable when rendered with a stylesheet.",
    howToOpen:
      "Most browsers render C-CDA inline if the embedded XSL stylesheet loads. EHR portals (Epic MyChart, Cerner HealtheLife) auto-render. Standalone viewers: HealthIT.gov C-CDA Renderer, Lantana CDA Validator. Convert to HTML for portable viewing.",
    primaryUse: "Cross-EHR clinical document exchange and patient record sharing.",
    binary: false,
  },

  // ===== Legal eDiscovery formats =====
  dat: {
    name: "DAT",
    fullName: "Concordance/Relativity load file",
    description:
      "DAT is the metadata + extracted-text load file format every U.S. eDiscovery production uses. Produced by Concordance, Relativity, Reveal, Logikcull, Everlaw, and every law firm review platform. Uses non-printable Unicode characters (U+0014 field delimiter, U+00FE text qualifier) instead of CSV's commas + quotes — the unusual delimiters avoid collisions with quoted text inside fields like email body content. CRLF line terminators (Concordance is Windows-native).",
    howToOpen:
      "Concordance, Relativity, Reveal, Everlaw, Logikcull, and every other eDiscovery review platform load DAT files natively. Excel opens them but shows garbled þ characters. Convert to CSV for spreadsheet workflows; the original DAT remains the production-of-record format.",
    primaryUse: "eDiscovery document production metadata exchange between law firms.",
    binary: false,
  },
  opt: {
    name: "OPT",
    fullName: "Concordance image load file",
    description:
      "OPT is the comma-separated image-mapping file that accompanies a DAT in a Concordance/Relativity production. Each row describes one page: PageID (Bates number), Volume, ImagePath (TIF, PDF, or JPG), IsBoundary (Y for first page of a doc), GroupIdentifier, Type, PagesInDoc. Required to load production images alongside the metadata.",
    howToOpen:
      "Concordance and Relativity load OPT directly when ingesting a production. Excel opens the comma-separated content but loses the implicit column meanings. Convert to CSV with proper headers for paralegals reviewing image-to-Bates mappings.",
    primaryUse: "Mapping production document images to Bates page identifiers.",
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
