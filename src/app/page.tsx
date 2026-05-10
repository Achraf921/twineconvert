import Link from "next/link";
import { listToolIds, getMeta } from "@/lib/engine/registry-meta";
import { ToolSearch } from "@/components/ToolSearch";
import { HeroFlow } from "@/components/HeroFlow";
import { HomeFAQ } from "@/components/HomeFAQ";
import { CategoryIcon } from "@/components/CategoryIcon";

const CATEGORIES: Array<{ slug: string; label: string; description: string; ids: string[] }> = [
  {
    slug: "image",
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
    slug: "document",
    label: "PDF & Documents",
    description: "Read, write, compress, and OCR PDFs. Convert between Word, Excel, and CSV. Extract iWork previews.",
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
    slug: "media",
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
    slug: "ereaders",
    label: "EPUB & E-readers",
    description: "Extract text and HTML from EPUBs. Convert your Kindle My Clippings.txt for Notion, Obsidian, or Readwise.",
    ids: [
      "epub-to-text", "epub-to-html", "epub-to-pdf",
      "kindle-clippings-to-csv", "kindle-clippings-to-json", "kindle-clippings-to-markdown",
      "kindle-clippings-to-obsidian-md", "kindle-clippings-to-notion-csv", "kindle-clippings-to-readwise-csv",
    ],
  },
  {
    slug: "personal",
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
    slug: "finance",
    label: "Email & finance",
    description: "Convert .eml/.mbox to PDF for archiving. OFX/QFX/QBO/QIF bank statements to CSV for any spreadsheet.",
    ids: [
      "eml-to-pdf", "eml-to-html", "eml-to-csv", "eml-to-mbox", "mbox-to-eml", "mbox-to-pdf",
      "ofx-to-csv", "qfx-to-csv", "qbo-to-csv", "qif-to-csv",
      "csv-to-ofx", "csv-to-qfx", "csv-to-qbo", "csv-to-qif",
      "ofx-to-qif", "qif-to-ofx",
    ],
  },
  {
    slug: "research",
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
    slug: "creative",
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
    slug: "professional",
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

const POPULAR = [
  { id: "heic-to-jpg", label: "HEIC → JPG" },
  { id: "pdf-to-docx", label: "PDF → DOCX" },
  { id: "mp4-to-mp3", label: "MP4 → MP3" },
  { id: "compress-pdf", label: "Compress PDF" },
  { id: "ofx-to-csv", label: "OFX → CSV" },
  { id: "apple-health-to-csv", label: "Apple Health" },
  { id: "epub-to-pdf", label: "EPUB → PDF" },
  { id: "remove-background", label: "Remove background" },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularStrip />
      <PrivacyManifesto />
      <CategoryGrid />
      <HomeFAQ />
      <WhyInBrowser />
    </>
  );
}

// ===========================================================================
// HERO
// ===========================================================================

function HeroSection() {
  return (
    <section className="relative hero-glow overflow-hidden">
      <div className="dot-grid-pink absolute inset-0 opacity-40 pointer-events-none" aria-hidden />
      {/* Decorative thread that arcs over the hero */}
      <DecorativeThread />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 text-center">
        <p className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--color-pink-200)] text-[var(--color-pink-700)] text-[11px] font-bold tracking-[0.18em] uppercase shadow-[var(--shadow-xs)]">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-[var(--color-pink-500)] pink-pulse" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-[var(--color-pink-500)]" />
          </span>
          {TOTAL_TOOLS} converters &middot; in-browser &middot; open source
        </p>

        <h1 className="fade-up fade-up-delay-1 h-display text-[2.75rem] sm:text-7xl lg:text-[6rem] mt-7 max-w-5xl mx-auto">
          Convert files{" "}
          <span className="h-display-italic">privately.</span>
          <br />
          Right{" "}
          <span className="marker">in your browser.</span>
        </h1>

        <p className="fade-up fade-up-delay-2 mt-7 sm:mt-9 max-w-2xl mx-auto text-lg sm:text-xl text-[var(--color-ink-2)] leading-relaxed">
          {TOTAL_TOOLS} converters across {CATEGORIES.length} categories. Drop a file, get a converted file. Nothing leaves your device — no signup, no upload, no file size cap.
        </p>

        <div className="fade-up fade-up-delay-3 mt-12 mx-auto max-w-3xl">
          <PreviewCard />
        </div>

        <div className="fade-up fade-up-delay-4 mt-12">
          <ToolSearch tools={ALL_TOOLS_FOR_SEARCH} />
        </div>

        <TrustStrip />
      </div>
    </section>
  );
}

