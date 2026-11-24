import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SatuMoment · Undangan Digital",
    short_name: "SatuMoment",
    description: "Buat undangan digital yang elegan untuk setiap momen.",
    start_url: "/",
    display: "standalone",
    background_color: "#FCF8F1",
    theme_color: "#1A1510",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
