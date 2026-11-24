import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PersonSchema = z.object({
  nickname: z.string().trim().max(50).default(""),
  fullName: z.string().trim().max(100).default(""),
  fatherName: z.string().trim().max(100).default(""),
  motherName: z.string().trim().max(100).default(""),
  instagram: z.string().trim().max(60).optional().default(""),
});

const EventSchema = z.object({
  id: z.string().max(40).default("akad"),
  title: z.string().trim().max(60).default("Akad Nikah"),
  date: z.string().max(40).default(""),
  time: z.string().trim().max(40).default(""),
  venue: z.string().trim().max(120).default(""),
  address: z.string().trim().max(300).default(""),
  mapUrl: z.string().trim().max(400).default(""),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const BankSchema = z.object({
  bankName: z.string().trim().max(40),
  accountHolder: z.string().trim().max(100),
  accountNumber: z.string().trim().max(40),
});

const ClientFormPatchSchema = z.object({
  groom: PersonSchema,
  bride: PersonSchema,
  events: z.array(EventSchema).max(5).default([]),
  story: z
    .object({
      title: z.string().trim().max(100).default(""),
      content: z.string().trim().max(2000).default(""),
    })
    .optional(),
  quote: z
    .object({
      text: z.string().trim().max(500).default(""),
      source: z.string().trim().max(100).default(""),
    })
    .optional(),
  bankAccounts: z.array(BankSchema).max(4).optional(),
});

// GET /api/public/client-form/[token] — loads safe fields for the couple's magic data-entry link
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await prisma.invitation.findUnique({
    where: { clientEditToken: token },
    select: {
      id: true,
      title: true,
      slug: true,
      clientName: true,
      weddingDate: true,
      data: true,
      user: { select: { agencyName: true, agencyWhatsapp: true, name: true } },
    },
  });

  if (!inv) {
    return NextResponse.json({ error: "INVALID_LINK", message: "Link pengisian data tidak ditemukan atau sudah dinonaktifkan." }, { status: 404 });
  }

  const raw = (inv.data ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    title: inv.title,
    slug: inv.slug,
    clientName: inv.clientName,
    agencyName: inv.user.agencyName || inv.user.name || "UNDANGIN YUK",
    agencyWhatsapp: inv.user.agencyWhatsapp,
    weddingDate: inv.weddingDate ? inv.weddingDate.toISOString() : null,
    data: {
      groom: raw.groom ?? {},
      bride: raw.bride ?? {},
      events: Array.isArray(raw.events) ? raw.events : [],
      story: raw.story ?? { title: "", content: "" },
      quote: raw.quote ?? { text: "", source: "" },
      gifts: raw.gifts ?? { enabled: false, bankAccounts: [] },
    },
  });
}

// PATCH /api/public/client-form/[token] — updates couple/events/story/gifts without touching design, theme, music, or plan
export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await prisma.invitation.findUnique({
    where: { clientEditToken: token },
    select: { id: true, data: true, weddingDate: true },
  });

  if (!inv) {
    return NextResponse.json({ error: "INVALID_LINK", message: "Link pengisian data tidak ditemukan atau sudah dinonaktifkan." }, { status: 404 });
  }

  const parsed = ClientFormPatchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }

  const existing = ((inv.data ?? {}) as Record<string, unknown>) || {};
  const existingGroom = (existing.groom as Record<string, unknown>) || {};
  const existingBride = (existing.bride as Record<string, unknown>) || {};
  const existingGifts = (existing.gifts as Record<string, unknown>) || {};

  const firstEventDate = parsed.data.events.find((e) => e.date)?.date;
  const parsedWeddingDate = firstEventDate ? new Date(firstEventDate) : null;
  const nextWeddingDate =
    parsedWeddingDate && !Number.isNaN(parsedWeddingDate.getTime()) ? parsedWeddingDate : inv.weddingDate;

  const cleanBanks = (parsed.data.bankAccounts ?? []).filter((b) => b.bankName && b.accountNumber);

  const nextData = {
    ...existing,
    groom: { ...existingGroom, ...parsed.data.groom },
    bride: { ...existingBride, ...parsed.data.bride },
    events: parsed.data.events,
    ...(parsed.data.events[0]
      ? {
          event: {
            date: parsed.data.events[0].date,
            time: parsed.data.events[0].time,
            venue: parsed.data.events[0].venue,
            address: parsed.data.events[0].address,
            mapUrl: parsed.data.events[0].mapUrl,
            lat: parsed.data.events[0].lat,
            lng: parsed.data.events[0].lng,
          },
        }
      : {}),
    ...(parsed.data.story ? { story: parsed.data.story } : {}),
    ...(parsed.data.quote ? { quote: parsed.data.quote } : {}),
    ...(parsed.data.bankAccounts !== undefined
      ? {
          gifts: {
            ...existingGifts,
            enabled: cleanBanks.length > 0,
            bankAccounts: cleanBanks,
          },
        }
      : {}),
  };

  await prisma.invitation.update({
    where: { id: inv.id },
    data: {
      data: nextData as unknown as Prisma.InputJsonValue,
      weddingDate: nextWeddingDate,
    },
  });

  return NextResponse.json({ success: true });
}
