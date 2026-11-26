import { NextResponse } from "next/server";
import { FEATURE_STATUS_LABEL, getFeature, type FeatureId } from "@/lib/features";
import { getFeatureStatus } from "@/lib/system-settings";

/**
 * Put at the top of a feature's write handlers:
 *   const blocked = await featureBlockedResponse("WA_BLAST"); if (blocked) return blocked;
 * Returns null while the feature is active, otherwise a 503 the client can show as-is.
 */
export async function featureBlockedResponse(feature: FeatureId): Promise<NextResponse | null> {
  const status = await getFeatureStatus(feature);
  if (status === "ACTIVE") return null;
  const { label } = getFeature(feature);
  const message =
    status === "MAINTENANCE"
      ? `${label} sedang dalam perbaikan. Coba lagi beberapa saat lagi.`
      : `${label} segera hadir. Fitur ini belum bisa dipakai.`;
  return NextResponse.json(
    { error: status === "MAINTENANCE" ? "FEATURE_MAINTENANCE" : "FEATURE_COMING_SOON", status, statusLabel: FEATURE_STATUS_LABEL[status], message },
    { status: 503 },
  );
}
