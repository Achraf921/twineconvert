import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFormat, listFormatKeys } from "@/lib/formats";
import { listToolIds, getMeta } from "@/lib/engine/registry-meta";

interface Params {
  format: string;
}

export const dynamicParams = true;
export const revalidate = false;

export async function generateStaticParams(): Promise<Params[]> {
  return listFormatKeys().map((format) => ({ format }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { format } = await params;
  const profile = getFormat(format);
  if (!profile) return { title: "Format not found" };
  const url = `https://twineconvert.com/formats/${format}`;
  return {
    title: `${profile.name} (${profile.fullName}), format guide & converters`,
    description: `${profile.name} explained: what it is, how to open it, and every converter we offer that reads or writes ${profile.name}. ${profile.primaryUse}`,
    alternates: { canonical: url },
    openGraph: {
      title: `${profile.name}, ${profile.fullName}`,
      description: profile.description.slice(0, 160),
      url,
      type: "article",
    },
  };
}

function findRelatedTools(formatKey: string): { from: string[]; to: string[] } {
  const all = listToolIds();
  const from: string[] = [];
  const to: string[] = [];
  for (const id of all) {
    const parts = id.split("-to-");
    if (parts.length !== 2) continue;
    if (parts[0] === formatKey) from.push(id);
    if (parts[1] === formatKey) to.push(id);
  }
  return { from, to };
}

const STRUCTURED_DATA = (profile: ReturnType<typeof getFormat>, format: string) => ({
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  name: profile?.name,
  alternateName: profile?.fullName,
  description: profile?.description,
  url: `https://twineconvert.com/formats/${format}`,
});

export default async function FormatPage({ params }: { params: Promise<Params> }) {
  const { format } = await params;
  const profile = getFormat(format);
  if (!profile) notFound();

  const { from, to } = findRelatedTools(format);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA(profile, format)) }}
      />

      <nav className="text-xs text-[var(--color-text-3)] mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--color-text-2)] transition-colors">Home</Link>
        {" / "}
        <Link href="/all-tools" className="hover:text-[var(--color-text-2)] transition-colors">Formats</Link>
        {" / "}
        <span className="text-[var(--color-text-2)] font-medium">{profile.name}</span>
      </nav>

      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)] mb-2">
        Format guide
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">
        {profile.name}
      </h1>
      <p className="text-lg text-[var(--color-text-3)] mb-10">{profile.fullName}</p>

      <section className="space-y-5 text-[var(--color-text-2)] leading-relaxed text-[15px]">
        <p className="text-base">{profile.description}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-3 text-[var(--color-text)]">How to open a {profile.name} file</h2>
        <p className="text-[var(--color-text-2)] leading-relaxed text-[15px]">{profile.howToOpen}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-3 text-[var(--color-text)]">Primary use</h2>
        <p className="text-[var(--color-text-2)] leading-relaxed text-[15px]">{profile.primaryUse}</p>
      </section>

      {to.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold mb-5 text-[var(--color-text)]">
            Convert other formats to {profile.name}
          </h2>
          <ToolGrid ids={to} />
        </section>
      )}

      {from.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-5 text-[var(--color-text)]">
            Convert {profile.name} to other formats
          </h2>
          <ToolGrid ids={from} />
        </section>
      )}

      <section className="mt-16 pt-8 border-t border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-3)]">
          Looking for something else? Browse the{" "}
          <Link href="/all-tools" className="text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] underline underline-offset-2">
            full list of 192 converters
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

function ToolGrid({ ids }: { ids: string[] }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {ids.map((id) => {
        const meta = getMeta(id);
        return (
          <li key={id}>
            <Link
              href={`/${id}`}
              className="block px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-all text-sm font-medium text-[var(--color-text-2)]"
            >
              {meta?.label ?? id}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
