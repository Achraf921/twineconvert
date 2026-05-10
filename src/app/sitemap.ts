import type { MetadataRoute } from "next";
import { listToolIds } from "@/lib/engine/registry-meta";
import { listFormatKeys } from "@/lib/formats";

/**
 * Programmatic sitemap. One entry per converter route plus the homepage.
 *
 * Next.js generates `/sitemap.xml` automatically from this — no manual
 * XML writing needed. Submit it to Google Search Console once after
 * launch; Google re-crawls daily.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const baseUrl = "https://twineconvert.com";

  const homepage = {
    url: baseUrl,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 1,
  };

  const staticPages = ["about", "all-tools", "privacy", "terms"].map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  const tools = listToolIds().map((id) => ({
    url: `${baseUrl}/${id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const formats = listFormatKeys().map((key) => ({
    url: `${baseUrl}/formats/${key}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [homepage, ...staticPages, ...tools, ...formats];
}
