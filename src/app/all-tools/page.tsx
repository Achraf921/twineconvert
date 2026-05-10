import type { Metadata } from "next";
import Link from "next/link";
import { listToolIds, getMeta } from "@/lib/engine/registry-meta";

export const metadata: Metadata = {
  title: "All 192 file converters",
  description:
    "Complete alphabetical list of every file converter on twineconvert. HEIC, PDF, MP4, DOCX, XLSX, OFX, EPUB, IFC, MIDI, GEDCOM, ASE, STL — every conversion runs in your browser.",
  alternates: { canonical: "https://twineconvert.com/all-tools" },
};

interface Group {
  letter: string;
  tools: Array<{ id: string; label: string }>;
}

function buildGroups(): Group[] {
  const all = listToolIds()
    .map((id) => ({ id, label: getMeta(id)?.label ?? id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const groups: Record<string, Array<{ id: string; label: string }>> = {};
  for (const t of all) {
    const first = t.label[0]?.toUpperCase() ?? "?";
    const key = /[A-Z]/.test(first) ? first : "0–9";
    (groups[key] ??= []).push(t);
  }
  return Object.keys(groups)
    .sort()
    .map((letter) => ({ letter, tools: groups[letter] }));
}

const GROUPS = buildGroups();
const TOTAL = GROUPS.reduce((acc, g) => acc + g.tools.length, 0);

export default function AllToolsPage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-pink-600)] mb-2">
        All tools
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight">
        Every converter on twineconvert
      </h1>
      <p className="mt-3 text-[var(--color-text-2)] max-w-2xl">
        {TOTAL} converters, alphabetical. Every one runs entirely in your
        browser — files never upload, no signup, no daily limit.
      </p>

      <nav aria-label="Letter index" className="mt-8 flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <a
            key={g.letter}
            href={`#group-${g.letter}`}
            className="px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-2)] hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-all"
          >
            {g.letter}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        {GROUPS.map((g) => (
          <section key={g.letter} id={`group-${g.letter}`}>
            <h2 className="text-2xl font-bold text-[var(--color-pink-600)] sticky top-16 bg-white/90 backdrop-blur-sm py-2 -mx-6 px-6 z-10 border-b border-[var(--color-border)]">
              {g.letter}
            </h2>
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {g.tools.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.id}`}
                    className="block px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-all text-sm font-medium text-[var(--color-text-2)]"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
