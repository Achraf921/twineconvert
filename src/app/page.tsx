import Link from "next/link";
import { listToolIds, getMeta } from "@/lib/engine/registry-meta";
import { ToolSearch } from "@/components/ToolSearch";
import { HeroFlow } from "@/components/HeroFlow";
import { HomeFAQ } from "@/components/HomeFAQ";
import { HomeDropzone } from "@/components/HomeDropzone";
import { buildDropzoneRoutes, buildFormatGraph } from "@/lib/dropzone-routes";

const CATEGORIES: Array<{ label: string; description: string; ids: string[] }> = [
  {
    label: "Image",
    description: "Convert between every common image format. Decode HEIC from iPhone, encode AVIF for web, generate favicons.",
    ids: [
      "heic-to-jpg", "heic-to-png", "heic-to-webp",
      "jpg-to-png", "png-to-jpg", "jpg-to-webp", "png-to-webp", "webp-to-jpg", "webp-to-png",
      "avif-to-jpg", "avif-to-png", "avif-to-webp", "jpg-to-avif", "png-to-avif", "webp-to-avif",
      "bmp-to-jpg", "bmp-to-png", "jpg-to-bmp", "png-to-bmp",
      "gif-to-jpg", "gif-to-png", "jpg-to-gif", "png-to-gif",
      "svg-to-png", "svg-to-jpg",
      "tiff-to-jpg", "tiff-to-png",
      "png-to-ico", "jpg-to-ico", "ico-to-png", "ico-to-jpg",
      "remove-background",
    ],
  },
  {
    label: "PDF & Documents",
    description: "Read, write, compress, and OCR PDFs. Convert between Word, Excel, and CSV.",
    ids: [
      "pdf-to-jpg", "pdf-to-png", "pdf-to-text", "pdf-to-docx",
      "jpg-to-pdf", "png-to-pdf", "heic-to-pdf", "webp-to-pdf", "tiff-to-pdf",
      "compress-pdf",
      "docx-to-pdf", "docx-to-html", "docx-to-txt",
      "html-to-docx", "txt-to-docx",
      "xlsx-to-csv", "xlsx-to-json", "csv-to-xlsx",
      "csv-to-json", "json-to-csv",
      "pages-to-pdf", "numbers-to-pdf", "keynote-to-pdf",
      "image-to-text", "jpg-to-text", "png-to-text",
    ],
  },
  {
    label: "Audio & Video",
    description: "FFmpeg.wasm in your browser. Strip audio from video, transcode formats, convert GIFs to MP4.",
    ids: [
      "mp4-to-mp3", "mp4-to-gif", "mp4-to-mov", "mp4-to-avi", "mp4-to-mkv",
      "mov-to-mp4", "webm-to-mp4", "avi-to-mp4", "mkv-to-mp4", "gif-to-mp4",
      "mp3-to-wav", "wav-to-mp3", "mp3-to-m4a", "mp3-to-flac", "mp3-to-ogg",
      "m4a-to-mp3", "flac-to-mp3", "ogg-to-mp3",
    ],
  },
  {
    label: "EPUB & E-readers",
    description: "Extract text and HTML from EPUBs. Convert your Kindle My Clippings.txt for Notion, Obsidian, or Readwise.",
    ids: [
      "epub-to-text", "epub-to-html", "epub-to-pdf",
      "kindle-clippings-to-csv", "kindle-clippings-to-json", "kindle-clippings-to-markdown",
      "kindle-clippings-to-obsidian-md", "kindle-clippings-to-notion-csv", "kindle-clippings-to-readwise-csv",
    ],
  },
  {
    label: "Personal data exports",
    description: "Apple Health, WhatsApp, Discord, Twitter / X, Instagram, Facebook. Extract your data into open formats.",
    ids: [
      "apple-health-to-csv", "apple-health-to-json",
      "apple-health-heart-rate-to-csv", "apple-health-steps-to-csv", "apple-health-sleep-to-csv", "apple-health-workouts-to-csv",
      "whatsapp-chat-to-pdf", "whatsapp-chat-to-csv", "whatsapp-chat-to-html", "whatsapp-chat-to-json",
      "discord-chat-to-md", "discord-chat-to-pdf", "discord-chat-summary-csv",
      "twitter-archive-to-csv", "twitter-archive-to-html",
      "instagram-data-to-csv", "instagram-data-to-html",
      "facebook-archive-to-html",
    ],
  },
  {
    label: "Email & finance",
    description: "Convert .eml/.mbox to PDF for archiving. OFX/QFX/QBO/QIF bank statements to CSV.",
    ids: [
      "eml-to-pdf", "eml-to-html", "eml-to-csv", "eml-to-mbox", "mbox-to-eml", "mbox-to-pdf",
      "ofx-to-csv", "qfx-to-csv", "qbo-to-csv", "qif-to-csv",
      "csv-to-ofx", "csv-to-qfx", "csv-to-qbo", "csv-to-qif",
      "ofx-to-qif", "qif-to-ofx",
    ],
  },
  {
    label: "Genealogy, citations, ham radio, chess",
    description: "Niche professional formats most generic converters don't bother with. GEDCOM, BibTeX, ADIF, PGN.",
    ids: [
      "gedcom-to-csv", "gedcom-to-json", "gedcom-to-html", "gedcom-to-pdf", "csv-to-gedcom", "json-to-gedcom",
      "bibtex-to-ris", "ris-to-bibtex", "nbib-to-bibtex", "nbib-to-ris", "bibtex-to-csv", "ris-to-csv",
      "csv-to-bibtex", "csv-to-ris", "bibtex-to-nbib", "ris-to-nbib",
      "endnote-xml-to-bibtex", "endnote-xml-to-ris", "bibtex-to-endnote-xml", "ris-to-endnote-xml",
      "adif-to-csv", "csv-to-adif", "adif-to-cabrillo", "cabrillo-to-adif", "adif-to-kml",
      "pgn-to-csv", "pgn-to-fen", "pgn-to-json",
    ],
  },
  {
    label: "Design, color, 3D, music, embroidery",
    description: "Adobe ASE palettes. Color-grading LUTs. STL/OBJ/3MF mesh interchange. MIDI, MusicXML. DST/PES/JEF/EXP for Singer, Brother, Janome, Bernina embroidery machines.",
    ids: [
      "ase-to-gpl", "gpl-to-ase", "ase-to-aco", "aco-to-ase", "aco-to-gpl", "gpl-to-aco",
      "ase-to-css", "ase-to-json", "hex-to-ase", "hex-to-gpl",
      "cube-to-3dl", "3dl-to-cube", "cube-to-csp", "csp-to-cube", "3dl-to-csp", "csp-to-3dl",
      "stl-to-3mf", "3mf-to-stl", "obj-to-3mf", "3mf-to-obj", "stl-to-obj", "obj-to-stl",
      "midi-to-musicxml", "musicxml-to-midi", "mxl-to-musicxml", "musicxml-to-mxl",
      "dst-to-pes", "pes-to-dst", "dst-to-jef", "jef-to-dst", "pes-to-jef", "jef-to-pes",
      "dst-to-exp", "exp-to-dst", "pes-to-exp", "exp-to-pes", "jef-to-exp", "exp-to-jef",
    ],
  },
  {
    label: "Architecture, legal, security, B2B",
    description: "BIM models (IFC) to CSV quantity takeoffs and glTF. PACER court dockets. SARIF security scans. EDI X12 / EDIFACT.",
    ids: [
      "ifc-to-csv", "ifc-to-gltf",
      "pacer-docket-to-csv",
      "sarif-to-csv", "sarif-to-html",
      "edi-to-csv", "edifact-to-csv",
    ],
  },
];

