import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { getSystemSettings, SYSTEM_SETTING_KEYS, upsertSetting } from "@/lib/system-settings";

const BankSchema = z.object({
  bank: z.string().trim().min(1, "Nama bank wajib diisi").max(40),
  number: z.string().trim().min(3, "Nomor rekening wajib diisi").max(40),
  holder: z.string().trim().min(1, "Atas nama wajib diisi").max(100),
});

const PatchSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  manualWhatsapp: z.string().trim().max(30).optional(),
  manualBanks: z.array(BankSchema).max(10).optional(),
  midtransServerKey: z.string().trim().max(200).optional(),
  midtransClientKey: z.string().trim().max(200).optional(),
  midtransIsProduction: z.boolean().optional(),
  manualTransferEnabled: z.boolean().optional(),
  manualQrisEnabled: z.boolean().optional(),
  manualQrisImage: z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//.test(v), "URL gambar QRIS tidak valid").optional(),
  midtransEnabled: z.boolean().optional(),
  aiDesignEnabled: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat pengaturan");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const parsed = PatchSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const ops: Array<Promise<void>> = [];

    if (typeof d.maintenanceMode === "boolean") {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.maintenanceMode, String(d.maintenanceMode)));
    }
    if (typeof d.manualWhatsapp === "string") {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.manualWhatsapp, d.manualWhatsapp.replace(/\D/g, "")));
    }
    if (Array.isArray(d.manualBanks)) {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.manualBanks, JSON.stringify(d.manualBanks)));
    }
    if (typeof d.midtransServerKey === "string") {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.midtransServerKey, d.midtransServerKey));
    }
    if (typeof d.midtransClientKey === "string") {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.midtransClientKey, d.midtransClientKey));
    }
    if (typeof d.midtransIsProduction === "boolean") {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.midtransIsProduction, String(d.midtransIsProduction)));
    }

    for (const key of ["manualTransferEnabled", "manualQrisEnabled", "midtransEnabled", "aiDesignEnabled"] as const) {
      if (typeof d[key] === "boolean") ops.push(upsertSetting(SYSTEM_SETTING_KEYS[key], String(d[key])));
    }
    if (typeof d.manualQrisImage === "string") {
      ops.push(upsertSetting(SYSTEM_SETTING_KEYS.manualQrisImage, d.manualQrisImage));
    }

    await Promise.all(ops);
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan pengaturan");
  }
}
