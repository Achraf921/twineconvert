import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dropzone } from "@/components/Dropzone";
import { getMeta } from "@/lib/engine/registry-meta";

/**
 * Embeddable widget. Designed to be dropped into someone else's page
 * via iframe. Contains only the conversion UI plus a small attribution
 * link back to the full tool page (the backlink is the whole point).
 *
 * Bloggers embed it via:
 *   <iframe src="https://twineconvert.com/embed/heic-to-jpg"
 *           width="100%" height="500"
 *           style="border:0; border-radius: 12px;"
 *           allow="clipboard-write"></iframe>
 */

interface Params {
  tool: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tool } = await params;
  const meta = getMeta(tool);
  return {
    title: meta ? `${meta.label} embed` : "Embed",
    // No-index the embed page itself; we want links to the full tool
    // page to rank, not the bare-bones embed version.
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tool } = await params;
  const meta = getMeta(tool);
  if (!meta) notFound();

  return (
    <div className="min-h-screen bg-white px-4 py-4 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
        <Dropzone toolId={tool} toolLabel={meta.label} accept={meta.accept} />
      </div>

      {/* Attribution footer. The backlink is what makes this whole
       *  embed strategy worth building. Plain <a> with no rel="nofollow"
       *  so search engines count it as a real authority signal. */}
      <footer className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-ink-3)]">
        <Link
          href={`https://twineconvert.com/${tool}`}
          target="_blank"
          rel="noopener"
          className="hover:text-[var(--color-pink-700)] transition-colors"
        >
          {meta.label} on twineconvert
        </Link>
        <Link
          href="https://twineconvert.com"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 hover:text-[var(--color-pink-700)] transition-colors"
        >
          Powered by <strong className="font-semibold">twineconvert</strong>
        </Link>
      </footer>
    </div>
  );
}
