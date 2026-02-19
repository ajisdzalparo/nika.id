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
    name: "Minimalist White",
    category: "Minimalist",
    type: "Gratis",
    thumbnail: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?q=80&w=800&auto=format&fit=crop",
    description: "Template undangan minimalis dan elegan dengan layout bersih.",
    isActive: true,
  },
  {
    slug: "classic-premium",
    name: "Floral Blossom",
    category: "Vintage",
    type: "Premium",
    thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop",
    description: "Desain klasik premium dengan sentuhan mewah dan detail ornamen.",
    isActive: true,
  },
  {
    slug: "modern-dark",
    name: "Modern Dark",
    category: "Elegant",
    type: "Premium",
    thumbnail: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
    description: "Template modern dengan tema gelap yang stylish dan kontemporer.",
    isActive: true,
  },
  {
    slug: "estetik",
    name: "Estetik",
    category: "Pastel",
    type: "Gratis",
    thumbnail: "https://images.unsplash.com/photo-1522673607200-164883eecd0c?q=80&w=800&auto=format&fit=crop",
    description: "Desain estetik dengan palet warna lembut dan tipografi cantik.",
    isActive: true,
  },
  {
    slug: "royal-gold",
    name: "Golden Royale",
    category: "Luxury",
    type: "Premium",
    thumbnail: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
    description: "Template bernuansa emas royal dengan ornamen mewah.",
    isActive: true,
  },
  {
    slug: "romantic-elegance",
    name: "Romantic Elegance",
    category: "Modern",
    type: "Premium",
    thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
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
