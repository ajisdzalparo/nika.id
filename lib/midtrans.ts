import midtransClient from "midtrans-client";
import { getSystemSettings } from "@/lib/system-settings";

export async function getMidtransConfig() {
  const settings = await getSystemSettings();
  const enabled = Boolean(settings.midtransServerKey && settings.midtransClientKey);
  return {
    enabled,
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
