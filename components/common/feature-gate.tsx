import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { FeatureLockedView } from "@/components/common/feature-locked-view";
import { getFeature, type FeatureId, type FeatureStatus } from "@/lib/features";
import { getFeatureStatus } from "@/lib/system-settings";

/** Notice shown instead of a feature that is in maintenance or not launched yet. */
export function FeatureUnavailable({ feature, status }: { feature: FeatureId; status: Exclude<FeatureStatus, "ACTIVE"> }) {
  const { label, description } = getFeature(feature);
  const maintenance = status === "MAINTENANCE";
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#E9DDC6] bg-[#FFFDF9] p-8 text-center shadow-[0_24px_60px_-36px_rgba(90,64,24,.4)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6424]">{maintenance ? "Sedang perbaikan" : "Segera hadir"}</p>
        <h1 className="mt-2 font-serif text-3xl font-medium leading-tight text-[#1F1A14]">{label}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5E5446]">
          {maintenance
            ? "Fitur ini sedang kami perbaiki agar lebih nyaman dipakai. Silakan coba lagi beberapa saat lagi."
            : `${description} Fitur ini sedang kami siapkan dan akan segera bisa kamu pakai.`}
        </p>
        <Link href="/dashboard" className={buttonVariants({ variant: "ink", className: "mt-6 h-11 px-6" })}>
          <IconArrowLeft size={16} /> Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

/**
 * Wrap a feature's pages (in its folder's layout.tsx). Renders the pages while the feature is active;
 * otherwise keeps the real page UI visible as a read-only preview with a top notice and blocked actions.
 */
export async function FeatureGate({ feature, children }: { feature: FeatureId; children: ReactNode }) {
  const status = await getFeatureStatus(feature);
  if (status === "ACTIVE") return <>{children}</>;
  const { label } = getFeature(feature);
  return (
    <FeatureLockedView label={label} status={status}>
      {children}
    </FeatureLockedView>
  );
}