function DecorativeThread() {
  // SVG pink thread arcing across the top of the hero. Strokes use a
  // gradient that fades at the edges, creating the impression of a
  // single twine ribbon entering and exiting frame.
  return (
    <svg
      aria-hidden
      className="absolute -top-10 left-0 right-0 w-full h-40 pointer-events-none opacity-70"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hero-thread" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF85BA" stopOpacity="0" />
          <stop offset="20%" stopColor="#FF85BA" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#E0297B" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#FF85BA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FF85BA" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M-50 110 Q 180 30, 380 90 T 700 80 T 1000 110 T 1300 100"
        stroke="url(#hero-thread)"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M-50 130 Q 200 200, 400 110 T 720 130 T 1050 140 T 1300 130"
        stroke="url(#hero-thread)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

function PreviewCard() {
  // CloudConvert-style "console" card with the rotating HeroFlow inside.
  return (
    <div className="relative">
      <div className="absolute -inset-6 sm:-inset-10 loom-halo rounded-[3rem] pointer-events-none" aria-hidden />
      <div className="relative bg-white rounded-3xl border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 sm:p-10 grain">
        <div className="flex items-center justify-between mb-7 sm:mb-10">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pink-200)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pink-300)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pink-500)]" />
            </span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
              twineconvert.console
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pink-700)] hidden sm:block">
            local · 100% private
          </span>
        </div>

        <HeroFlow />

        <div className="mt-8 pt-6 border-t border-dashed border-[var(--color-border)] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
          <span className="inline-flex items-center gap-1.5">
            <CheckGlyph />
            zero upload
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckGlyph />
            wasm-powered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckGlyph />
            no signup
          </span>
        </div>
      </div>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#E0297B" />
      <path d="M7 12.5l3.5 3.5L17 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrustStrip() {
  return (
    <div className="fade-up fade-up-delay-5 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] rounded-2xl overflow-hidden max-w-3xl mx-auto border border-[var(--color-border)]">
      <Stat number={TOTAL_TOOLS.toString()} label="converters" />
      <Stat number="0" label="bytes uploaded" />
      <Stat number="∞" label="file size cap" />
      <Stat number="0.0s" label="server time" />
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-[var(--color-paper)] px-5 py-6">
      <div className="big-number text-3xl sm:text-4xl">{number}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-ink-3)]">{label}</div>
    </div>
  );
}

// ===========================================================================
// POPULAR STRIP (marquee)
// ===========================================================================

