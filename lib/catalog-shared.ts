// Catalog constants and types that are safe to import from client components.
import type { AiTheme } from "@/lib/ai-design/schema";

export const CATALOG_CATEGORIES = ["Adat", "Minimalis", "Floral", "Elegan", "Islami", "Vintage", "Luxury", "Modern"] as const;

export interface TemplateDefaultMusic {
  type: "youtube" | "upload";
  url: string;
  title?: string;
}

/** Shape sent to clients (public pages never see referenceUrl). */
export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  kind: "ENGINE" | "CODE";
  theme: AiTheme | null;
  defaultMusic: TemplateDefaultMusic | null;
  componentSlug: string | null;
  thumbnail: string | null;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
  usageCount: number;
}
