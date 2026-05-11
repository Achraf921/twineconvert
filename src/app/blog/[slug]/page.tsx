import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getPostSlugs } from "@/lib/blog/posts";
import { getMeta } from "@/lib/engine/registry-meta";

/**
 * Per-post page. Renders the MDX content inside our standard post
 * template (title + meta + body + related-tools sidebar).
 *
 * Pre-renders every PUBLISHED post at build time. Posts with future
 * publishDate are excluded from generateStaticParams so they 404
 * until the day they go live (the daily cron rebuild surfaces them).
 *
 * JSON-LD Article schema is added back in a follow-up commit; the page
 * already supplies all the metadata Google needs via the standard meta
 * tags and OpenGraph, so the rich-snippet upgrade is nice-to-have.
 */

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  return getPostSlugs().map((slug) => ({ slug }));
}

// New posts go live via the daily cron rebuild; no need for on-demand revalidation.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  const url = `https://twineconvert.com/blog/${slug}`;
  return {
    title: `${post.frontmatter.title}, twineconvert`,
    description: post.frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      url,
      type: "article",
      publishedTime: post.frontmatter.publishDate,
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedTools = (post.frontmatter.relatedTools ?? [])
    .map((id) => ({ id, meta: getMeta(id) }))
    .filter((t): t is { id: string; meta: NonNullable<ReturnType<typeof getMeta>> } => !!t.meta);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-xs text-[var(--color-text-3)] mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-[var(--color-text-2)] transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/blog" className="hover:text-[var(--color-text-2)] transition-colors">
              Blog
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mb-10 border-b border-[var(--color-border)] pb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-ink)] leading-tight">
          {post.frontmatter.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-2)]">
          {post.frontmatter.description}
        </p>
        <p className="mt-4 text-xs uppercase tracking-wider text-[var(--color-ink-3)] font-mono">
          <time dateTime={post.frontmatter.publishDate}>
            {new Date(post.frontmatter.publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span aria-hidden> &middot; </span>
          {post.readingTimeMinutes} min read
        </p>
      </header>

      <article className="post-body">
        <MDXRemote source={post.content} />
      </article>

      {relatedTools.length > 0 && (
        <aside className="mt-16 border-t border-[var(--color-border)] pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-pink-600)] mb-4">
            Related converters
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedTools.map(({ id, meta }) => (
              <li key={id}>
                <Link
                  href={`/${id}`}
                  className="block px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-all"
                >
                  <p className="font-medium text-[var(--color-text)]">{meta.label}</p>
                  <p className="text-xs text-[var(--color-text-3)] mt-1">/{id}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <aside className="mt-12">
        <Link
          href="/blog"
          className="text-sm text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)]"
        >
          ← All posts
        </Link>
      </aside>
    </div>
  );
}