function PopularStrip() {
  // The same chips repeated twice so the CSS marquee can loop seamlessly.
  const doubled = [...POPULAR, ...POPULAR];
  return (
    <section className="border-y border-[var(--color-border)] bg-white py-5 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 flex items-center gap-6">
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
          Popular this week
        </span>
        <div className="relative flex-1 overflow-hidden mask-fade">
          <div className="marquee inline-flex gap-3 whitespace-nowrap">
            {doubled.map((p, i) => (
              <Link
                key={`${p.id}-${i}`}
                href={`/${p.id}`}
                className="lift inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-paper)] text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-pink-700)]"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--color-pink-500)]" />
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .mask-fade {
          mask-image: linear-gradient(90deg, transparent 0, black 5%, black 95%, transparent 100%);
        }
      `}</style>
    </section>
  );
}

// ===========================================================================
// PRIVACY MANIFESTO
// ===========================================================================

function PrivacyManifesto() {
  return (
    <section id="privacy" className="relative bg-[var(--color-paper)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14 sm:mb-20">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
            why twineconvert
          </p>
          <h2 className="h-display text-4xl sm:text-5xl lg:text-6xl mt-4 max-w-3xl mx-auto">
            Three things every other converter <span className="h-display-italic">won&apos;t do.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Pillar
            badge="01"
            title="Nothing uploaded."
            body="Every conversion runs in your browser via WebAssembly. Files never travel to a server because there is no server."
          />
          <Pillar
            badge="02"
            title="No file size limit."
            body="The 1–2 GB caps that paid converters use don't apply. Your limit is whatever your browser can handle."
          />
          <Pillar
            badge="03"
            title="No signup, no watermark."
            body="Open source. Every line of conversion code is on GitHub. We can't see what you convert, even if we wanted to."
          />
        </div>
      </div>
    </section>
  );
}

function Pillar({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <article className="lift relative bg-white rounded-2xl border border-[var(--color-border)] p-7 sm:p-8">
      <div className="absolute -top-3 left-7 px-3 py-1 rounded-full bg-[var(--color-pink-500)] text-white text-[10px] font-mono font-bold tracking-[0.2em] uppercase shadow-[var(--shadow-pink)]">
        {badge}
      </div>
      <h3 className="font-display text-2xl font-bold text-[var(--color-ink)] mt-3 tracking-tight">
        {title}
      </h3>
      <p className="mt-3 text-[15px] text-[var(--color-ink-2)] leading-relaxed">{body}</p>
    </article>
  );
}

// ===========================================================================
// CATEGORY GRID
// ===========================================================================

function CategoryGrid() {
  return (
    <section id="tools" className="relative bg-white border-y border-[var(--color-border)]">
      <div className="dot-grid absolute inset-0 opacity-40 pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="flex items-end justify-between mb-12 sm:mb-16 flex-wrap gap-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
              browse the engine
            </p>
            <h2 className="h-display text-4xl sm:text-5xl lg:text-6xl mt-3">
              Pick a <span className="h-display-italic">converter.</span>
            </h2>
            <p className="text-[var(--color-ink-2)] mt-4 max-w-xl text-base sm:text-lg">
              Every tile is a dedicated page with the conversion UI, format guide, and FAQ. {TOTAL_TOOLS} tiles total.
            </p>
          </div>
          <Link
            href="/all-tools"
            className="lift inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-pink-500)] text-white text-sm font-bold shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-600)]"
          >
            See all {TOTAL_TOOLS} alphabetically
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {CATEGORIES.map((cat, i) => (
            <Category key={cat.slug} category={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Category({ category, index }: { category: (typeof CATEGORIES)[number]; index: number }) {
  return (
    <article className="group relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-paper)] hover:bg-white hover:border-[var(--color-pink-200)] transition-all p-6 sm:p-8">
      <header className="flex items-start gap-5 mb-7">
        <CategoryIcon slug={category.slug} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
              ch.{String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ink)] tracking-tight">
              {category.label}
            </h3>
            <span className="text-[11px] font-mono tabular-nums font-bold text-[var(--color-pink-700)] bg-[var(--color-pink-50)] px-2 py-0.5 rounded-md border border-[var(--color-pink-100)]">
              {category.ids.length} tools
            </span>
          </div>
          <p className="text-[15px] text-[var(--color-ink-2)] mt-2.5 leading-relaxed max-w-3xl">
            {category.description}
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {category.ids.map((id) => (
          <li key={id}>
            <Link
              href={`/${id}`}
              className="block px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-colors text-[13px] font-semibold text-[var(--color-ink-2)] truncate"
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
    <section id="why" className="relative bg-[var(--color-paper)] border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
          why in-browser
        </p>
        <h2 className="h-display text-4xl sm:text-5xl mt-3 max-w-2xl">
          The case for not <span className="h-display-italic">uploading</span> your files.
        </h2>
        <div className="mt-8 space-y-5 text-[var(--color-ink-2)] leading-relaxed text-[16px] sm:text-[17px]">
          <p>
            Most online file converters work the same way: you upload your file to their server, their server converts it, you download the result. The trade-off most users don&apos;t think about: <strong className="text-[var(--color-ink)]">your file lives on their server, even if briefly.</strong>
          </p>
          <p>
            That matters more for some files than others. A photo of your dog is one thing. A bank statement, a court filing, a private chat export, a medical scan, an unreleased work draft. Those are files where having a copy land on a third-party server is, at minimum, an unnecessary risk.
          </p>
          <p>
            Twineconvert runs the conversion in your browser using WebAssembly compilations of the same libraries the upload-based converters run on their servers (FFmpeg, libheif, pdfjs, mammoth, web-ifc, jsquash, and a few dozen more). The only difference: the conversion executes on your machine instead of theirs.
          </p>
          <p>
            Practical implications: no upload progress bar, no daily quota, no file size cap, no signup, no email, no &quot;upgrade to convert without watermark.&quot; And the engine is{" "}
            <a
              href="https://github.com/Achraf921/conversionEngine"
              className="text-[var(--color-pink-700)] hover:text-[var(--color-pink-800)] underline decoration-2 underline-offset-4 decoration-[var(--color-pink-300)] hover:decoration-[var(--color-pink-500)]"
            >
              open source
            </a>{" "}
            — anyone can read every line of code that handles a file.
          </p>
        </div>
      </div>
    </section>
  );
}
