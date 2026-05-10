/**
 * ToolPage, the per-tool page template.
 *
 * Server component (zero JS shipped for the SEO-critical content). The
 * only client component is <Dropzone>, which handles the actual file
 * conversion in the browser.
 *
 * Takes static metadata (label, accept, fromMime, toMime), does NOT
 * dynamically import the converter implementation. The Dropzone client
 * component loads the actual converter at the moment the user clicks
 * "Convert," via the runtime registry.
 */

import Link from "next/link";
import { Dropzone } from "./Dropzone";
import { CompetitorComparison } from "./CompetitorComparison";
import { HeroFlow } from "./HeroFlow";
import type { ConverterMeta } from "@/lib/engine/registry-meta";
import { listToolIds } from "@/lib/engine/registry-meta";
import { getProfilesForToolId, type FormatProfile } from "@/lib/formats";
import { getOtherInputsForOutput, getOtherOutputsForInput } from "@/lib/related-tools";
import { buildFormatGraph } from "@/lib/dropzone-routes";

// Build the format graph once at module load; it's pure-data so safe to
// memoize at the file level.
const FORMAT_GRAPH = buildFormatGraph(listToolIds());

interface Props {
  toolId: string;
  meta: ConverterMeta;
}

export function ToolPage({ toolId, meta }: Props) {
  const profiles = getProfilesForToolId(toolId);
  const inputProfile = profiles?.input;
  const outputProfile = profiles?.output;
  const otherInputs = getOtherInputsForOutput(toolId, 12);
  const otherOutputs = getOtherOutputsForInput(toolId, 12);

  return (
    <>
      <StructuredData toolId={toolId} meta={meta} inputProfile={inputProfile} outputProfile={outputProfile} />

      <section className="relative hero-wash overflow-hidden">
        <div className="subtle-grid absolute inset-0 opacity-60 pointer-events-none" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 pt-10 pb-14 sm:pt-14 sm:pb-20 text-center">
          <Breadcrumbs label={meta.label} />

          <p className="fade-up mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--color-pink-200)] text-[var(--color-pink-700)] text-[11px] font-bold tracking-[0.18em] uppercase shadow-[var(--shadow-xs)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pink-600)] pink-pulse" />
            free &middot; in-browser &middot; no upload
          </p>

          <h1 className="fade-up fade-up-delay-1 mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.02] text-[var(--color-ink)]">
            {meta.label.replace(/→/g, "to")}
            <br />
            <span className="text-[var(--color-pink-600)]">Converter</span>
          </h1>
          <p className="fade-up fade-up-delay-2 mt-6 text-lg sm:text-xl text-[var(--color-ink-2)] max-w-2xl mx-auto leading-relaxed">
            {heroSubhead(meta.label, inputProfile, outputProfile)}
          </p>

          {/* Interactive chip-pair picker, defaulted to THIS tool's pair.
              Lets the user pivot to a different input/output without
              navigating back to the homepage. */}
          {pairFromLabel(meta.label) && (
            <div className="fade-up fade-up-delay-2 mt-14">
              <HeroFlow
                graph={FORMAT_GRAPH}
                initialInput={pairFromLabel(meta.label)?.[0]}
                initialOutput={pairFromLabel(meta.label)?.[1]}
              />
            </div>
          )}

          <div className="fade-up fade-up-delay-3 mt-10 flex items-center gap-4 max-w-md mx-auto">
            <span className="flex-1 h-px bg-[var(--color-border)]" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--color-ink-3)]">
              or drop your file
            </span>
            <span className="flex-1 h-px bg-[var(--color-border)]" aria-hidden />
          </div>

          <div className="fade-up fade-up-delay-3 mt-6 mx-auto">
            <Dropzone
              toolId={toolId}
              toolLabel={meta.label}
              accept={meta.accept}
            />
            <div className="mt-6 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
              <span className="inline-flex items-center gap-1.5">
                <CheckMark /> nothing uploaded
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckMark /> no file size cap
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckMark /> no signup
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-2xl font-bold mt-2 mb-8">
          Three steps. No upload, no signup.
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step n={1} title="Drop your file" body={`Click the dropzone above or drag a ${inputProfile?.name ?? "file"} from your desktop. Files of any size, there's no upload, so there's no upload limit.`} />
          <Step n={2} title="Convert in your browser" body={`The conversion runs entirely in this tab using JavaScript and WebAssembly. Your file never touches our servers, we don't have any.`} />
          <Step n={3} title="Download" body={`Get your ${outputProfile?.name ?? "converted file"} the moment the conversion finishes. Convert another, or close the tab.`} />
        </ol>
      </section>

      <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <TrustItem
            title="Files stay on your device"
            body="Your file is never uploaded. The entire conversion runs in your browser using WebAssembly. We can't see what you convert because we have no server to see it."
          />
          <TrustItem
            title="No file size limit"
            body="Server converters cap free users at 1-2 GB and gate larger files behind a paid plan. Since nothing uploads, our limit is whatever your browser can handle."
          />
          <TrustItem
            title="Free, no signup, no ads on conversions"
            body="No account required. No watermark on the output. No queue. Drop a file, get a converted file."
          />
        </div>
      </section>

      {(inputProfile || outputProfile) && (
        <section className="mx-auto max-w-4xl px-6 py-16">
          <SectionLabel>Formats involved</SectionLabel>
          <h2 className="text-2xl font-bold mt-2 mb-8">
            {inputProfile && outputProfile
              ? `About ${inputProfile.name} and ${outputProfile.name}`
              : `About ${inputProfile?.name ?? outputProfile?.name}`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputProfile && (
              <FormatCard profile={inputProfile} slug={toolId.split("-to-")[0]} />
            )}
            {outputProfile && (
              <FormatCard profile={outputProfile} slug={toolId.split("-to-")[1]} />
            )}
          </div>
        </section>
      )}

      {otherInputs.length > 0 && outputProfile && (
        <section className="mx-auto max-w-4xl px-6 py-12">
          <SectionLabel>Related tools</SectionLabel>
          <h2 className="text-2xl font-bold mt-2 mb-6">
            Convert other files to {outputProfile.name}
          </h2>
          <CrossLinkGrid items={otherInputs.map((it) => ({ id: it.id, label: `${it.input.toUpperCase()} → ${outputProfile.name}` }))} />
        </section>
      )}

      {otherOutputs.length > 0 && inputProfile && (
        <section className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="text-2xl font-bold mb-6">
            Convert your {inputProfile.name} to other formats
          </h2>
          <CrossLinkGrid items={otherOutputs.map((it) => ({ id: it.id, label: `${inputProfile.name} → ${it.output.toUpperCase()}` }))} />
        </section>
      )}

      <section className="mx-auto max-w-4xl px-6 py-12">
        <SectionLabel>How we compare</SectionLabel>
        <h2 className="text-2xl font-bold mt-2 mb-6">
          {meta.label} vs the alternatives
        </h2>
        <CompetitorComparison />
      </section>

      <section className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-2xl font-bold mt-2 mb-8">Common questions</h2>
          <FAQList items={faqItems(meta.label, inputProfile, outputProfile)} />
        </div>
      </section>
    </>
  );
}

