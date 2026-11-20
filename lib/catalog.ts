import { prisma } from "@/lib/prisma";
import { templates as codeTemplates } from "@/lib/templates";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import { normalizeTheme } from "@/lib/ai-design/color";
import { CATALOG_CATEGORIES, type CatalogItem, type TemplateDefaultMusic } from "@/lib/catalog-shared";

export { CATALOG_CATEGORIES, type CatalogItem, type TemplateDefaultMusic };

export const CATALOG_TIERS = ["Gratis", "Premium"] as const;

type Row = Awaited<ReturnType<typeof prisma.catalogTemplate.findMany>>[number];

// Older code templates used English category names; show them under the Indonesian ones.
const CATEGORY_ALIASES: Record<string, string> = { Elegant: "Elegan", Minimalist: "Minimalis", Pastel: "Floral" };
const normalizeCategory = (c: string) => CATEGORY_ALIASES[c] ?? c;

function parseDefaultMusic(raw: unknown): TemplateDefaultMusic | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { type?: unknown; url?: unknown; title?: unknown };
  if (typeof r.url !== "string" || !r.url.trim()) return null;
  return {
    type: r.type === "youtube" ? "youtube" : "upload",
    url: r.url.trim(),
    ...(typeof r.title === "string" && r.title.trim() ? { title: r.title.trim() } : {}),
  };
}

export function toCatalogItem(row: Row): CatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: normalizeCategory(row.category),
    tier: row.tier,
    kind: row.kind === "CODE" ? "CODE" : "ENGINE",
    theme: row.kind === "CODE" || !row.theme ? null : normalizeTheme(row.theme),
    defaultMusic: parseDefaultMusic(row.defaultMusic),
    componentSlug: row.componentSlug,
    thumbnail: row.thumbnail,
    isFeatured: row.isFeatured,
    isNew: row.isNew,
    sortOrder: row.sortOrder,
    usageCount: row.usageCount,
  };
}

const PRESET_META: Record<string, { category: string; tier: string; featured?: boolean; description: string }> = {
  "malam-keemasan": { category: "Luxury", tier: "Premium", featured: true, description: "Hitam pekat dengan emas berkilau, flourish di setiap sudut, dan foto pasangan sebagai sampul." },
  "kawung-sogan": { category: "Adat", tier: "Premium", featured: true, description: "Motif kawung, cokelat sogan dan emas tua, dengan bingkai garis ganda khas Jawa." },
  "taman-pastel": { category: "Floral", tier: "Gratis", featured: true, description: "Hijau sage dan dedaunan, ringan dan segar seperti pesta kebun pagi hari." },
  "sekar-arum": { category: "Elegan", tier: "Gratis", description: "Krem hangat dengan sentuhan emas lembut dan foto berbingkai lengkung." },
};

let seeding: Promise<void> | null = null;

/** Fills an empty catalog with the built-in code templates and the AI theme presets (runs once). */
export function ensureCatalogSeeded() {
  seeding ??= (async () => {
    if ((await prisma.catalogTemplate.count()) > 0) return;
    const presets = Object.entries(AI_THEME_PRESETS).map(([slug, { theme }], i) => ({
      slug,
      name: theme.name,
      description: PRESET_META[slug]?.description ?? theme.mood,
      category: PRESET_META[slug]?.category ?? "Elegan",
      tier: PRESET_META[slug]?.tier ?? "Gratis",
      kind: "ENGINE",
      theme,
      isFeatured: PRESET_META[slug]?.featured ?? false,
      isNew: true,
      sortOrder: i,
    }));
    const code = codeTemplates
      .filter((t) => !t.hidden && t.isActive)
      .map((t, i) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        category: normalizeCategory(t.category),
        tier: t.type,
        kind: "CODE",
        componentSlug: t.slug,
        thumbnail: t.thumbnail,
        sortOrder: 100 + i,
      }));
    await prisma.catalogTemplate.createMany({ data: [...presets, ...code], skipDuplicates: true });
  })().catch((e) => {
    seeding = null;
    throw e;
  });
  return seeding;
}

export async function getCatalog({ includeInactive = false } = {}) {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogTemplate.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toCatalogItem);
}

export async function getCatalogItem(slug: string) {
  await ensureCatalogSeeded();
  const row = await prisma.catalogTemplate.findUnique({ where: { slug } });
  return row ? toCatalogItem(row) : null;
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "template"
  );
}
