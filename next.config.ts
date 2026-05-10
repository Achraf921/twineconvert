import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack root so the parent monorepo's lockfiles don't trigger
  // the "multiple lockfiles detected" warning.
  turbopack: {
    root: resolve(__dirname),
  },
  // Stub Node-only modules for browser-side bundles. Several of our
  // converters (twitter-archive-reader, postal-mime fallbacks, web-ifc
  // tooling) optionally import `fs` / `path` / `child_process` for their
  // Node code path; in the browser those imports never execute (the
  // browser code path branches first), so stubbing them out lets webpack
  // bundle the file without bailing.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
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
