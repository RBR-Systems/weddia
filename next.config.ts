import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        // Rewrite all non-API paths back to root so SPA handles routing
        source: "/((?!api|_next|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
