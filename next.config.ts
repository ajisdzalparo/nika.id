import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Baseline security headers for every response. No CSP yet: Midtrans Snap, YouTube embeds and inline
  // theme scripts would need a carefully tested policy first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Our own pages may frame each other (editor previews); other sites may not frame us
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera for the check-in QR scanner, location for the venue picker; nothing else
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(self)" },
        ],
      },
    ];
  },
  // Old mock template gallery; the real catalog lives at /desain
  async redirects() {
    return [{ source: "/templates", destination: "/desain", permanent: true }];
  },
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
