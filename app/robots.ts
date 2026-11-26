import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";

// Private app areas stay out of the crawl. Invitation pages (/[slug]) are public links but carry their own noindex.
const PRIVATE_PATHS = [
  "/admin",
  "/api/",
  "/dashboard",
  "/editor",
  "/kanvas",
  "/desain-ai",
  "/pilih-template",
  "/undangan",
  "/upgrade",
  "/dompet",
  "/pengaturan",
  "/manajemen-tamu",
  "/buku-tamu",
  "/check-in",
  "/wa-blast",
  "/masukan",
  "/mitra",
  "/isi-data/",
  "/hadir/",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verification-sent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
