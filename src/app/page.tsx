import Link from "next/link";
import { listToolIds, getMeta } from "@/lib/engine/registry-meta";
import { ToolSearch } from "@/components/ToolSearch";
import { HeroFlow } from "@/components/HeroFlow";

/**
 * Homepage. Hero + the full directory of tools, grouped by category.
 *
 * The category groupings are hand-curated (not auto-derived from
 * registry IDs) because human grouping aids discoverability — a user
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
      "avif-to-jpg", "avif-to-png", "jpg-to-avif", "png-to-avif", "webp-to-avif",
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
    description: "Apple Health, WhatsApp, Discord, Twitter / X, Instagram, Facebook — extract your data into open formats.",
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
// once with the homepage HTML — no API call needed for search to work).
const ALL_TOOLS_FOR_SEARCH = listToolIds().map((id) => ({
  id,
  label: getMeta(id)?.label ?? id,
}));

export default function HomePage() {
  return (
    <>
      <section className="relative hero-glow border-b border-[var(--color-border)]">
        <div className="hero-grid absolute inset-0 opacity-50 pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-pink-100)] text-[var(--color-pink-700)] text-xs font-semibold tracking-wider uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pink-600)] pink-pulse" />
            {TOTAL_TOOLS} converters · runs in your browser · open source
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.05]">
            Convert files in your browser.
            <br />
            <span className="text-[var(--color-pink-600)]">Nothing uploaded.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-2)] mt-6 max-w-2xl mx-auto">
            HEIC, PDF, MP4, DOCX, OFX, EPUB, IFC, MIDI — {TOTAL_TOOLS} converters across {CATEGORIES.length} categories. No upload, no signup, no file size limit. Your file never leaves your device.
          </p>

          <div className="mt-10 flex justify-center">
            <HeroFlow />
          </div>

          <div className="mt-10">
            <ToolSearch tools={ALL_TOOLS_FOR_SEARCH} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--color-text-3)]">
            <span>Popular:</span>
            {[
              { id: "heic-to-jpg", label: "HEIC → JPG" },
              { id: "pdf-to-docx", label: "PDF → DOCX" },
              { id: "mp4-to-mp3", label: "MP4 → MP3" },
              { id: "ofx-to-csv", label: "OFX → CSV" },
            ].map((p) => (
              <Link
                key={p.id}
                href={`/${p.id}`}
                className="px-3 py-1 rounded-full bg-white border border-[var(--color-border)] hover:border-[var(--color-pink-400)] hover:text-[var(--color-pink-700)] transition-colors"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Pillar title="No upload." body="Every conversion runs in your browser via WebAssembly. Files never travel to a server because we don't have one." />
          <Pillar title="No file size limit." body="The 1-2 GB caps that paid converters use don't apply here. Your limit is whatever your browser can handle." />
          <Pillar title="No signup. No watermark. No queue." body="Open source — every line of conversion code is on GitHub. We can't see what you convert, even if we wanted to." />
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)]">All tools</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2">Pick what you need to convert</h2>
          <p className="text-[var(--color-text-2)] mt-3 max-w-2xl mx-auto">
            Every link below is a dedicated tool page with the full conversion UI, format explainer, and FAQ.
          </p>
        </div>
        <div className="space-y-12">
          {CATEGORIES.map((cat) => <Category key={cat.label} category={cat} />)}
        </div>
      </section>

      <section id="why" className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)]">Why in-browser</p>
          <h2 className="text-3xl font-extrabold mt-2">The case for not uploading your files.</h2>
          <div className="mt-6 space-y-5 text-[var(--color-text-2)] leading-relaxed">
            <p>
              Most online file converters work the same way: you upload your file to their server, their server converts it, you download the result. The tradeoff most users don't think about: <strong className="text-[var(--color-text)]">your file lives on their server, even if briefly.</strong>
            </p>
            <p>
              That matters more for some files than others. A photo of your dog is one thing. A bank statement, a court filing, a private chat export, a medical scan, an unreleased work draft — those are files where having a copy land on a third-party server is, at minimum, an unnecessary risk.
            </p>
            <p>
              Twineconvert runs the conversion in your browser using WebAssembly compilations of the same libraries the upload-based converters run on their servers (FFmpeg, libheif, pdfjs, mammoth, web-ifc, jsquash, and a few dozen more). The only difference: the conversion executes on your machine instead of theirs.
            </p>
            <p>
              Practical implications: no upload progress bar, no daily quota, no file size cap, no signup, no email, no "upgrade to convert without watermark." And the engine is <a href="https://github.com/Achraf921/conversionEngine" className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2">open source</a> — anyone can read every line of code that handles a file.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-bold text-[var(--color-text)] text-lg">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-2)] leading-relaxed">{body}</p>
    </div>
  );
}

function Category({ category }: { category: (typeof CATEGORIES)[number] }) {
  return (
    <div>
      <header className="mb-5">
        <h3 className="text-xl font-bold text-[var(--color-text)]">{category.label}</h3>
        <p className="text-sm text-[var(--color-text-2)] mt-1 max-w-2xl">{category.description}</p>
      </header>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {category.ids.map((id) => (
          <li key={id}>
            <Link
              href={`/${id}`}
              className="block px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-all text-sm font-medium text-[var(--color-text-2)]"
            >
              {idToLabel(id)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function idToLabel(id: string): string {
  const parts = id.split("-to-");
  if (parts.length === 2) {
    return `${parts[0].toUpperCase().replace(/-/g, " ")} → ${parts[1].toUpperCase().replace(/-/g, " ")}`;
  }
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
