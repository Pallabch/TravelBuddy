import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "../..");

// Neon deploy writes DATABASE_URL and the other service variables at the
// repo root. Next only reads env files in this app directory on its own.
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["@travel-buddy/db"],
  serverExternalPackages: ["pg"],
  turbopack: {
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
