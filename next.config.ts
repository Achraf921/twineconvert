import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack root so the parent monorepo's lockfiles don't trigger
  // the "multiple lockfiles detected" warning.
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
