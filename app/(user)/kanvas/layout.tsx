import type { ReactNode } from "react";
import { FeatureGate } from "@/components/common/feature-gate";

// Status is set by admin (Pengaturan › Status fitur): maintenance or coming soon replaces these pages
export default function Layout({ children }: { children: ReactNode }) {
  return <FeatureGate feature="KANVAS">{children}</FeatureGate>;
}
