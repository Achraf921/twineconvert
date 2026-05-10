import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack root so the parent monorepo's lockfiles don't trigger
  // the "multiple lockfiles detected" warning.
  turbopack: {
    root: resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
