import { prisma } from "@/lib/prisma";

export interface BankAccount {
  bank: string;
  number: string;
  holder: string;
}

export interface PaymentAndContactSettings {
  maintenanceMode: boolean;
  manualWhatsapp: string;
  manualBanks: BankAccount[];
  midtransServerKey: string;
  midtransClientKey: string;
  midtransIsProduction: boolean;
  /** Per-method switches set by the super admin (all on by default) */
  manualTransferEnabled: boolean;
  manualQrisEnabled: boolean;
  /** Static QRIS image (merchant QR) for manual payments, uploaded by the admin */
  manualQrisImage: string;
  midtransEnabled: boolean;
}

const KEYS = {
  maintenanceMode: "maintenance_mode",
  manualWhatsapp: "manual_whatsapp",
  manualBanks: "manual_banks",
  midtransServerKey: "midtrans_server_key",
  midtransClientKey: "midtrans_client_key",
  midtransIsProduction: "midtrans_is_production",
  manualTransferEnabled: "manual_transfer_enabled",
  manualQrisEnabled: "manual_qris_enabled",
  manualQrisImage: "manual_qris_image",
  midtransEnabled: "midtrans_enabled",
} as const;

function parseEnvBanks(): BankAccount[] {
  return (process.env.MANUAL_PAYMENT_BANKS || "")
    .split(";")
    .map((row) => row.split("|").map((x) => x.trim()))
    .filter((p) => p.length === 3 && p.every(Boolean))
    .map(([bank, number, holder]) => ({ bank, number, holder }));
}

function parseBanksJson(raw: string | undefined): BankAccount[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item) => ({
        bank: typeof item?.bank === "string" ? item.bank.trim() : "",
        number: typeof item?.number === "string" ? item.number.trim() : "",
        holder: typeof item?.holder === "string" ? item.holder.trim() : "",
      }))
      .filter((b) => b.bank && b.number && b.holder);
  } catch {
    return null;
  }
}

async function readSettingMap(keys: string[]): Promise<Record<string, string>> {
  try {
    // Support both freshly generated PrismaClient and an already-running dev server via raw SQL fallback.
    const model = (prisma as unknown as {
      systemSetting?: {
        findMany: (args: { where: { key: { in: string[] } } }) => Promise<Array<{ key: string; value: string }>>;
      };
    }).systemSetting;

    const rows = model
      ? await model.findMany({ where: { key: { in: keys } } })
      : await prisma.$queryRaw<Array<{ key: string; value: string }>>`SELECT key, value FROM "SystemSetting"`;

    const out: Record<string, string> = {};
    for (const r of rows) {
      if (keys.includes(r.key)) out[r.key] = r.value;
    }
    return out;
  } catch {
    return {};
  }
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const model = (prisma as unknown as {
    systemSetting?: {
      upsert: (args: {
        where: { key: string };
        create: { key: string; value: string };
        update: { value: string };
      }) => Promise<unknown>;
    };
  }).systemSetting;

  if (model) {
    await model.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "SystemSetting" (key, value, "updatedAt")
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;
}

export async function isMaintenanceMode(): Promise<boolean> {
  const map = await readSettingMap([KEYS.maintenanceMode]);
  return map[KEYS.maintenanceMode] === "true";
}

export async function getSystemSettings(): Promise<PaymentAndContactSettings> {
  const map = await readSettingMap(Object.values(KEYS));

  const envWhatsapp = (process.env.MANUAL_PAYMENT_WHATSAPP || "").replace(/\D/g, "");
  const dbBanks = parseBanksJson(map[KEYS.manualBanks]);

  return {
    maintenanceMode: map[KEYS.maintenanceMode] === "true",
    manualWhatsapp: (map[KEYS.manualWhatsapp] ?? envWhatsapp).replace(/\D/g, ""),
    manualBanks: dbBanks ?? parseEnvBanks(),
    midtransServerKey: map[KEYS.midtransServerKey] ?? (process.env.MIDTRANS_SERVER_KEY || ""),
    midtransClientKey:
      map[KEYS.midtransClientKey] ??
      (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.MIDTRANS_CLIENT_KEY || ""),
    midtransIsProduction:
      KEYS.midtransIsProduction in map
        ? map[KEYS.midtransIsProduction] === "true"
        : process.env.MIDTRANS_IS_PRODUCTION === "true",
    manualTransferEnabled: map[KEYS.manualTransferEnabled] !== "false",
    manualQrisEnabled: map[KEYS.manualQrisEnabled] !== "false",
    manualQrisImage: map[KEYS.manualQrisImage] ?? (process.env.MANUAL_PAYMENT_QRIS_IMAGE || ""),
    midtransEnabled: map[KEYS.midtransEnabled] !== "false",
  };
}

export const SYSTEM_SETTING_KEYS = KEYS;
