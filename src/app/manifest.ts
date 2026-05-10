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
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    categories: ["productivity", "utilities"],
  };
}