const TOTAL_TOOLS = listToolIds().length;

const ALL_TOOLS_FOR_SEARCH = listToolIds().map((id) => ({
  id,
  label: getMeta(id)?.label ?? id,
}));

const ALL_TOOLS_FOR_DROPZONE = listToolIds()
  .map((id) => {
    const meta = getMeta(id);
    return meta ? { id, label: meta.label, accept: meta.accept } : null;
  })
  .filter((t): t is { id: string; label: string; accept: string[] } => t !== null);

const { routes: DROPZONE_ROUTES, acceptAll: DROPZONE_ACCEPT } = buildDropzoneRoutes(ALL_TOOLS_FOR_DROPZONE);
const FORMAT_GRAPH = buildFormatGraph(listToolIds());

const POPULAR = [
  { id: "heic-to-jpg", label: "HEIC → JPG" },
  { id: "pdf-to-docx", label: "PDF → DOCX" },
  { id: "mp4-to-mp3", label: "MP4 → MP3" },
  { id: "compress-pdf", label: "Compress PDF" },
  { id: "ofx-to-csv", label: "OFX → CSV" },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PrivacyManifesto />
      <CategoryGrid />
      <HomeFAQ />
      <WhyInBrowser />
    </>
  );
}

// ===========================================================================
// HERO, CloudConvert layout: text left, chip widget right, dropzone below
// ===========================================================================