function heroSubhead(label: string, input?: FormatProfile, output?: FormatProfile): string {
  if (!input || !output) {
    return `Convert ${label} in your browser. Nothing uploaded, no signup, no file size limit.`;
  }
  return `Drop your ${input.name} file. We'll convert it to ${output.name} right here in your browser, your file never leaves your device.`;
}

function faqItems(label: string, input?: FormatProfile, output?: FormatProfile) {
  const items: Array<{ q: string; a: string }> = [
    {
      q: `Is this ${label} converter really free?`,
      a: `Yes. No signup, no watermark, no daily file count limit. Every conversion runs in your browser, your file never touches our servers because there are no servers.`,
    },
    {
      q: `Where does my file go when I convert it?`,
      a: `Nowhere. The conversion runs entirely in your browser using JavaScript and WebAssembly. Your file is never uploaded to our servers. We don't have any servers handling files, there's nothing for us to log, store, or accidentally leak.`,
    },
    {
      q: `What's the maximum file size?`,
      a: `Whatever your browser can hold in memory. Practically, this means a few hundred MB on most computers, significantly larger than the 1-2 GB caps that server-upload converters charge for. Very large files (multi-GB) may require closing other browser tabs first.`,
    },
  ];

  if (input && output) {
    items.push({
      q: `Why convert ${input.name} to ${output.name}?`,
      a: `${input.primaryUse} ${output.primaryUse} The most common reason to convert is compatibility, ${output.name} works in places where ${input.name} doesn't, or vice versa.`,
    });
  }

  if (input) {
    items.push({
      q: `How do I open a ${input.name} file in the first place?`,
      a: input.howToOpen,
    });
  }

  items.push({
    q: `Does this work offline?`,
    a: `Once the page is loaded, the conversion itself runs entirely offline. The first time you use a tool, your browser downloads the conversion library (a one-time cache). If you reload while offline, the page won't load, but you can install the site as a Progressive Web App for full offline use.`,
  });

  items.push({
    q: `Can I convert multiple files at once?`,
    a: `Single file at a time for now. Batch conversion is on the roadmap, for now, drop one file, download the result, then convert the next.`,
  });

  return items;
}

