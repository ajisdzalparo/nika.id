/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy } from "react";

// Tipe data untuk registry template
export interface TemplateRegistryItem {
  name: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

// Registry awal (kosong atau berisi template default)
export const templateRegistry: Record<string, TemplateRegistryItem> = {  "example": {
    name: "example",
    component: lazy(() => import("./example")),
  },
};
