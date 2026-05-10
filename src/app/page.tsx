/**
 * Pre-launch placeholder. The full design system, dropzone, per-tool
 * pages, and the white+pink brand identity all ship in the next phase.
 * This page exists only so the deployment pipeline has something
 * non-trivial to render at twineconvert.com while infrastructure
 * stabilizes.
 */

const STATS = {
  converters: 193,
  families: 28,
  tested: 242,
} as const;

const FAMILIES = [
  "Image (HEIC, JPG, PNG, WebP, AVIF, BMP, GIF, SVG, TIFF)",
  "PDF + OCR",
  "Audio + Video (FFmpeg.wasm)",
  "Office docs (DOCX, XLSX, CSV, JSON)",
  "EPUB + Kindle clippings",
  "Finance (OFX, QFX, QBO, QIF)",
  "Apple Health export",
  "WhatsApp + Email + Discord chats",
  "GEDCOM (genealogy)",
  "Bibliography (BibTeX, RIS, NBIB, EndNote)",
  "ADIF + Cabrillo (amateur radio)",
  "Chess PGN",
  "Apple iWork (Pages, Numbers, Keynote)",
  "Color palettes (ASE, ACO, GPL)",
  "LUT (Cube, 3DL, CSP) for color grading",
  "3D meshes (STL, OBJ, 3MF)",
  "MIDI ↔ MusicXML",
  "Embroidery (DST, PES, JEF, EXP)",
  "BIM / IFC (architecture)",
  "PACER court dockets",
  "SARIF security scans",
  "EDI X12 + EDIFACT (B2B logistics)",
  "Twitter / Instagram / Facebook archives",
  "Favicon (ICO) + background removal",
];

export default function Page() {
  return (
    <main style={{
      maxWidth: 720,
      margin: "0 auto",
      padding: "4rem 1.5rem",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      lineHeight: 1.55,
      color: "#0a0a0a",
    }}>
      <header style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          twineconvert
        </h1>
        <p style={{ color: "#525252", marginTop: "0.5rem", fontSize: "1.05rem" }}>
          Convert files in your browser. Nothing uploaded. No signup. No file size limit.
        </p>
      </header>

      <section style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: "1.15rem", margin: 0 }}>
          The engine is shipped. The site goes live shortly.
        </p>
        <p style={{ color: "#525252", marginTop: "0.75rem", fontSize: "0.95rem" }}>
          {STATS.converters} converters across {STATS.families} format families,
          {" "}{STATS.tested} tests passing in CI.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#525252", marginBottom: "1rem" }}>
          Format families landing first
        </h2>
        <ul style={{ paddingLeft: "1.25rem", margin: 0, color: "#262626" }}>
          {FAMILIES.map((f) => (
            <li key={f} style={{ marginBottom: "0.35rem" }}>{f}</li>
          ))}
        </ul>
      </section>

      <footer style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e5e5", color: "#737373", fontSize: "0.85rem" }}>
        Built in the open — every conversion runs on your machine, in your browser, never on a server.
      </footer>
    </main>
  );
}
