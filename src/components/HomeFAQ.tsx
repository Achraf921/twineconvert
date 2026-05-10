const FAQS = [
  {
    q: "Is twineconvert really free?",
    a: "Yes, completely free for every conversion, with no daily quotas, no signup, no upgrade-to-remove-watermark gates. The site runs on display ads in the SEO content areas of each tool page; the conversions themselves never have ads or limits. No paid tier exists.",
  },
  {
    q: "How is it possible that nothing is uploaded?",
    a: "Modern browsers ship a near-complete operating system: WebAssembly runs C / C++ / Rust libraries at near-native speed, the File API reads files directly off your disk, and the Blob API lets us hand the converted file back as a download, all without ever sending bytes to a server. The same libraries (FFmpeg, libheif, pdfjs, mammoth, web-ifc, jsquash, etc.) that upload-based converters run on their servers, we ship as WASM into your browser tab.",
  },
  {
    q: "Is there a file size limit?",
    a: "Practically, your limit is whatever your machine can hold in browser memory, usually 1–4 GB of RAM for the conversion's working set. We don't impose an artificial cap. Upload-based converters typically cap at 1 GB on the free tier because their servers cost money per gigabyte; ours don't, because there are no servers.",
  },
  {
    q: "What about really sensitive files, bank statements, medical records, court documents?",
    a: "Those are exactly the files this site exists for. A bank statement (OFX, QFX, QBO, QIF) or a medical export (Apple Health, DICOM) sitting on a third-party server, even briefly, is an unnecessary risk. Here, the conversion executes locally in your browser tab, we have no server that could store, log, or even see the file.",
  },
  {
    q: "Why are some converters slow?",
    a: "Conversions that involve OCR (image-to-text), heavy video encoding (FFmpeg transcoding), or large 3D meshes (IFC, STL) are CPU-bound and execute on your machine. The WebAssembly runtime is fast (typically 80–95% of native speed) but still bound by your CPU. Upload-based converters feel faster on small files because they trade your privacy for a beefier server; on large files, the upload time often makes them slower overall.",
  },
  {
    q: "Will my browser hang on a big file?",
    a: "The conversion runs in a Web Worker (a background thread), so the page stays responsive while it works. You'll see a progress indicator during long operations. If you do hit a memory ceiling, the tab will reload, your file is never lost because it never left your disk.",
  },
  {
    q: "Do you support batch conversion?",
    a: "Not yet, the current UI is one file at a time per tool page. Batch conversion is on the near-term roadmap; the engine itself is stateless and supports it, the UI just isn't wired up yet.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export function HomeFAQ() {
  return (
    <section id="faq" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)]">FAQ</p>
        <h2 className="text-3xl font-extrabold mt-2">Common questions</h2>
        <dl className="mt-10 space-y-8">
          {FAQS.map((f) => (
            <div key={f.q}>
              <dt className="font-bold text-[var(--color-text)] text-[17px]">{f.q}</dt>
              <dd className="mt-2 text-[var(--color-text-2)] leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
        />
      </div>
    </section>
  );
}
