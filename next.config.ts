import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev indicator is pinned to the bottom-left, which is exactly
  // where the collapsed sidebar's expand control sits — it covers the
  // button and swallows clicks on it. It only exists in development, so
  // turning it off costs nothing and stops it sitting on top of real UI
  // (and in screenshots).
  devIndicators: false,
};

export default nextConfig;
