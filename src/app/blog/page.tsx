import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";

/**
 * Blog index. Lists every published post in reverse chronological order.
 * Static-rendered at build time; the daily Vercel cron rebuild surfaces
 * newly-arrived scheduled posts here as their publishDate passes.
 */

export const metadata: Metadata = {
  title: "Blog, twineconvert",
  description:
    "Guides on file conversion, specific format quirks, and workflows for everyone from photographers to academics. No upload, in your browser, always free.",
  alternates: { canonical: "https://twineconvert.com/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="border-b border-[var(--color-border)] pb-8 mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-ink)]">
          The <span className="text-[var(--color-pink-600)]">twineconvert</span> Blog
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-2)] max-w-2xl">
          Practical guides on file formats, conversion workflows, and the
          weird quirks of every tool we ship. Written from real use cases,
          not search-engine bait.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-[var(--color-ink-3)]">No posts yet. Check back soon.</p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {posts.map((post) => (
            <li key={post.slug} className="py-6 first:pt-0">
              <article>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block hover:bg-[var(--color-pink-50)]/40 -mx-4 px-4 py-2 rounded-lg transition-colors"
                >
                  <h2 className="text-2xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-pink-700)] transition-colors">
                    {post.frontmatter.title}
                  </h2>
                  <p className="mt-2 text-[var(--color-ink-2)] leading-relaxed">
                    {post.frontmatter.description}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wider text-[var(--color-ink-3)] font-mono">
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
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
