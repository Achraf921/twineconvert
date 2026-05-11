import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog/posts";

/**
 * Per-blog-post Open Graph image generator. Without this, blog post
 * shares on Twitter/Slack/Discord show text-only previews (twitter:card
 * is set to summary_large_image but with no image present, the platform
 * falls back to the basic text card or nothing at all).
 *
 * Renders a 1200x630 PNG with the post title prominently, the brand
 * mark, and the same dot-pattern background as the tool pages so the
 * site visual identity stays consistent.
 *
 * Edge runtime + static caching: built once per post, served from
 * Vercel's CDN forever.
 */

// Node runtime (not edge): the post loader reads MDX from the filesystem
// at build time via getPostBySlug → readFileSync, which edge runtime
// cannot do. Generated once at build time per slug and cached.
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "twineconvert blog post";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.frontmatter.title ?? "twineconvert blog";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #FCE7F3 1px, transparent 0)",
          backgroundSize: "32px 32px",
          padding: "80px",
          justifyContent: "space-between",
          fontFamily: "system-ui",
        }}
      >
        {/* Top: logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="https://twineconvert.com/logo.png" width={64} height={64} alt="" />
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#0A0A0A",
              letterSpacing: "-0.02em",
            }}
          >
            twineconvert
          </span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 22,
              fontWeight: 500,
              color: "#A3A3A3",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            blog
          </span>
        </div>

        {/* Center: the post title, large + bold */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 56 : title.length > 40 ? 64 : 72,
            fontWeight: 800,
            color: "#0A0A0A",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            marginTop: 40,
          }}
        >
          {title}
        </div>

        {/* Bottom: brand strip with the pink accent */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              background: "#E0297B",
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Read on twineconvert.com
          </div>
          <span style={{ fontSize: 22, color: "#525252", fontWeight: 400 }}>
            Free file conversion in your browser
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
