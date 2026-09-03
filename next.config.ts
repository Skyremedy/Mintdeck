import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Pin the workspace root: a package-lock.json above the repo would otherwise
  // make Turbopack guess the wrong project root.
  turbopack: { root: path.resolve(".") },
}

export default nextConfig
