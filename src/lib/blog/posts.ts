/**
 * Blog post loader. Reads MDX files from `content/blog/*.mdx`, parses
 * frontmatter via gray-matter, and exposes:
 *   - getAllPosts(): all posts whose publishDate <= today
 *   - getPostBySlug(slug): one post by slug, or null
 *   - getPostSlugs(): just the slugs of published posts (for static
 *     param generation in the dynamic route)
 *
 * The publishDate filter is the core of the scheduled-publishing system:
 * we write all 60 posts upfront with future dates, then a daily Vercel
 * cron rebuild gradually exposes them as their dates arrive. Posts with
 * future dates exist in the filesystem but are invisible to /blog,
 * /blog/<slug>, the sitemap, and the RSS feed.
 *
 * One source of truth: content/blog/<slug>.mdx with frontmatter. No
 * database, no CMS, just files in the repo so the whole publishing
 * pipeline is git-tracked + reproducible.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const POSTS_DIR = join(process.cwd(), "content/blog");

export interface PostFrontmatter {
  /** Display title (also the <h1>). */
  title: string;
  /** Short summary used as meta description and as the listing-page snippet. */
  description: string;
  /**
   * ISO date string (`YYYY-MM-DD`). Posts with publishDate > today are
   * hidden from all listings, the sitemap, and the per-post route. Day
   * boundary is UTC midnight to keep behavior deterministic across
   * server regions.
   */
  publishDate: string;
  /** Optional tags for related-post lookups. */
  tags?: string[];
  /**
   * Optional related-tool ids from the converter registry. We render a
   * "Try this converter" sidebar linking each one. Use slugs like
   * "heic-to-jpg".
   */
  relatedTools?: string[];
  /** Optional override for the listing-page hero image. */
  ogImage?: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTimeMinutes: number;
}

function getRawPosts(): Array<{ slug: string; raw: string }> {
  let files: string[];
  try {
    files = readdirSync(POSTS_DIR);
  } catch {
    // Directory doesn't exist yet (no posts written). That's fine; pre-launch state.
    return [];
  }
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ""),
      raw: readFileSync(join(POSTS_DIR, file), "utf8"),
    }));
}

function isPublished(frontmatter: PostFrontmatter, now: Date = new Date()): boolean {
  // Posts with no publishDate are treated as draft (never published).
  if (!frontmatter.publishDate) return false;
  // Compare as UTC dates so the cron firing at midnight UTC reveals the day's posts.
  const publish = new Date(`${frontmatter.publishDate}T00:00:00.000Z`);
  return publish.getTime() <= now.getTime();
}

export function getAllPosts(): Post[] {
  const now = new Date();
  return getRawPosts()
    .map(({ slug, raw }) => {
      const { data, content } = matter(raw);
      const frontmatter = data as PostFrontmatter;
      const rt = readingTime(content);
      return {
        slug,
        frontmatter,
        content,
        readingTimeMinutes: Math.max(1, Math.round(rt.minutes)),
      };
    })
    .filter((p) => isPublished(p.frontmatter, now))
    .sort((a, b) =>
      a.frontmatter.publishDate < b.frontmatter.publishDate ? 1 : -1,
    );
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
