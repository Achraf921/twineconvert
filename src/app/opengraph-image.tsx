import { ImageResponse } from "next/og";

/**
 * Homepage Open Graph image. Branded landing card shown when twineconvert.com
 * is shared anywhere with link previews.
 */

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "twineconvert — convert files in your browser";

export default function Image() {
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
            "radial-gradient(ellipse 80% 60% at 90% 0%, rgba(252, 231, 243, 0.6) 0%, transparent 50%), radial-gradient(circle at 1px 1px, #FCE7F3 1px, transparent 0)",
          backgroundSize: "100% 100%, 32px 32px",
          padding: "80px",
          justifyContent: "center",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <circle cx="11" cy="16" r="7" stroke="#E0297B" strokeWidth="2.5" />
            <circle cx="21" cy="16" r="7" stroke="#E0297B" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="2" fill="#E0297B" />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.02em" }}>
            twineconvert
          </span>
        </div>

        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "#0A0A0A",
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            marginBottom: 32,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Convert files in your browser.</span>
          <span style={{ color: "#E0297B" }}>Nothing uploaded.</span>
        </div>

        <div style={{ fontSize: 32, color: "#525252", maxWidth: 900 }}>
          192 converters across 28 format families. Free, no signup, no file size limit.
        </div>
      </div>
    ),
    { ...size },
  );
}
