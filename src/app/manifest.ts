import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "twineconvert",
    short_name: "twineconvert",
    description:
      "Free in-browser file converter — 192 tools, no upload, no signup, no file size limit.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#E0297B",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    categories: ["productivity", "utilities"],
  };
}