function HeroSection() {
  return (
    <section className="relative hero-wash overflow-hidden">
      <div className="subtle-grid absolute inset-0 opacity-60 pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 pt-12 pb-14 sm:pt-16 sm:pb-20">
        {/* Top: headline + paragraph spanning the full width */}
        <div className="fade-up max-w-4xl">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--color-pink-200)] text-[var(--color-pink-700)] text-[11px] font-bold tracking-[0.18em] uppercase shadow-[var(--shadow-xs)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pink-600)] pink-pulse" />
            {TOTAL_TOOLS} converters &middot; in-browser &middot; private by design
          </p>
          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] text-[var(--color-ink)]">
            Convert Any File.{" "}
            <span className="text-[var(--color-pink-600)]">Privately.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[var(--color-ink-2)] max-w-2xl leading-relaxed">
            Pick a conversion from the chips, or drop a file and we&apos;ll route you to the right tool. {TOTAL_TOOLS} converters across {CATEGORIES.length} categories, straight from your browser.
          </p>
        </div>

        {/* Below: compact chip widget LEFT, big dropzone RIGHT, side by side from sm+ */}
        <div className="fade-up fade-up-delay-2 mt-12 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 sm:gap-10 lg:gap-14 items-center">
          <div className="flex items-center justify-center sm:justify-start">
            <HeroFlow graph={FORMAT_GRAPH} initialInput="HEIC" initialOutput="JPG" />
          </div>
          <div className="w-full">
            <HomeDropzone routes={DROPZONE_ROUTES} acceptAll={DROPZONE_ACCEPT} />
          </div>
        </div>

        {/* Search + popular row below */}
        <div className="fade-up fade-up-delay-3 mt-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-[var(--color-ink-3)] font-medium">Popular:</span>
            {POPULAR.map((p) => (
              <Link
                key={p.id}
                href={`/${p.id}`}
                className="lift inline-flex items-center px-3 py-1 rounded-full bg-white border border-[var(--color-border)] text-[var(--color-ink-2)] hover:text-[var(--color-pink-700)] font-medium"
              >
                {p.label}
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <ToolSearch tools={ALL_TOOLS_FOR_SEARCH} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// PRIVACY MANIFESTO, dense pair-of-cards block (CC pattern)
// ===========================================================================

function PrivacyManifesto() {
  return (
    <section id="privacy" className="border-t border-[var(--color-border)] bg-[var(--color-paper)]">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
            <DiamondGlyph /> Formats supported
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Hundreds of formats, thousands of conversion types.
          </h2>
          <p className="mt-4 text-[var(--color-ink-2)] leading-relaxed">
            The everyday ones, the niche ones, and a few you&apos;ve probably never heard of ,{" "}
            <strong className="text-[var(--color-ink)]">{TOTAL_TOOLS}</strong> tools across {CATEGORIES.length} categories. Every conversion gets its own page with a guide and FAQ.
          </p>
          <Link
            href="/all-tools"
            className="mt-5 inline-flex items-center gap-1.5 text-[var(--color-pink-700)] font-semibold text-sm hover:text-[var(--color-pink-800)]"
          >
            Browse all formats →
          </Link>
        </div>

        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
            <ShieldGlyph /> Data security
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Your files, handled privately.
          </h2>
          <p className="mt-4 text-[var(--color-ink-2)] leading-relaxed">
            Every conversion runs in your browser via WebAssembly. Files never travel to a server because there is no server. No daily quota, no upload size cap, no signup, no account.
          </p>
          <Link
            href="/#why"
            className="mt-5 inline-flex items-center gap-1.5 text-[var(--color-pink-700)] font-semibold text-sm hover:text-[var(--color-pink-800)]"
          >
            How it works →
          </Link>
        </div>
      </div>
    </section>
  );
}

function DiamondGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 1 L 11 6 L 6 11 L 1 6 Z" fill="currentColor" />
    </svg>
  );
}
function ShieldGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 1 L 10.5 3 V 6.5 Q 10.5 9.5, 6 11 Q 1.5 9.5, 1.5 6.5 V 3 Z" fill="currentColor" />
    </svg>
  );
}

