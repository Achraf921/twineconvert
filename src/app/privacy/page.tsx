import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "twineconvert runs entirely in your browser. Your files never leave your device. We collect almost nothing, this page lists exactly what.",
  alternates: { canonical: "https://twineconvert.com/privacy" },
};

/**
 * Privacy policy. Required for AdSense approval and just generally good
 * hygiene. Written in plain language, not lawyer-speak, explaining what
 * actually happens (which is almost nothing because the conversion runs
 * in the browser).
 *
 * Anything we say here we need to keep true forever, if we ever add
 * server-side anything (account features, paid tiers with backend
 * processing), the privacy policy needs to update first, not after.
 */

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 prose prose-neutral">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)] mb-2">
        Privacy
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">
        What we collect (almost nothing)
      </h1>
      <p className="text-sm text-[var(--color-text-3)] mb-10">Last updated May 2026</p>

      <Section title="Files you convert">
        <p>
          <strong>Files you convert are never uploaded to our servers.</strong>{" "}
          The entire conversion runs in your browser using JavaScript and
          WebAssembly. We don&apos;t have servers handling files because there&apos;s
          no server-side step in any conversion route.
        </p>
        <p>
          This means we cannot see, log, store, or recover what you convert ,
          even if we wanted to. The same conversion library that runs on
          CloudConvert&apos;s servers (FFmpeg, libheif, pdfjs, mammoth, etc.)
          runs on your machine instead.
        </p>
      </Section>

      <Section title="Logs and analytics">
        <p>
          We keep standard server access logs (IP address, page URL, timestamp,
          browser user-agent) for the static pages you visit. These logs are
          rotated automatically and used only for debugging deployment issues
          and counting page views per route.
        </p>
        <p>
          We do not use Google Analytics, Mixpanel, Heap, FullStory, or any
          session-recording service. There is no individual-level tracking
          across pages or sessions.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          twineconvert sets <strong>no cookies of its own</strong>. We do not
          have accounts, login state, or personalization that would require
          cookies.
        </p>
        <p>
          When advertising launches on the site (which is the eventual revenue
          model), the ad provider, Google AdSense initially, Mediavine or
          Raptive once we hit their traffic threshold, will set their own
          cookies for ad measurement. Those cookies are governed by the
          provider&apos;s privacy policy, and we&apos;ll update this page when
          ads go live with a clear opt-out path.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>
          The site loads its conversion libraries (FFmpeg.wasm core, pdfjs
          worker, web-ifc WASM) from a public CDN (unpkg.com) the first time
          you use a tool that needs them. The CDN sees your IP address as part
          of any normal HTTP request. After the first load these files are
          cached in your browser and served from disk.
        </p>
        <p>
          The site is hosted on Vercel; Vercel sees the same standard server
          access logs described above.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Because we don&apos;t collect personal data, there&apos;s nothing
          for you to request, delete, or correct. If you have questions, the
          GitHub repository at{" "}
          <a
            href="https://github.com/Achraf921/conversionEngine"
            className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/Achraf921/conversionEngine
          </a>{" "}
          is the project&apos;s home, you can read every line of code that
          handles a file, and open an issue if something looks off.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we ever add server-side anything (paid tiers, accounts, file
          history), this page will be updated <strong>before</strong> the
          change ships, not after. The current commit history of this file
          lives in the open-source repo, so any changes are public-record.
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
