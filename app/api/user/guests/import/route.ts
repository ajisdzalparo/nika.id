import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { buildGuestTemplate, parseGuestFile } from "@/lib/guest-import";
import { getMaxGuests, type PlanType } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

const MAX_BYTES = 5 * 1024 * 1024;

// GET /api/user/guests/import — the Excel template tailored to the active invitation's events & labels
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    const raw = (active.data ?? {}) as Record<string, unknown>;
    const wedding = mapInvitationToWeddingData(raw, "Tamu", active.weddingDate ?? undefined);
    const eventOptions = Array.from(
      new Set([
        "Umum",
        ...(wedding.events ?? []).map((e) => e.title?.trim()).filter((v): v is string => Boolean(v)),
        "Livestream",
      ]),
    );
    const labelRows = await prisma.guest.findMany({
      where: { invitationId: active.id, label: { not: null } },
      distinct: ["label"],
      select: { label: true },
    });
    const labelOptions = labelRows.map((r) => r.label).filter((v): v is string => Boolean(v));

    const buf = await buildGuestTemplate({ eventOptions, labelOptions });
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template-daftar-tamu-satumoment.xlsx"',
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal membuat template");
  }
}

// POST /api/user/guests/import (multipart, field "file": .xlsx or .csv) — adds many guests to the active invitation.
// Nothing is saved while any row is invalid, so the fixed file can be uploaded again as a whole.
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } });
    if (viewer?.accountType === "AGENCY") {
      return NextResponse.json(
        { error: "MITRA_MONITORING_ONLY", message: "Daftar tamu dikelola langsung oleh akun klien. Mitra hanya dapat memantau daftar tamu." },
        { status: 403 },
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Pilih file Excel atau CSV" }, { status: 400 });
    if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Format harus .xlsx atau .csv" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Ukuran file maksimal 5 MB" }, { status: 400 });

    let parsed;
    try {
      parsed = await parseGuestFile(await file.arrayBuffer(), file.name);
    } catch {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "File tidak bisa dibaca. Pastikan formatnya .xlsx dari Excel/Google Sheets." }, { status: 400 });
    }
    if (parsed.errors.length) {
      return NextResponse.json({ error: "ROW_ERRORS", message: `${parsed.errors.length} baris perlu diperbaiki`, errors: parsed.errors.slice(0, 50) }, { status: 400 });
    }

    const invitation = await getActiveInvitation(session.user.id);
    const existing = await prisma.guest.findMany({ where: { invitationId: invitation.id }, select: { name: true, phone: true } });
    const key = (name: string, phone: string | null) => `${name.toLowerCase()}|${phone ?? ""}`;
    const seen = new Set(existing.map((g) => key(g.name, g.phone)));
    const fresh = parsed.guests.filter((g) => {
      const k = key(g.name, g.phone);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const max = getMaxGuests(invitation.plan as PlanType, invitation.extraGuestQuota ?? 0);
    if (existing.length + fresh.length > max) {
      return NextResponse.json(
        {
          error: "GUEST_LIMIT_REACHED",
          message: `Batas paket ${max} tamu. Saat ini ${existing.length} tamu, file berisi ${fresh.length} tamu baru. Tingkatkan paket atau beli add-on tamu.`,
        },
        { status: 403 },
      );
    }

    if (fresh.length) {
      await prisma.guest.createMany({
        data: fresh.map((g) => ({ ...g, userId: invitation.userId, invitationId: invitation.id })),
      });
    }
    return NextResponse.json({ added: fresh.length, skipped: parsed.guests.length - fresh.length });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengimpor daftar tamu");
  }
}
