import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "satumoment.com",
      },
      {
        protocol: "https",
        hostname: "files.satumoment.com",
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
