import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "twineconvert is a free, open-source file converter that runs entirely in your browser. Built by one developer because every existing free converter uploads your files to a server.",
  alternates: { canonical: "https://twineconvert.com/about" },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)] mb-2">
        About
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">
        Why this exists
      </h1>

      <div className="space-y-5 text-[var(--color-text-2)] leading-relaxed text-[15px]">
        <p>
          Every other free file converter on the web works the same way: you
          upload your file to their server, their server runs the conversion,
          you download the result. The trade-off most users don&apos;t think
          about: <strong className="text-[var(--color-text)]">a copy of your file lives on their server, even if briefly.</strong>
        </p>
        <p>
          That matters more for some files than others. A photo of your dog?
          Whatever. A bank statement, a court filing, a private chat export,
          a medical scan, an unreleased work draft? Those are files where
          having a copy land on a third-party server is at minimum an
          unnecessary risk.
        </p>
        <p>
          twineconvert runs every conversion in your browser — using
          WebAssembly compilations of the same libraries the upload-based
          converters run on their servers (FFmpeg, libheif, pdfjs, mammoth,
          web-ifc, jsquash, and a few dozen more). The only difference: the
          conversion executes on your machine instead of theirs.
        </p>
        <p>
          Practical implications: no upload progress bar, no daily quota,
          no file size cap, no signup, no email, no &quot;upgrade to convert
          without watermark.&quot;
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text)] pt-6">
          What&apos;s here
        </h2>
        <p>
          192 converters across 28 format families — the standard image / PDF
          / audio / video lineup, plus a long tail of professional and niche
          formats most generic converters don&apos;t bother with: OFX/QFX/QBO
          for personal finance, Apple Health export, Kindle clippings,
          GEDCOM (genealogy), BibTeX/RIS/NBIB (bibliography), ADIF (amateur
          radio), PGN (chess), IFC (BIM/architecture), DST/PES/JEF/EXP
          (embroidery machines), MIDI/MusicXML, ASE/ACO/GPL (color palettes),
          CUBE/3DL/CSP (color grading LUTs), STL/OBJ/3MF (3D meshes), and more.
        </p>
        <p>
          Each conversion has a dedicated page with format explainers, a
          how-to, and the conversion UI itself. <Link href="/" className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2">Browse all 192 →</Link>
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text)] pt-6">
          Open source
        </h2>
        <p>
          The entire conversion engine is{" "}
          <a
            href="https://github.com/Achraf921/conversionEngine"
            className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            on GitHub
          </a>
          . You can read every line of code that handles a file. You can fork
          it, audit it, run it locally without internet access, or fix bugs
          and submit them back. The 192-converter test suite (registry
          integrity, real-file conversion validation, round-trip equivalence,
          adversarial fuzz tests) runs on every commit.
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text)] pt-6">
          What&apos;s next
        </h2>
        <p>
          The roadmap, in roughly priority order: more niche formats based on
          what users ask for, batch conversion (multiple files at once),
          a Progressive Web App install option for full offline use, and a
          Pro tier if/when there&apos;s clear demand for something paid (the
          free tier is permanently free — no bait-and-switch).
        </p>
        <p>
          The engine eventually monetizes via display ads (AdSense → Mediavine
          when traffic is sufficient → Raptive at scale) on the SEO content
          areas of each tool page. The conversions themselves will never have
          ads, watermarks, or premium gates — that stuff erodes the core
          value proposition (convert files in your browser, fast, private,
          free).
        </p>

        <h2 className="text-xl font-bold text-[var(--color-text)] pt-6">
          Get in touch
        </h2>
        <p>
          Bugs, feature requests, format suggestions: open an issue on the{" "}
          <a
            href="https://github.com/Achraf921/conversionEngine/issues"
            className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repo
          </a>
          . That&apos;s the canonical channel for everything.
        </p>
      </div>
    </article>
  );
}
