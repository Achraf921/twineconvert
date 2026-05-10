/**
 * Format metadata catalog.
 *
 * For every file format the engine touches as input or output, we have
 * a profile here with: human name, full-name expansion, technical
 * description, and "how to open" hints. These get reused across every
 * tool page that involves the format — so the same HEIC paragraph
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
  /** "About" paragraph — 60-100 words, factual. Quote year/origin. */
  description: string;
  /** Practical "how do I open one?" guidance — 50-80 words, specific apps. */
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
      "JPG (also written JPEG) is the most widely used photo format on the web. The format dates to 1992 and uses lossy compression — discarding image detail in exchange for dramatically smaller files. It can't carry transparency. Modern alternatives like WebP and AVIF compress 25-50% better at the same visual quality, but JPG remains the universal compatibility default: every browser, OS, and image editor in existence reads it.",
    howToOpen:
      "Every operating system opens JPG natively — double-click on Windows, macOS, Linux, iOS, or Android and the system viewer launches. Browsers render JPGs inline. Image editors (Photoshop, GIMP, Affinity Photo, Pixelmator, Photopea in the browser) all read and write JPG.",
    primaryUse: "Photographs and any web image where transparency isn't needed.",
    binary: true,
  },
  jpeg: {
    name: "JPEG",
    fullName: "Joint Photographic Experts Group",
    description:
      "JPEG is the same format as JPG — different file extension, identical bytes. The .jpeg extension was the original; .jpg was adopted because early Windows versions limited extensions to 3 characters. Today the two are fully interchangeable.",
    howToOpen: "Identical to JPG — every modern OS, browser, and image editor opens .jpeg files without conversion.",
    primaryUse: "Photographs and web imagery (interchangeable with .jpg).",
    binary: true,
  },
  png: {
    name: "PNG",
    fullName: "Portable Network Graphics",
    description:
      "PNG is a lossless image format — the file size is larger than JPG, but every pixel is preserved exactly. It supports full transparency (alpha channel), which JPG cannot. Created in 1996 specifically as a patent-free replacement for GIF, PNG is the standard for screenshots, logos, icons, UI graphics, and any image that needs sharp text or transparent backgrounds.",
    howToOpen: "Universal support — every OS, browser, and image editor reads PNG. macOS Preview, Windows Photos, and any web browser open PNGs without any conversion step.",
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
      "HEIC is the format your iPhone saves photos as by default since iOS 11 (2017). It's a container around HEVC-compressed image data — roughly half the file size of an equivalent JPEG with no visible quality loss. The catch is compatibility: most non-Apple software still can't open HEIC files without a plugin or conversion step, which is why most iPhone users end up converting them.",
    howToOpen: "macOS, iOS, and iPadOS open HEIC natively. Windows 10 and 11 require the (paid) HEIF Image Extensions from the Microsoft Store. Most browsers don't display HEIC inline. If you received a HEIC file and don't want to install codecs, converting to JPG is the standard fix.",
    primaryUse: "Photos taken on iPhone (the default format since 2017).",
    binary: true,
  },
  heif: {
    name: "HEIF",
    fullName: "High Efficiency Image Format",
    description:
      "HEIF is the parent specification; HEIC is the most common variant of HEIF (using HEVC for compression). For most practical purposes the .heif and .heic extensions refer to the same kind of file.",
    howToOpen: "Same compatibility profile as HEIC — Apple devices open it natively, Windows needs an extension, most browsers don't.",
    primaryUse: "iPhone photos; identical to HEIC for most users.",
    binary: true,
  },
  avif: {
    name: "AVIF",
    fullName: "AV1 Image File Format",
    description:
      "AVIF uses AV1 video codec compression for still images — typically 30-50% smaller than JPG and 20% smaller than WebP at the same visual quality. Supported in Chrome since 2020, Firefox since 2021, Safari since 16.4 (2023). The encoding step is significantly slower than JPG, which is why CDNs adopt it slowly. Best fit: hero images and photo galleries on modern sites where bandwidth matters.",
    howToOpen: "All current browsers (2024+) display AVIF inline. Native OS viewer support varies — Windows 11 supports it natively, macOS only since Ventura. Older photo editors may need a plugin.",
    primaryUse: "Modern web images where every kilobyte matters.",
    binary: true,
  },
  bmp: {
    name: "BMP",
    fullName: "Bitmap Image File",
    description:
      "BMP is Microsoft's original bitmap format from the late 1980s. It stores raw pixel data with minimal compression, which makes BMP files enormous (a 1080p screenshot is about 6 MB as BMP, 200 KB as PNG). The format remains common in Windows-internal contexts (clipboard, certain printer drivers, older industrial software) but is rarely chosen as a delivery format today.",
    howToOpen: "Universal — every OS, browser, and image editor reads BMP. The format is so old it predates compatibility concerns.",
    primaryUse: "Legacy Windows software, hardware drivers, certain industrial applications.",
    binary: true,
  },
  gif: {
    name: "GIF",
    fullName: "Graphics Interchange Format",
    description:
      "GIF dates to 1987 and is best known today for animated short clips. The format is limited to 256 colors per frame, which is why photographic GIFs look blotchy — but for low-color animations and reaction loops it's the universal compatibility format. For any animation longer than a few seconds, MP4 is dramatically smaller (often 10-20×) and every social platform converts uploaded GIFs to MP4 internally.",
    howToOpen: "Every browser and OS displays GIFs inline. Windows, macOS, iOS, Android, and Linux all open them by default with no extra software.",
    primaryUse: "Short animated loops; reaction images; legacy compatibility.",
    binary: true,
  },
  svg: {
    name: "SVG",
    fullName: "Scalable Vector Graphics",
    description:
      "SVG describes images as math (paths, shapes, fills) instead of pixels. The result scales to any size without losing sharpness — perfect for logos, icons, and UI graphics. SVG files are XML text, which means they can be edited in any text editor and styled with CSS. Browsers render SVG natively; for rasterized output (PNG/JPG) you can convert.",
    howToOpen: "Every browser displays SVG inline. Vector editors (Illustrator, Affinity Designer, Inkscape, Figma) edit them. Any text editor can open the underlying XML.",
    primaryUse: "Logos, icons, illustrations, and any graphic that needs to scale crisply.",
    binary: false,
  },
  tiff: {
    name: "TIFF",
    fullName: "Tagged Image File Format",
    description:
      "TIFF is the workhorse format for professional imaging — scanning, prepress, archival photography. It supports lossless compression, multiple pages per file, layered data, and 16-bit-per-channel color depth (vs 8-bit in JPG/PNG). Files are large; the tradeoff is fidelity. Most consumer software doesn't display TIFF in browsers, which is why archivists frequently convert to JPG or PDF for sharing.",
    howToOpen: "macOS Preview, Windows Photos, and most professional image editors (Photoshop, Capture One, Lightroom) read TIFF. Browsers generally do not display it inline; you'll need a viewer or to convert.",
    primaryUse: "Scanning, prepress, archival imagery, multi-page documents.",
    binary: true,
  },
  ico: {
    name: "ICO",
    fullName: "Icon",
    description:
      "ICO is Microsoft's icon format — a single file containing the same icon at multiple sizes (typically 16, 32, 48, 64, 128, 256 pixels). Browsers use the favicon at the top of every tab. Modern websites can use PNG favicons too, but ICO remains the universally-supported choice especially for older browsers and Windows desktop integration.",
    howToOpen: "Browsers and Windows recognize ICO natively. macOS treats them as standard images. Modern image editors read multi-resolution ICOs; some older tools only see the first size.",
    primaryUse: "Browser favicons and Windows desktop icons.",
    binary: true,
  },

  pdf: {
    name: "PDF",
    fullName: "Portable Document Format",
    description:
      "PDF is the universal document format for fixed-layout content — invoices, contracts, scanned documents, e-books, forms. Created by Adobe in 1993 and made an open ISO standard in 2008, PDF preserves exact layout, fonts, and images across every device. Files can be searchable text, scanned images, or both. Most modern PDFs include a text layer that copy/paste and search work against.",
    howToOpen: "Every modern browser opens PDFs natively. Acrobat Reader is free; macOS Preview, Windows Edge, and ChromeOS all open PDFs without extra software. For editing, Adobe Acrobat Pro or open-source PDFsam are common.",
    primaryUse: "Documents that need to look identical on every device.",
    binary: true,
  },
  docx: {
    name: "DOCX",
    fullName: "Microsoft Word Document",
    description:
      "DOCX is the file format Microsoft Word has used since 2007 — a zip containing XML, images, and styles. It replaced the older binary .doc format and is now the de facto standard for editable documents. Google Docs, Apple Pages, and LibreOffice all read and write DOCX, though formatting fidelity varies for complex layouts (tables, embedded objects, custom styles).",
    howToOpen: "Microsoft Word (paid), Google Docs (free, web), Apple Pages (free, macOS/iOS), LibreOffice (free, all platforms), or any modern web-based editor like OnlyOffice.",
    primaryUse: "Editable text documents; the de facto office document standard.",
    binary: true,
  },
  doc: {
    name: "DOC",
    fullName: "Microsoft Word Document (legacy)",
    description:
      "DOC is the binary file format Microsoft Word used from 1997 to 2007. Since 2007, Word has saved as .docx by default — DOC is the older, less interoperable format. Modern Word and most other office suites still read .doc files for backward compatibility. Converting to DOCX or PDF is recommended for sharing.",
    howToOpen: "Microsoft Word (all versions), LibreOffice, Google Docs, Apple Pages. Compatibility with the legacy format is universal but cosmetic differences may appear.",
    primaryUse: "Legacy Word documents from before 2007.",
    binary: true,
  },
  xlsx: {
    name: "XLSX",
    fullName: "Microsoft Excel Spreadsheet",
    description:
      "XLSX is the spreadsheet format Excel has used since 2007 — like DOCX, it's a zip containing XML for cells, formulas, formatting, and embedded objects. Replaces the older binary .xls format. Read and written by Excel, Google Sheets, Apple Numbers, and LibreOffice Calc, with high fidelity for standard cell data and reasonable fidelity for complex formulas and pivot tables.",
    howToOpen: "Microsoft Excel, Google Sheets, Apple Numbers, LibreOffice Calc. CSV is a more portable format if you only need the raw cell values.",
    primaryUse: "Spreadsheets with formulas, formatting, multiple sheets.",
    binary: true,
  },
  csv: {
    name: "CSV",
    fullName: "Comma-Separated Values",
    description:
      "CSV is plain text — one row per line, fields separated by commas. The simplest possible tabular data format, which is exactly why it remains the most portable: every spreadsheet, database, programming language, and analytics tool reads CSV. Tradeoffs: no formulas, no formatting, no multiple sheets, and various edge cases around quoting fields that contain commas or newlines.",
    howToOpen: "Excel, Google Sheets, Apple Numbers, LibreOffice Calc, any text editor, every database import wizard, every programming language with one line of code.",
    primaryUse: "Universal tabular data interchange.",
    binary: false,
  },
  json: {
    name: "JSON",
    fullName: "JavaScript Object Notation",
    description:
      "JSON is a lightweight text format for structured data — nested objects, arrays, strings, numbers, booleans. It's the lingua franca of web APIs, configuration files, and data interchange between programs. Human-readable when formatted, machine-parseable in every programming language, and roughly half the size of equivalent XML.",
    howToOpen: "Any text editor reads JSON. Browsers display .json files in a formatted tree view. VS Code and similar editors highlight syntax.",
    primaryUse: "API responses, configuration files, structured data interchange.",
    binary: false,
  },

  // Audio
  mp3: {
    name: "MP3",
    fullName: "MPEG Audio Layer III",
    description:
      "MP3 is the most widely-supported audio format ever — every device, app, and music player on the planet reads it. It uses lossy compression (typically removing audio frequencies humans can't hear well) to shrink files to about a tenth of their uncompressed size. At 192 kbps and above, the difference vs lossless is inaudible to most listeners on most equipment.",
    howToOpen: "Every audio player ever made. iOS Music, Android, VLC, iTunes, Windows Media Player, browsers, smart speakers — universal.",
    primaryUse: "Music files, podcasts, audiobooks, voice recordings.",
    binary: true,
  },
  wav: {
    name: "WAV",
    fullName: "Waveform Audio File",
    description:
      "WAV is uncompressed audio — every sample stored as raw PCM data. Developed by IBM and Microsoft in 1991 as the standard for Windows audio. Files are 10× larger than MP3 but bit-perfect, which is why audio engineers and music producers work in WAV during editing and switch to MP3/AAC only for final delivery.",
    howToOpen: "Universal compatibility — every audio player, DAW (Logic, Pro Tools, Ableton, FL Studio, Reaper), and editing tool reads WAV.",
    primaryUse: "Audio editing, mastering, archival. Anywhere you need bit-perfect sound.",
    binary: true,
  },
  m4a: {
    name: "M4A",
    fullName: "MPEG-4 Audio",
    description:
      "M4A is AAC-encoded audio inside an MP4 container — Apple's preferred audio format. Higher quality than MP3 at the same bitrate (AAC is a generation newer than MP3). All Apple devices use it natively; iTunes/Apple Music ripped CDs as M4A by default. Compatibility on non-Apple devices has improved dramatically — most modern Android and Windows players read M4A directly.",
    howToOpen: "All Apple devices, modern Android/Windows players, VLC, browsers (HTML5 audio). Older feature phones and some car stereos may need MP3 instead.",
    primaryUse: "Higher-quality audio than MP3, especially in Apple ecosystems.",
    binary: true,
  },
  flac: {
    name: "FLAC",
    fullName: "Free Lossless Audio Codec",
    description:
      "FLAC is lossless compression — about half the size of WAV with bit-perfect audio (no quality lost). The audiophile and archive standard since 2001. Files are larger than MP3 (typically 4-5× depending on source) but the trade is no degradation, ever. Streaming services like Tidal, Qobuz, and Apple Music's lossless tier deliver FLAC.",
    howToOpen: "VLC, foobar2000, Audacity, every modern music player, native iOS support since 2017, native Android support since version 3. Older Apple devices need a third-party app.",
    primaryUse: "Archival music, audiophile listening, lossless streaming.",
    binary: true,
  },
  ogg: {
    name: "OGG",
    fullName: "Ogg Vorbis",
    description:
      "OGG is an open-source audio container, most commonly carrying Vorbis-encoded audio (similar quality to MP3 but patent-free at the time of its creation). Used heavily in open-source software, video games (Spotify shipped OGG Vorbis for years), and Linux audio. Less universal than MP3 — older iPods and some legacy hardware don't read it.",
    howToOpen: "VLC, foobar2000, every modern web browser (HTML5 audio), most Android players, Audacity. Apple devices typically need a third-party app.",
    primaryUse: "Open-source audio, game audio assets, web audio.",
    binary: true,
  },

  // Video
  mp4: {
    name: "MP4",
    fullName: "MPEG-4 Part 14",
    description:
      "MP4 is the dominant video container on the web — H.264 video plus AAC audio, in a structure designed for streaming. Every browser, mobile device, smart TV, and editing tool reads MP4. The format is technically a container (not a codec), so two MP4 files can have very different internal codecs, but the H.264+AAC default is what enables universal playback.",
    howToOpen: "Every video player on the planet — VLC, QuickTime, Windows Media Player, browsers (HTML5 video), iOS, Android, smart TVs, game consoles. Universal.",
    primaryUse: "Web video, mobile video recording, video sharing.",
    binary: true,
  },
  mov: {
    name: "MOV",
    fullName: "QuickTime Movie",
    description:
      "MOV is Apple's QuickTime container, used by macOS and iOS for screen recordings and the iPhone Camera app. Structurally very similar to MP4 — the two formats share most of the same internal codecs (H.264, HEVC) and can usually be losslessly remuxed between each other without re-encoding. Universal compatibility, slightly favored on Apple platforms.",
    howToOpen: "QuickTime Player (macOS), every modern video player. Some older Windows software may not handle the QuickTime container — converting to MP4 fixes it without quality loss.",
    primaryUse: "iPhone screen recordings, Apple ecosystem video.",
    binary: true,
  },
  webm: {
    name: "WebM",
    fullName: "WebM",
    description:
      "WebM is Google's open-source video container, designed for web streaming. Uses VP8/VP9 video and Vorbis/Opus audio. About 25-35% smaller than equivalent H.264 MP4 at the same quality. Universal browser support; less common on standalone media players and older hardware.",
    howToOpen: "All modern web browsers, VLC, MPV. Some smart TVs and older players don't recognize WebM — converting to MP4 is the standard fix.",
    primaryUse: "Web video where smaller file size matters more than universal playback.",
    binary: true,
  },
  avi: {
    name: "AVI",
    fullName: "Audio Video Interleave",
    description:
      "AVI is Microsoft's video container from 1992 — a workhorse for older Windows software, security camera systems, and legacy editing workflows. The format itself is durable but inefficient compared to MP4: same content takes 2-3× more disk space. Modern video software reads AVI but rarely writes it; converting old AVI archives to MP4 is the standard modernization path.",
    howToOpen: "VLC, every video player, every video editor. Smart TVs and mobile devices may struggle — convert to MP4 if you want to play AVI on a TV.",
    primaryUse: "Legacy video, security camera footage, older Windows workflows.",
    binary: true,
  },
  mkv: {
    name: "MKV",
    fullName: "Matroska Video",
    description:
      "MKV is an open-source container that holds essentially any video/audio codec combination plus subtitles, chapters, and metadata. The format of choice for high-quality video archives, fan-subtitled content, and anything that benefits from multiple audio tracks. The catch: not every player supports it, and converting MKV to MP4 is the standard fix for the won't-play-on-my-TV problem.",
    howToOpen: "VLC reads everything MKV. Plex and Kodi handle MKV libraries. Browsers and many TVs do not — converting to MP4 makes MKV content universally playable.",
    primaryUse: "High-quality video archives with multiple audio/subtitle tracks.",
    binary: true,
  },

  // Sundry niche / professional formats — abbreviated descriptions for ones
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
      "QFX is Intuit's variant of OFX with extra Intuit-specific tags (INTU.BID, INTU.USERID). Identical to OFX in transaction structure. Used by Quicken — files marked .qfx are typically what you download from your bank for Quicken specifically.",
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
      "EPUB is the open-standard ebook format used by every major reader except Kindle. Files are zips containing reflowable HTML, CSS, and metadata — text adapts to any screen size. EPUB 3 added audio, video, and interactive elements but most ebooks still ship as EPUB 2 for compatibility.",
    howToOpen: "Apple Books, Calibre, Adobe Digital Editions, Google Play Books, Kobo readers, Nook, most e-readers except Kindle.",
    primaryUse: "Ebooks across non-Kindle readers.",
    binary: true,
  },
};

/** Look up by extension or by name (case-insensitive). */
export function getFormat(key: string): FormatProfile | undefined {
  const k = key.toLowerCase().replace(/^\./, "");
  return PROFILES[k];
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
    description: `${key.toUpperCase()} is a file format we support converting. Detailed format information is being added — for now, drop your file in the converter above and you'll get the conversion you came for.`,
    howToOpen: "Most operating systems open this format with a default application; if not, search for a free reader/viewer for the format.",
    primaryUse: "File interchange.",
    binary: true,
  };
}
