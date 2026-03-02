import type { NextConfig } from "next";

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.quadrorama.com.br",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "web.archive.org",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/store/:path*", destination: `${MEDUSA_BACKEND_URL}/store/:path*` },
      { source: "/auth/:path*", destination: `${MEDUSA_BACKEND_URL}/auth/:path*` },
      { source: "/admin/:path*", destination: `${MEDUSA_BACKEND_URL}/admin/:path*` },
      { source: "/health", destination: `${MEDUSA_BACKEND_URL}/health` },
    ];
  },
};

export default nextConfig;
