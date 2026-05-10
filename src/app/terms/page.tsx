import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Plain-language terms of use for twineconvert, a free, open-source, in-browser file conversion tool.",
  alternates: { canonical: "https://twineconvert.com/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)] mb-2">
        Terms
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">
        The rules, short version
      </h1>
      <p className="text-sm text-[var(--color-text-3)] mb-10">Last updated May 2026</p>

      <Section title="Use the tool">
        <p>
          Drop a file in, get a converted file out. That&apos;s the whole deal.
          You don&apos;t need an account. There&apos;s no usage limit. Convert
          your own files or files you have permission to convert, we
          can&apos;t check, but it&apos;s on you.
        </p>
      </Section>

      <Section title="What we promise">
        <p>
          We aim for the conversion to produce a reasonable result for any
          well-formed input file. The engine is open source so you can read
          (or improve) the conversion code yourself. We test 192 converters
          on every push to main with structural validation, round-trip
          equivalence, and adversarial fuzz tests.
        </p>
        <p>
          We do <strong>not</strong> promise the conversion will be perfect
          for every file. Some conversions are inherently lossy (e.g. PDF to
          DOCX necessarily flattens layout). The output may not be a
          byte-for-byte equivalent in every case. Verify important
          conversions before relying on them.
        </p>
      </Section>

      <Section title="What we don't promise">
        <ul className="list-disc pl-5 space-y-2">
          <li>Uptime. The site is hosted on Vercel and the static files are CDN-served, but we don&apos;t guarantee a service-level agreement.</li>
          <li>That every browser will work. We test in current Chrome/Safari/Firefox. Older browsers may not have the WebAssembly or Canvas APIs some converters need.</li>
          <li>That your file is safe to convert. If you drop in a corrupted or malicious file, the conversion may fail or behave unexpectedly. The engine validates file shapes but is not an antivirus.</li>
        </ul>
      </Section>

      <Section title="Your responsibility">
        <p>
          You&apos;re responsible for:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Having the legal right to convert the files you drop in (copyrighted material, etc.)</li>
          <li>Verifying the converted output is correct for your use case before submitting it anywhere important (court filings, official documents, etc.)</li>
          <li>Not using the tool to violate anyone else&apos;s rights or applicable laws</li>
        </ul>
      </Section>

      <Section title="Liability">
        <p>
          twineconvert is a free tool provided as-is. We&apos;re not liable
          for losses arising from conversion errors, format incompatibilities,
          or the output not meeting your expectations. The conversion engine
          is open source, anyone can audit it, fork it, or fix it. If you
          find a bug, file an issue on GitHub.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms. Material changes will land in the public
          GitHub repo first; the current version is always what&apos;s on this
          page.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-3 text-[var(--color-text)]">{title}</h2>
      <div className="space-y-4 text-[var(--color-text-2)] leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}
