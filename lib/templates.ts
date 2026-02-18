// lib/templates.ts — Single source of truth for all template definitions
// Template components are lazy-loaded via components/templates/registry.ts

export interface TemplateDefinition {
  slug: string;
  name: string;
  category: string;
  type: "Gratis" | "Premium";
  thumbnail: string;
  description: string;
  isActive: boolean;
}

export const templates: TemplateDefinition[] = [
  {
    slug: "standard",
    name: "Standard",
    category: "Minimalis",
    type: "Gratis",
    thumbnail: "/templates/standard.png",
    description: "Template undangan minimalis dan elegan dengan layout bersih.",
    isActive: true,
  },
  {
    slug: "classic-premium",
    name: "Classic Premium",
    category: "Klasik",
    type: "Premium",
    thumbnail: "/templates/classic-premium.png",
    description: "Desain klasik premium dengan sentuhan mewah dan detail ornamen.",
    isActive: true,
  },
  {
    slug: "modern-dark",
    name: "Modern Dark",
    category: "Modern",
    type: "Premium",
    thumbnail: "/templates/modern-dark.png",
    description: "Template modern dengan tema gelap yang stylish dan kontemporer.",
    isActive: true,
  },
  {
    slug: "estetik",
    name: "Estetik",
    category: "Estetik",
    type: "Gratis",
    thumbnail: "/templates/estetik.png",
    description: "Desain estetik dengan palet warna lembut dan tipografi cantik.",
    isActive: true,
  },
  {
    slug: "royal-gold",
    name: "Royal Gold",
    category: "Mewah",
    type: "Premium",
    thumbnail: "/templates/royal-gold.png",
    description: "Template bernuansa emas royal dengan ornamen mewah.",
    isActive: true,
  },
  {
    slug: "romantic-elegance",
    name: "Romantic Elegance",
    category: "Romantis",
    type: "Premium",
    thumbnail: "/templates/romantic-elegance.png",
    description: "Desain romantis elegan dengan sentuhan floral lembut.",
    isActive: true,
  },
];

// Helper functions
export function getTemplateBySlug(slug: string): TemplateDefinition | undefined {
  return templates.find((t) => t.slug === slug);
}

export function getActiveTemplates(): TemplateDefinition[] {
  return templates.filter((t) => t.isActive);
}

export function getAllTemplates(): TemplateDefinition[] {
  return templates;
}