/** Extract (input, output) from a tool label like "HEIC → JPG". Returns
 *  null for single-action tools whose chip widget would be meaningless. */
function pairFromLabel(label: string): [string, string] | null {
  if (!label.includes("→")) return null;
  const [from, to] = label.split("→").map((s) => s.trim().toUpperCase());
  // Skip compound names that wouldn't fit the chip picker UI
  if (from.includes(" ") || to.includes(" ") || from.includes("-") || to.includes("-")) return null;
  return [from, to];
}

function Breadcrumbs({ label }: { label: string }) {
  return (
    <nav className="text-xs text-[var(--color-text-3)]" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-2">
        <li>
          <Link href="/" className="hover:text-[var(--color-text-2)] transition-colors">Home</Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href="/all-tools" className="hover:text-[var(--color-text-2)] transition-colors">Tools</Link>
        </li>
        <li aria-hidden>/</li>
        <li className="text-[var(--color-text-2)] font-medium">{label}</li>
      </ol>
    </nav>
  );
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--color-pink-600)]">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)]">
      <span className="w-1 h-1 rounded-full bg-[var(--color-pink-600)]" />
      {children}
    </p>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <div className="w-8 h-8 rounded-full bg-[var(--color-pink-100)] text-[var(--color-pink-700)] font-semibold flex items-center justify-center text-sm">
        {n}
      </div>
      <h3 className="mt-4 font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-2)] leading-relaxed">{body}</p>
    </li>
  );
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-[var(--color-text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-2)] leading-relaxed">{body}</p>
    </div>
  );
}

function FormatCard({ profile, slug }: { profile: FormatProfile; slug: string }) {
  return (
    <article className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold text-[var(--color-text)]">{profile.name}</span>
        <span className="text-sm text-[var(--color-text-3)]">, {profile.fullName}</span>
      </div>
      <p className="mt-4 text-sm text-[var(--color-text-2)] leading-relaxed">{profile.description}</p>
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)] mb-2">How to open</p>
        <p className="text-sm text-[var(--color-text-2)] leading-relaxed">{profile.howToOpen}</p>
      </div>
      <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
        <Link
          href={`/formats/${slug}`}
          className="text-sm font-medium text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] inline-flex items-center gap-1"
        >
          Full {profile.name} format guide →
        </Link>
      </div>
    </article>
  );
}

function CrossLinkGrid({ items }: { items: Array<{ id: string; label: string }> }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {items.map((it) => (
        <li key={it.id}>
          <Link
            href={`/${it.id}`}
            className="block px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-all text-sm font-medium text-[var(--color-text-2)]"
          >
            {it.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FAQList({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <details
          key={i}
          className="group rounded-lg border border-[var(--color-border)] bg-white p-5 open:bg-[var(--color-pink-50)] open:border-[var(--color-pink-200)] transition-colors"
        >
          <summary className="cursor-pointer font-medium text-[var(--color-text)] list-none flex items-start justify-between gap-4">
            <span>{item.q}</span>
            <svg className="w-5 h-5 text-[var(--color-text-3)] group-open:rotate-180 transition-transform shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="mt-3 text-sm text-[var(--color-text-2)] leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function StructuredData({
  toolId,
  meta,
  inputProfile,
  outputProfile,
}: {
  toolId: string;
  meta: ConverterMeta;
  inputProfile?: FormatProfile;
  outputProfile?: FormatProfile;
}) {
  const url = `https://twineconvert.com/${toolId}`;
  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${meta.label} Converter, twineconvert`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: heroSubhead(meta.label, inputProfile, outputProfile),
  };
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to convert ${meta.label}`,
    step: [
      { "@type": "HowToStep", position: 1, name: "Drop your file", text: `Click the dropzone or drag a file from your desktop.` },
      { "@type": "HowToStep", position: 2, name: "Convert in your browser", text: "The conversion runs entirely in your browser using JavaScript and WebAssembly." },
      { "@type": "HowToStep", position: 3, name: "Download", text: `Get your converted file the moment the conversion finishes.` },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems(meta.label, inputProfile, outputProfile).map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://twineconvert.com" },
      { "@type": "ListItem", position: 2, name: meta.label, item: url },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
    </>
  );
}
