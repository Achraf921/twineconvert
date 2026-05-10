import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 32 32" fill="none">
          <circle cx="11" cy="16" r="7" stroke="#E0297B" strokeWidth="2.5" />
          <circle cx="21" cy="16" r="7" stroke="#E0297B" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="2" fill="#E0297B" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
