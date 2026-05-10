import { ImageResponse } from "next/og";
import { getMeta } from "@/lib/engine/registry-meta";
import { getProfilesForToolId } from "@/lib/formats";

/**
 * Per-tool Open Graph image generator. Renders a 1200x630 PNG for
 * each /[tool] route, used as the preview when someone shares the
 * URL on Twitter, LinkedIn, Discord, Slack, or any other site that
 * reads OG metadata. Without this, every share shows the generic
 * Vercel logo.
 *
 * The image is fully static (built at the same time as the page)
 * and cached forever. No runtime cost per share.
 */

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "twineconvert, convert files in your browser";

export default async function Image({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = getMeta(tool);
  const profiles = getProfilesForToolId(tool);
  const isBidir = tool.includes("-to-");
  const inputName =
    profiles?.input.name ?? (isBidir ? tool.split("-to-")[0].toUpperCase() : "");
  const outputName =
    profiles?.output.name ?? (isBidir ? tool.split("-to-")[1].toUpperCase() : "");

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
        {/* Top band, logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="https://twineconvert.com/logo.png" width={64} height={64} alt="" />
          <span style={{ fontSize: 36, fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.02em" }}>
            twineconvert
          </span>
        </div>

        {/* Center, the conversion pair (or just the label, for single-action tools) */}
        {isBidir ? (
          <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 40 }}>
            <FormatChip name={inputName} />
            <ArrowIcon />
            <FormatChip name={outputName} accent />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 56px",
              borderRadius: 28,
              background: "#E0297B",
              color: "#ffffff",
              fontSize: 60,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              boxShadow: "0 16px 32px -8px rgba(224, 41, 123, 0.35)",
              alignSelf: "flex-start",
              marginTop: 40,
            }}
          >
            {meta?.label ?? "Convert files"}
          </div>
        )}

        {/* Bottom, value prop */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#0A0A0A",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            {isBidir ? `Convert ${inputName} to ${outputName}` : meta?.label ?? "Convert files"}
          </div>
          <div style={{ fontSize: 28, color: "#525252", fontWeight: 400 }}>
            In your browser. Nothing uploaded. Free, no signup.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

function FormatChip({ name, accent = false }: { name: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 200,
        height: 200,
        borderRadius: 24,
        background: accent ? "#E0297B" : "#FAFAFA",
        border: accent ? "none" : "2px solid #E5E5E5",
        boxShadow: accent
          ? "0 16px 32px -8px rgba(224, 41, 123, 0.35)"
          : "0 4px 12px -2px rgba(0, 0, 0, 0.05)",
        fontSize: 48,
        fontWeight: 700,
        color: accent ? "#ffffff" : "#0A0A0A",
        letterSpacing: "-0.02em",
      }}
    >
      {name.length <= 8 ? name : name.slice(0, 7) + "…"}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 5l7 7-7 7"
        stroke="#E0297B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
