import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-helpers";
import { checkChatRateLimit, clientIp } from "@/lib/chat-security";
import { createNotification } from "@/lib/notifications";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { APPLICANT_TYPES, BUSINESS_KINDS } from "@/lib/mitra-application";

const ApplicationSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(120),
  whatsapp: z.string().trim().min(8, "Nomor WhatsApp tidak valid").max(25),
  applicantType: z.enum(APPLICANT_TYPES),
  businessName: z.string().trim().max(80).optional().or(z.literal("")),
  businessKind: z.enum(BUSINESS_KINDS).optional().nullable(),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  // Honeypot: real people never see or fill this field
  website: z.string().max(0).optional().or(z.literal("")),
});

// POST /api/public/mitra-application — join request from the landing page or /mitra. An admin reviews it.
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkChatRateLimit(`mitra-apply:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "Terlalu banyak pengajuan. Coba lagi nanti." }, { status: 429 });
  }

  const parsed = ApplicationSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.applicantType === "USAHA" && !d.businessName) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Isi nama usaha kamu." }, { status: 400 });
  }
  const whatsapp = normalizePhoneDigits(d.whatsapp);
  if (!isValidPhoneDigits(whatsapp)) {
    return NextResponse.json({ error: "INVALID_WHATSAPP", message: "Nomor WhatsApp tidak valid." }, { status: 400 });
  }

  // A logged-in user applies for their own account; the email then comes from the session
  const session = await getSession(request, "user");
  const userId = session?.user.id ?? null;
  const email = session?.user.email?.toLowerCase() ?? d.email;

  if (userId) {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
    if (me?.accountType === "AGENCY") {
      return NextResponse.json({ error: "ALREADY_MITRA", message: "Akun ini sudah Mitra." }, { status: 400 });
    }
  }
  const pending = await prisma.mitraApplication.findFirst({
    where: { status: "PENDING", OR: [{ email }, ...(userId ? [{ userId }] : [])] },
    select: { id: true },
  });
  if (pending) {
    return NextResponse.json({ error: "ALREADY_PENDING", message: "Pengajuanmu sudah kami terima dan sedang ditinjau admin." }, { status: 409 });
  }

  await prisma.mitraApplication.create({
    data: {
      userId,
      name: d.name,
      email,
      whatsapp,
      applicantType: d.applicantType,
      businessName: d.businessName || null,
      businessKind: d.applicantType === "USAHA" ? (d.businessKind ?? null) : null,
      instagram: (d.instagram || "").replace(/^@+/, "").trim() || null,
      city: d.city || null,
      note: d.note || null,
    },
  });
  await createNotification({
    audience: "ADMIN",
    type: "SYSTEM",
    title: "Pengajuan Mitra baru",
    message: `${d.businessName || d.name} (${d.applicantType === "USAHA" ? "usaha" : "perorangan"}) ingin jadi Mitra.`,
    href: "/admin/mitra",
  });

  return NextResponse.json({ ok: true });
}
