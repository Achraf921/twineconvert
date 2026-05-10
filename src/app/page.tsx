import Link from "next/link";
import { listToolIds, getMeta } from "@/lib/engine/registry-meta";
import { ToolSearch } from "@/components/ToolSearch";
import { HeroFlow } from "@/components/HeroFlow";
import { HomeFAQ } from "@/components/HomeFAQ";

/**
 * Homepage. Hero + the full directory of tools, grouped by category.
 *
 * The category groupings are hand-curated (not auto-derived from
 * registry IDs) because human grouping aids discoverability, a user
 * looking for "Apple Health export" doesn't think "I want a CSV
 * converter," they think "I want my health data."
 */

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
    description: "Apple Health, WhatsApp, Discord, Twitter / X, Instagram, Facebook, extract your data into open formats.",
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
    description: "Convert .eml/.mbox to PDF for archiving. OFX/QFX/QBO/QIF bank statements to CSV for any spreadsheet.",
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
    label: "Design, color, 3D, music notation, embroidery",
    description: "Adobe ASE palettes. Color grading LUTs. STL/OBJ/3MF mesh interchange. MIDI ↔ MusicXML. DST/PES/JEF/EXP for Singer, Brother, Janome, Bernina embroidery machines.",
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

// Pre-compute the tool list for the search component (server-side, sent
// once with the homepage HTML, no API call needed for search to work).
const ALL_TOOLS_FOR_SEARCH = listToolIds().map((id) => ({
  id,
  label: getMeta(id)?.label ?? id,
}));

export default function HomePage() {
  return (
    <>
      <section className="relative hero-glow overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            <div className="lg:col-span-7 fade-up">
              <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--color-pink-200)] text-[var(--color-pink-700)] text-[11px] font-bold tracking-wider uppercase shadow-[var(--shadow-sm)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pink-600)] pink-pulse" />
                {TOTAL_TOOLS} converters &middot; in-browser &middot; open source
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mt-6 leading-[0.98]">
                Convert files
                <br />
                <span className="pink-underline text-[var(--color-text)]">without uploading</span>
                <br />
                them.
              </h1>
              <p className="text-lg sm:text-xl text-[var(--color-text-2)] mt-8 max-w-xl leading-relaxed">
                HEIC, PDF, MP4, DOCX, OFX, EPUB, IFC, MIDI. <span className="font-semibold text-[var(--color-text)]">{TOTAL_TOOLS} converters</span> across {CATEGORIES.length} categories. Nothing uploaded, no signup, no file size cap.
              </p>
              <div className="mt-8 fade-up fade-up-delay-2">
                <ToolSearch tools={ALL_TOOLS_FOR_SEARCH} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-3)]">
                <span className="font-medium">Popular:</span>
                {[
                  { id: "heic-to-jpg", label: "HEIC → JPG" },
                  { id: "pdf-to-docx", label: "PDF → DOCX" },
                  { id: "mp4-to-mp3", label: "MP4 → MP3" },
                  { id: "ofx-to-csv", label: "OFX → CSV" },
                  { id: "compress-pdf", label: "Compress PDF" },
                ].map((p) => (
                  <Link
                    key={p.id}
                    href={`/${p.id}`}
                    className="lift px-3 py-1 rounded-full bg-white border border-[var(--color-border)] text-[var(--color-text-2)] font-medium hover:text-[var(--color-pink-700)]"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md fade-up fade-up-delay-3">
                <HeroStat number={TOTAL_TOOLS.toString()} label="converters" />
                <HeroStat number="0" label="bytes uploaded" />
                <HeroStat number="∞" label="file size cap" />
              </div>
            </div>

            <div className="lg:col-span-5 fade-up fade-up-delay-1">
              <div className="relative">
                <div className="absolute -inset-8 dropzone-ring rounded-[3rem] pointer-events-none" />
                <div className="relative bg-white rounded-3xl border border-[var(--color-border-2)] p-8 shadow-[var(--shadow-lg)]">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pink-600)]">Live preview</span>
                    <span className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-border-2)]" />
                      <span className="w-2 h-2 rounded-full bg-[var(--color-pink-300)]" />
                      <span className="w-2 h-2 rounded-full bg-[var(--color-pink-600)]" />
                    </span>
                  </div>
                  <HeroFlow />
                  <p className="mt-6 text-sm text-[var(--color-text-3)] text-center leading-relaxed">
                    Every conversion below runs in <strong className="text-[var(--color-text-2)]">this tab</strong>, not on a server. Click any to start.
                  </p>
                </div>
                <DecorativeArrow />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="relative bg-gradient-to-b from-[var(--color-pink-50)]/40 to-[var(--color-bg)] border-y border-[var(--color-pink-100)]">
        <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0 md:divide-x divide-[var(--color-pink-100)]">
          <Pillar
            badge="01"
            title="Nothing uploaded."
            body="Every conversion runs in your browser via WebAssembly. Files never travel to a server because there is no server."
          />
          <Pillar
            badge="02"
            title="No file size limit."
            body="The 1-2 GB caps that paid converters use don't apply. Your limit is whatever your browser can handle."
          />
          <Pillar
            badge="03"
            title="No signup. No watermark. No queue."
            body="Open source. Every line of conversion code is on GitHub. We can't see what you convert, even if we wanted to."
          />
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pink-600)]">Browse the engine</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-2 tracking-tight">Pick a converter.</h2>
            <p className="text-[var(--color-text-2)] mt-3 max-w-xl">
              Every tile is a dedicated page with the conversion UI, format guide, and FAQ.
            </p>
          </div>
          <Link
            href="/all-tools"
            className="lift inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[var(--color-border-2)] text-sm font-semibold text-[var(--color-text)]"
          >
            See all 192 alphabetically
            <span className="text-[var(--color-pink-600)]">→</span>
          </Link>
        </div>
        <div className="space-y-10">
          {CATEGORIES.map((cat, i) => <Category key={cat.label} category={cat} index={i} />)}
        </div>
      </section>

      <HomeFAQ />

      <section id="why" className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)]">Why in-browser</p>
          <h2 className="text-3xl font-extrabold mt-2">The case for not uploading your files.</h2>
          <div className="mt-6 space-y-5 text-[var(--color-text-2)] leading-relaxed">
            <p>
              Most online file converters work the same way: you upload your file to their server, their server converts it, you download the result. The tradeoff most users don&apos;t think about: <strong className="text-[var(--color-text)]">your file lives on their server, even if briefly.</strong>
            </p>
            <p>
              That matters more for some files than others. A photo of your dog is one thing. A bank statement, a court filing, a private chat export, a medical scan, an unreleased work draft, those are files where having a copy land on a third-party server is, at minimum, an unnecessary risk.
            </p>
            <p>
              Twineconvert runs the conversion in your browser using WebAssembly compilations of the same libraries the upload-based converters run on their servers (FFmpeg, libheif, pdfjs, mammoth, web-ifc, jsquash, and a few dozen more). The only difference: the conversion executes on your machine instead of theirs.
            </p>
            <p>
              Practical implications: no upload progress bar, no daily quota, no file size cap, no signup, no email, no &quot;upgrade to convert without watermark.&quot; And the engine is <a href="https://github.com/Achraf921/conversionEngine" className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2">open source</a>, anyone can read every line of code that handles a file.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="big-number text-4xl sm:text-5xl">{number}</div>
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-3)] mt-1">{label}</div>
    </div>
  );
}

