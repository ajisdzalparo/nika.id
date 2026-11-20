import midtransClient from "midtrans-client";
import { getSystemSettings } from "@/lib/system-settings";

export async function getMidtransConfig() {
  const settings = await getSystemSettings();
  // `enabled`: keys are configured (webhooks and status checks keep working for open payments).
  // `checkoutEnabled`: admins also allow new Midtrans payments.
  const enabled = Boolean(settings.midtransServerKey && settings.midtransClientKey);
  return {
    enabled,
    checkoutEnabled: enabled && settings.midtransEnabled,
    serverKey: settings.midtransServerKey,
    clientKey: settings.midtransClientKey,
    isProduction: settings.midtransIsProduction,
  };
}

export async function getMidtransClients() {
  const cfg = await getMidtransConfig();
  return {
    ...cfg,
    snap: new midtransClient.Snap({
      isProduction: cfg.isProduction,
      serverKey: cfg.serverKey,
      clientKey: cfg.clientKey,
    }),
    core: new midtransClient.CoreApi({
      isProduction: cfg.isProduction,
      serverKey: cfg.serverKey,
      clientKey: cfg.clientKey,
    }),
  };
}
