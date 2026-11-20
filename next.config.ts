import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "undanginyuk.ajisdzalparo.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Local MinIO (docker-compose) for uploads in development
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
