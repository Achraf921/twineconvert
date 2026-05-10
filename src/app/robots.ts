import type { MetadataRoute } from "next";

/**
 * robots.txt, allow everything, point at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://twineconvert.com/sitemap.xml",
    host: "https://twineconvert.com",
  };
}
