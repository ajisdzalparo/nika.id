import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Only the public marketing pages. Invitations are personal (noindex) and the app itself sits behind login.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/desain"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/garansi"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/syarat-layanan"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/kebijakan-privasi"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
