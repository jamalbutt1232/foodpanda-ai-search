import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev-mode "N" badge so it doesn't appear in demo screen recordings.
  devIndicators: false,
};

export default nextConfig;
