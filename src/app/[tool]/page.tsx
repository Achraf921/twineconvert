import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/ToolPage";
import { getMeta } from "@/lib/engine/registry-meta";
import { getProfilesForToolId } from "@/lib/formats";

/**
 * Per-tool dynamic route. ISR-style: we pre-render the most popular
 * routes at build time (small set), and let the long tail render on
 * first visit and cache forever after (`dynamicParams: true`).
 *
 * Why: pre-rendering all 192 routes blew up local builds with 10G+
 * memory pressure as the bundler tried to chunk every WASM-heavy
 * lazy-loaded converter at once. ISR gives us the SEO benefit of
 * static HTML for high-traffic pages without paying the upfront cost
 * for every long-tail tool.
 *
 * The first user to hit a long-tail route waits ~1-2 sec for the
 * initial render; everyone after gets it from the CDN edge cache.
 */

interface Params {
  tool: string;
}

// Pre-render only the highest-traffic routes at build time. The rest
// render on first request and cache (`dynamicParams: true` is the
// default; explicit here for clarity).
const PRE_RENDER_AT_BUILD = [
  "heic-to-jpg", "heic-to-png", "heic-to-webp",
  "pdf-to-jpg", "pdf-to-png", "pdf-to-text", "pdf-to-docx",
  "jpg-to-pdf", "png-to-pdf",
  "docx-to-pdf", "compress-pdf",
  "mp4-to-mp3", "mov-to-mp4", "wav-to-mp3", "mp4-to-gif",
  "jpg-to-png", "png-to-jpg", "png-to-webp", "webp-to-jpg",
  "ofx-to-csv", "qfx-to-csv",
  "apple-health-to-csv", "kindle-clippings-to-csv",
];

export const dynamicParams = true;
// Cache the rendered page indefinitely once produced; new deploys
// invalidate by virtue of the build id changing.
export const revalidate = false;

export async function generateStaticParams(): Promise<Params[]> {
  // Only return the popular routes for build-time pre-rendering.
  // Long-tail routes get rendered on demand thanks to dynamicParams.
  return PRE_RENDER_AT_BUILD.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tool } = await params;
  const meta = getMeta(tool);
  if (!meta) return { title: "Tool not found" };

  const profiles = getProfilesForToolId(tool);
  const isBidir = tool.includes("-to-");
  const url = `https://twineconvert.com/${tool}`;

  let title: string;
  let description: string;

  if (profiles) {
    const inputName = profiles.input.name;
    const outputName = profiles.output.name;
    title = `${inputName} to ${outputName} converter, free, in your browser`;
    description = `Convert ${inputName} to ${outputName} for free. Runs entirely in your browser, your file never leaves your device. No upload, no signup, no file size limit.`;
  } else if (isBidir) {
    const [inKey, outKey] = tool.split("-to-");
    const inputName = inKey.toUpperCase();
    const outputName = outKey.toUpperCase();
    title = `${inputName} to ${outputName} converter, free, in your browser`;
    description = `Convert ${inputName} to ${outputName} for free. Runs entirely in your browser, your file never leaves your device. No upload, no signup, no file size limit.`;
  } else {
    // Single-action tools: compress-pdf, remove-background, image-to-text-equivalent.
    // Use the human-curated label from the registry instead of slug-mangling.
    title = `${meta.label}, free, in your browser`;
    description = `${meta.label} for free. Runs entirely in your browser, your file never leaves your device. No upload, no signup, no file size limit.`;
  }

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${meta.label} converter, twineconvert`,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.label} converter, twineconvert`,
      description,
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tool } = await params;
  const meta = getMeta(tool);
  if (!meta) notFound();
  return <ToolPage toolId={tool} meta={meta} />;
}