function DecorativeArrow() {
  return (
    <svg
      aria-hidden
      className="hidden lg:block absolute -left-12 top-1/2 -translate-y-1/2 w-12 h-12 text-[var(--color-pink-400)]"
      viewBox="0 0 48 48"
      fill="none"
    >
      <path
        d="M2 24 Q 14 14 24 24 T 46 24 M40 18 L46 24 L40 30"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pillar({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <div className="px-6 py-2 md:px-10">
      <div className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-pink-600)]">— {badge}</div>
      <h3 className="font-extrabold text-[var(--color-text)] text-xl mt-3 tracking-tight">{title}</h3>
      <p className="mt-3 text-[15px] text-[var(--color-text-2)] leading-relaxed">{body}</p>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  Image: "🖼",
  "PDF & Documents": "📄",
  "Audio & Video": "🎬",
  "EPUB & E-readers": "📚",
  "Personal data exports": "🔐",
  "Email & finance": "✉️",
  "Genealogy, citations, ham radio, chess": "🌳",
  "Design, color, 3D, music notation, embroidery": "🎨",
  "Architecture, legal, security, B2B": "🏛",
};

function Category({ category, index }: { category: (typeof CATEGORIES)[number]; index: number }) {
  const icon = CATEGORY_ICONS[category.label] ?? "•";
  return (
    <article className="bg-white rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 hover:border-[var(--color-pink-200)] transition-colors">
      <header className="flex items-start gap-4 mb-6">
        <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-pink-50)] to-[var(--color-pink-100)] border border-[var(--color-pink-200)] text-2xl">
          <span aria-hidden>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight">
              {String(index + 1).padStart(2, "0")} &nbsp; {category.label}
            </h3>
            <span className="text-xs font-semibold tabular-nums text-[var(--color-pink-700)] bg-[var(--color-pink-50)] px-2 py-0.5 rounded-md border border-[var(--color-pink-100)]">
              {category.ids.length} tools
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-2)] mt-2 leading-relaxed">{category.description}</p>
        </div>
      </header>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {category.ids.map((id) => (
          <li key={id}>
            <Link
              href={`/${id}`}
              className="lift block px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-white hover:text-[var(--color-pink-700)] text-sm font-semibold text-[var(--color-text-2)]"
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
