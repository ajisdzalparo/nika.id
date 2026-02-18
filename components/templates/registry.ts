/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy } from "react";

// Tipe data untuk registry template
export interface TemplateRegistryItem {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

// Registry awal (berisi template yang tersedia)
export const templateRegistry: Record<string, TemplateRegistryItem> = {
  example: {
    name: "example",
    component: lazy(() => import("./example")),
  },
  "classic-premium": {
    name: "Classic Premium",
    component: lazy(() => import("./classic-premium")),
  },
  "modern-dark": {
    name: "Modern Dark",
    component: lazy(() => import("./modern-dark")),
  },
  estetik: {
    name: "Estetik",
    component: lazy(() => import("./estetik")),
  },
  "royal-gold": {
    name: "Royal Gold",
    component: lazy(() => import("./royal-gold")),
  },
  "romantic-elegance": {
    name: "Romantic Elegance",
    component: lazy(() => import("./romantic-elegance")),
  },
  example2: {
    name: "example2",
    component: lazy(() => import("./example2")),
  },
  standard: {
    name: "Standard",
    component: lazy(() => import("./standard")),
  },
};
