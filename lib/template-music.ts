import { prisma } from "@/lib/prisma";
import type { TemplateDefaultMusic } from "@/lib/catalog-shared";

export interface ResolvedMusic {
  enabled: true;
  type: "youtube" | "upload";
  url: string;
}

/**
 * Music for a template preview:
 * 1. the template's own music (set in the template CMS) overrides everything;
 * 2. otherwise the first active track of the super admin's default music library;
 * 3. otherwise no music.
 */
export async function resolveTemplateMusic(templateMusic: TemplateDefaultMusic | null | undefined): Promise<ResolvedMusic | null> {
  if (templateMusic?.url) return { enabled: true, type: templateMusic.type, url: templateMusic.url };

  try {
    const track = await prisma.defaultMusic.findFirst({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { type: true, url: true },
    });
    if (track?.url) return { enabled: true, type: track.type === "youtube" ? "youtube" : "upload", url: track.url };
  } catch (error) {
    console.error("Failed to load default music:", error);
  }
  return null;
}