// ===========================================================================
// CATEGORY GRID, clean, dense, AdSense-friendly
// ===========================================================================

function CategoryGrid() {
  return (
    <section id="tools" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
              Browse the engine
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Pick a converter.
            </h2>
            <p className="text-[var(--color-ink-2)] mt-3 max-w-xl">
              Every tile is a dedicated page with the conversion UI, format guide, and FAQ.
            </p>
          </div>
          <Link
            href="/all-tools"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-white text-sm font-semibold transition-colors"
          >
            See all {TOTAL_TOOLS} alphabetically
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="space-y-8">
          {CATEGORIES.map((cat) => <Category key={cat.label} category={cat} />)}
        </div>
      </div>
    </section>
  );
}

function Category({ category }: { category: (typeof CATEGORIES)[number] }) {
  return (
    <article>
      <header className="mb-4 pb-3 border-b border-[var(--color-border)] flex items-baseline gap-3 flex-wrap">
        <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] tracking-tight">
          {category.label}
        </h3>
        <span className="text-[11px] font-mono tabular-nums font-bold text-[var(--color-pink-700)]">
          {category.ids.length} tools
        </span>
        <p className="text-sm text-[var(--color-ink-3)] flex-1 min-w-0 leading-relaxed">
          {category.description}
        </p>
      </header>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {category.ids.map((id) => (
          <li key={id}>
            <Link
              href={`/${id}`}
              className="lift block px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] text-[13px] font-semibold text-[var(--color-ink-2)] truncate"
              title={idToLabel(id)}
            >
              {idToLabel(id)}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

function idToLabel(id: string): string {
  const parts = id.split("-to-");
  if (parts.length === 2) {
    return `${parts[0].toUpperCase().replace(/-/g, " ")} → ${parts[1].toUpperCase().replace(/-/g, " ")}`;
  }
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ===========================================================================
// WHY IN-BROWSER ESSAY
// ===========================================================================

function WhyInBrowser() {
  return (
    <section id="why" className="border-t border-[var(--color-border)] bg-[var(--color-paper)]">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
          Why in-browser
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          The case for not uploading your files.
        </h2>
        <div className="mt-7 space-y-5 text-[var(--color-ink-2)] leading-relaxed text-base sm:text-[17px]">
          <p>
            Most online file converters work the same way: you upload your file to their server, their server converts it, you download the result. The trade-off most users don&apos;t think about: <strong className="text-[var(--color-ink)]">your file lives on their server, even if briefly.</strong>
          </p>
          <p>
            That matters more for some files than others. A photo of your dog is one thing. A bank statement, a court filing, a private chat export, a medical scan, an unreleased work draft. Those are files where having a copy land on a third-party server is, at minimum, an unnecessary risk.
          </p>
          <p>
            twineconvert runs the conversion in your browser using WebAssembly compilations of the same libraries the upload-based converters run on their servers (FFmpeg, libheif, pdfjs, mammoth, web-ifc, jsquash, and a few dozen more). The only difference: the conversion executes on your machine instead of theirs.
          </p>
          <p>
            Practical implications: no upload progress bar, no daily quota, no file size cap, no signup, no email, no &quot;upgrade to convert without watermark.&quot; You drop a file, your browser does the work, you download the result.
          </p>
        </div>
      </div>
    </section>
  );
}
