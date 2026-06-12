import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Es existiert ein weiteres package-lock.json in C:\Users\luise —
  // Root explizit setzen, damit Turbopack nicht das falsche Verzeichnis wählt.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
