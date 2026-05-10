import type { MetadataRoute } from "next";

/**
 * robots.txt, allow everything, point at the sitemap. The site has
 * nothing to hide from crawlers (the entire engine is public open
 * source code anyway).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://twineconvert.com/sitemap.xml",
  };
}
