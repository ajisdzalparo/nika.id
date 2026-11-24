import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { GUEST_ADDON_PRICE, GUEST_ADDON_SIZE, PLAN_LIMITS, type PlanType } from "@/lib/limits";
import {
  DEFAULT_OPENROUTER_CHAT_MODEL,
  isOpenRouterConfigured,
  openRouterChat,
} from "@/lib/openrouter";

export interface SupportThreadRow {
  id: string;
  userId: string;
  mode: string; // "AI" | "ADMIN"
  status: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface SupportMessageRow {
  id: string;
  threadId: string;
  sender: string; // "USER" | "AI" | "ADMIN" | "SYSTEM"
  content: string;
  createdAt: Date;
}

type PrismaSupportDelegates = {
  supportThread?: {
    findUnique: (args: Record<string, unknown>) => Promise<SupportThreadRow | null>;
    findMany: (args: Record<string, unknown>) => Promise<Array<SupportThreadRow & { user?: { id: string; name: string; email: string; image: string | null } }>>;
    create: (args: Record<string, unknown>) => Promise<SupportThreadRow>;
    update: (args: Record<string, unknown>) => Promise<SupportThreadRow>;
  };
  supportMessage?: {
    findMany: (args: Record<string, unknown>) => Promise<SupportMessageRow[]>;
    create: (args: Record<string, unknown>) => Promise<SupportMessageRow>;
  };
};

function getDelegates(): PrismaSupportDelegates {
  return prisma as unknown as PrismaSupportDelegates;
}

export async function getOrCreateUserThread(userId: string): Promise<{
  thread: SupportThreadRow;
  messages: SupportMessageRow[];
}> {
  const { supportThread, supportMessage } = getDelegates();

  if (supportThread && supportMessage) {
    let thread = await supportThread.findUnique({ where: { userId } });
    if (!thread) {
      thread = await supportThread.create({
        data: { userId, mode: "AI", status: "OPEN" },
      });
      await supportMessage.create({
        data: {
          threadId: thread.id,
          sender: "AI",
          content:
            "Halo! Saya asisten AI SatuMoment. Ada yang bisa dibantu soal paket, pembayaran, musik latar, atau edit undangan? Kamu juga bisa klik tombol \"Hubungi Admin\" kapan saja untuk terhubung langsung dengan admin.",
        },
      });
    }
    const messages = await supportMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return { thread, messages };
  }

  // Raw SQL fallback if PrismaClient hasn't restarted yet
  const existing = await prisma.$queryRaw<SupportThreadRow[]>`
    SELECT "id", "userId", "mode", "status", "lastMessageAt", "createdAt"
    FROM "SupportThread"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  let thread = existing[0];

  if (!thread) {
    const threadId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "SupportThread" ("id", "userId", "mode", "status", "lastMessageAt", "createdAt", "updatedAt")
      VALUES (${threadId}, ${userId}, 'AI', 'OPEN', NOW(), NOW(), NOW())
    `;
    const welcomeId = crypto.randomUUID();
    const welcomeText =
      'Halo! Saya asisten AI SatuMoment. Ada yang bisa dibantu soal paket, pembayaran, musik latar, atau edit undangan? Kamu juga bisa klik tombol "Hubungi Admin" kapan saja untuk terhubung langsung dengan admin.';
    await prisma.$executeRaw`
      INSERT INTO "SupportMessage" ("id", "threadId", "sender", "content", "createdAt")
      VALUES (${welcomeId}, ${threadId}, 'AI', ${welcomeText}, NOW())
    `;
    const createdRows = await prisma.$queryRaw<SupportThreadRow[]>`
      SELECT "id", "userId", "mode", "status", "lastMessageAt", "createdAt"
      FROM "SupportThread" WHERE "id" = ${threadId} LIMIT 1
    `;
    thread = createdRows[0];
  }

  const messages = await prisma.$queryRaw<SupportMessageRow[]>`
    SELECT "id", "threadId", "sender", "content", "createdAt"
    FROM "SupportMessage"
    WHERE "threadId" = ${thread.id}
    ORDER BY "createdAt" ASC
    LIMIT 100
  `;

  return { thread, messages };
}

export async function addSupportMessage(params: {
  threadId: string;
  sender: "USER" | "AI" | "ADMIN" | "SYSTEM";
  content: string;
  nextMode?: "AI" | "ADMIN";
  nextStatus?: "OPEN" | "CLOSED";
}): Promise<SupportMessageRow> {
  const { threadId, sender, content, nextMode, nextStatus } = params;
  const { supportThread, supportMessage } = getDelegates();

  if (supportThread && supportMessage) {
    const msg = await supportMessage.create({
      data: { threadId, sender, content: content.slice(0, 2000) },
    });
    await supportThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: new Date(),
        ...(nextMode ? { mode: nextMode } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    });
    return msg;
  }

  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "SupportMessage" ("id", "threadId", "sender", "content", "createdAt")
    VALUES (${id}, ${threadId}, ${sender}, ${content.slice(0, 2000)}, NOW())
  `;
  if (nextMode && nextStatus) {
    await prisma.$executeRaw`
      UPDATE "SupportThread" SET "lastMessageAt" = NOW(), "mode" = ${nextMode}, "status" = ${nextStatus}, "updatedAt" = NOW() WHERE "id" = ${threadId}
    `;
  } else if (nextMode) {
    await prisma.$executeRaw`
      UPDATE "SupportThread" SET "lastMessageAt" = NOW(), "mode" = ${nextMode}, "updatedAt" = NOW() WHERE "id" = ${threadId}
    `;
  } else if (nextStatus) {
    await prisma.$executeRaw`
      UPDATE "SupportThread" SET "lastMessageAt" = NOW(), "status" = ${nextStatus}, "updatedAt" = NOW() WHERE "id" = ${threadId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "SupportThread" SET "lastMessageAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${threadId}
    `;
  }

  const rows = await prisma.$queryRaw<SupportMessageRow[]>`
    SELECT "id", "threadId", "sender", "content", "createdAt" FROM "SupportMessage" WHERE "id" = ${id} LIMIT 1
  `;
  return rows[0];
}

export async function setSupportThreadMode(threadId: string, mode: "AI" | "ADMIN", status?: "OPEN" | "CLOSED") {
  const { supportThread } = getDelegates();
  if (supportThread) {
    await supportThread.update({
      where: { id: threadId },
      data: { mode, ...(status ? { status } : {}) },
    });
    return;
  }
  if (status) {
    await prisma.$executeRaw`
      UPDATE "SupportThread" SET "mode" = ${mode}, "status" = ${status}, "updatedAt" = NOW() WHERE "id" = ${threadId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "SupportThread" SET "mode" = ${mode}, "updatedAt" = NOW() WHERE "id" = ${threadId}
    `;
  }
}

function computeQueueMeta(
  mode: string,
  status: string,
  descMessages: Array<{ sender: string; content: string; createdAt: Date | string }>,
): { waitingInQueue: boolean; requestedAt: number } {
  if (mode !== "ADMIN" || status === "CLOSED") {
    return { waitingInQueue: false, requestedAt: 0 };
  }
  let requestedAt = 0;
  for (const m of descMessages) {
    if (m.sender === "ADMIN") {
      return { waitingInQueue: false, requestedAt: 0 };
    }
    if (m.sender === "SYSTEM" && m.content.includes("Admin bergabung")) {
      return { waitingInQueue: false, requestedAt: 0 };
    }
    if (m.sender === "SYSTEM" && m.content.includes("Terhubung ke Admin")) {
      requestedAt = new Date(m.createdAt).getTime();
      return { waitingInQueue: true, requestedAt };
    }
  }
  return {
    waitingInQueue: true,
    requestedAt: descMessages[0] ? new Date(descMessages[0].createdAt).getTime() : Date.now(),
  };
}

export async function getUserQueueInfo(threadId: string): Promise<{ waitingInQueue: boolean; queuePosition: number | null }> {
  const threads = await listAllAdminThreads();
  const mine = threads.find((t) => t.id === threadId);
  if (!mine) return { waitingInQueue: false, queuePosition: null };
  return { waitingInQueue: mine.waitingInQueue, queuePosition: mine.queuePosition };
}

export async function listAllAdminThreads() {
  const { supportThread } = getDelegates();
  let baseThreads: Array<{
    id: string;
    userId: string;
    mode: string;
    status: string;
    lastMessageAt: Date;
    createdAt: Date;
    user: { id: string; name: string | null; email: string; image: string | null };
    messages: Array<{ content: string; sender: string; createdAt: Date }>;
  }>;

  if (supportThread) {
    const rows = await (supportThread.findMany as (args: Record<string, unknown>) => Promise<
      Array<
        SupportThreadRow & {
          user: { id: string; name: string | null; email: string; image: string | null };
          messages: Array<{ content: string; sender: string; createdAt: Date }>;
        }
      >
    >)({
      orderBy: { lastMessageAt: "desc" },
      take: 60,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 15, select: { content: true, sender: true, createdAt: true } },
      },
    });
    baseThreads = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      mode: r.mode,
      status: r.status,
      lastMessageAt: new Date(r.lastMessageAt),
      createdAt: new Date(r.createdAt),
      user: r.user,
      messages: r.messages,
    }));
  } else {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        mode: string;
        status: string;
        lastMessageAt: Date;
        createdAt: Date;
        user_name: string | null;
        user_email: string;
        user_image: string | null;
      }>
    >`
      SELECT t."id", t."userId", t."mode", t."status", t."lastMessageAt", t."createdAt",
             u."name" AS user_name, u."email" AS user_email, u."image" AS user_image
      FROM "SupportThread" t
      JOIN "User" u ON u."id" = t."userId"
      ORDER BY t."lastMessageAt" DESC
      LIMIT 60
    `;
    const msgRows = await prisma.$queryRaw<
      Array<{ threadId: string; content: string; sender: string; createdAt: Date }>
    >`
      SELECT "threadId", "content", "sender", "createdAt"
      FROM "SupportMessage"
      ORDER BY "createdAt" DESC
      LIMIT 300
    `;
    const byThread = new Map<string, Array<{ content: string; sender: string; createdAt: Date }>>();
    for (const m of msgRows) {
      const list = byThread.get(m.threadId) ?? [];
      if (list.length < 15) {
        list.push({ content: m.content, sender: m.sender, createdAt: new Date(m.createdAt) });
        byThread.set(m.threadId, list);
      }
    }
    baseThreads = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      mode: r.mode,
      status: r.status,
      lastMessageAt: new Date(r.lastMessageAt),
      createdAt: new Date(r.createdAt),
      user: { id: r.userId, name: r.user_name ?? "User", email: r.user_email, image: r.user_image },
      messages: byThread.get(r.id) ?? [],
    }));
  }

  // Assign FIFO queue positions (#1, #2, ...) to threads waiting for Admin
  const queueEntries = baseThreads
    .map((t) => ({ id: t.id, ...computeQueueMeta(t.mode, t.status, t.messages) }))
    .filter((q) => q.waitingInQueue)
    .sort((a, b) => a.requestedAt - b.requestedAt);

  const posMap = new Map<string, { queuePosition: number; requestedAt: string }>();
  queueEntries.forEach((q, idx) => {
    posMap.set(q.id, { queuePosition: idx + 1, requestedAt: new Date(q.requestedAt).toISOString() });
  });

  return baseThreads.map((t) => {
    const qInfo = posMap.get(t.id);
    return {
      ...t,
      messages: t.messages.slice(0, 1),
      waitingInQueue: Boolean(qInfo),
      queuePosition: qInfo?.queuePosition ?? null,
      requestedAdminAt: qInfo?.requestedAt ?? null,
    };
  });
}

export async function getThreadMessagesForAdmin(threadId: string) {
  const { supportMessage } = getDelegates();
  if (supportMessage) {
    return supportMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }
  return prisma.$queryRaw<SupportMessageRow[]>`
    SELECT "id", "threadId", "sender", "content", "createdAt"
    FROM "SupportMessage"
    WHERE "threadId" = ${threadId}
    ORDER BY "createdAt" ASC
    LIMIT 100
  `;
}

function buildKnowledgeFallback(userText: string, plan: PlanType, isPublicVisitor = false): { reply: string; suggestAdmin: boolean } {
  const q = userText.toLowerCase();
  const hasImageOnly = !q.trim() || q === "[lampiran gambar]";
  if (hasImageOnly) {
    return {
      reply:
        'Gambar sudah kami terima. Boleh ceritakan detail pertanyaanmu, atau klik **"Hubungi Admin"** di atas jika gambar tersebut perlu dicek langsung oleh admin (seperti bukti transfer atau kendala tampilan).',
      suggestAdmin: false,
    };
  }
  const wantsAdmin = /(hubungi admin|chat admin|bicara.*admin|minta admin|customer service|\bcs\b|komplain|verifikasi manual|tolong cek|whatsapp|\bwa\b)/.test(q);
  if (wantsAdmin) {
    if (isPublicVisitor) {
      return {
        reply:
          'Untuk berbicara langsung dengan admin, silakan klik tombol **WhatsApp Admin** di atas ya. Tim kami siap bantu jawab pertanyaanmu!',
        suggestAdmin: false,
      };
    }
    return {
      reply:
        'Baik! Jika ingin berbicara langsung dengan admin, silakan klik tombol **"Hubungi Admin"** di bagian atas kotak chat ini agar pesanmu diteruskan langsung ke tim admin.',
      suggestAdmin: true,
    };
  }

  if (/(harga|paket|biaya|hemat|premium|eksklusif|upgrade|selisih|addon|add-on|kuota tamu|kredit|top-up|topup|mitra|agency|b2b|referral|komisi)/.test(q)) {
    const statusNote = isPublicVisitor
      ? "Kamu bisa daftar gratis untuk merancang undanganmu dulu, dan baru bayar saat siap dibagikan di /register."
      : plan === "EKSKLUSIF"
        ? "Paket undangan aktifmu saat ini sudah **Eksklusif** (paket terlengkap dengan tamu & galeri tanpa batas). Detailnya bisa dilihat di /upgrade."
        : plan === "FREE"
          ? "Undanganmu masih dalam **Mode Pratinjau**. Pilih paket kapan saja di /upgrade."
          : `Paket aktifmu saat ini **${PLAN_LIMITS[plan].name}**. Upgrade ke paket lebih tinggi cukup membayar selisih harganya di /upgrade.`;

    return {
      reply: `Daftar paket SatuMoment (sekali bayar per undangan):\n• **Hemat (Rp49.000)**: 100 tamu, 10 foto, 1× Desain AI, aktif 90 hari.\n• **Premium (Rp79.000)**: 300 tamu, 20 foto, 5× Desain AI, template Premium & Kisah Cinta, aktif 180 hari.\n• **Eksklusif (Rp99.000)**: Tamu & galeri tanpa batas, 10× Desain AI, Video, Tanpa Watermark, aktif 1 tahun.\n• **Add-on Tamu**: +${GUEST_ADDON_SIZE} tamu seharga Rp${GUEST_ADDON_PRICE.toLocaleString("id-ID")}.\n• **Top-up Kredit AI**: 10 kredit Rp29.000 · 30 kredit Rp75.000 · 100 kredit Rp229.000 (1 generate = 1 kredit, dengan referensi = 2 kredit).\n• **Mitra B2B (/mitra)**: Paket grosir Mitra 10 (Rp299rb), Mitra 30 (Rp749rb), Mitra 100 (Rp1,99jt) + link isi data klien tanpa login.\n• **Referral (/dompet)**: Teman dapat diskon 10% (maks Rp15rb), kamu dapat komisi 15% (maks Rp100rb per transaksi; tidak berlaku untuk top-up Kredit AI & template marketplace).\n\n${statusNote}`,
      suggestAdmin: false,
    };
  }

  if (/(bayar|transfer|bukti|konfirmasi|verifikasi|pending|otomatis|midtrans|qris)/.test(q)) {
    if (isPublicVisitor) {
      return {
        reply:
          "Pembayaran dilakukan sekali per undangan setelah kamu selesai merancang undanganmu:\n• **Bayar Otomatis**: QRIS, BCA, Mandiri, BNI, BRI, & Permata VA — aktif seketika.\n• **Transfer Manual**: kirim bukti transfer di halaman pembayaran atau konsultasi dulu lewat **WhatsApp Admin**.",
        suggestAdmin: false,
      };
    }
    return {
      reply:
        "Pembayaran tersedia di halaman /upgrade:\n• **Bayar Otomatis (QRIS & Virtual Account)**: pilih channel (QRIS, BCA, Mandiri, BNI, BRI, Permata), scan QR atau transfer ke nomor VA, paket langsung aktif otomatis.\n• **Transfer Manual**: transfer nominal + 3 digit kode unik ke rekening tujuan, kirim form konfirmasi + bukti transfer, lalu pantau progress verifikasi tahap 1–4 & riwayatnya.\n\nJika transfer manual perlu dicek cepat, klik **Hubungi Admin** ya.",
      suggestAdmin: false,
    };
  }

  if (/(musik|lagu|youtube|audio|mp3)/.test(q)) {
    return {
      reply: isPublicVisitor
        ? "Setiap undangan bisa dilengkapi musik latar dari daftar **Musik Default**, **link YouTube** (`youtube.com` / `youtu.be`), atau **unggah MP3/WAV** sendiri."
        : "Musik latar dapat diatur di /editor (tab Fitur) atau /pengaturan:\n• Pilih lagu dari daftar **Musik Default**\n• Tempel **link YouTube** (`youtube.com`, `youtu.be`, `music.youtube.com`, atau Shorts)\n• Atau **unggah file audio MP3/WAV** sendiri.",
      suggestAdmin: false,
    };
  }

  if (/(desain|template|ai|tema|preview|pratinjau)/.test(q)) {
    return {
      reply: isPublicVisitor
        ? "Kamu bisa melihat berbagai pilihan tema di /desain atau merancang desain unik lewat **Desain AI** setelah daftar di /register. Sebelum bayar pun kamu tetap bisa pratinjau hasil undanganmu."
        : "Kamu bisa mengganti desain kapan saja di /pilih-template atau merancang tema khusus lewat /desain-ai tanpa menghapus data undanganmu. Pemilik akun tetap dapat melihat undangan penuh dalam mode pratinjau sebelum membayar.",
      suggestAdmin: false,
    };
  }

  if (/(rsvp|ucapan|tamu|link|bagikan|share|publik|cara buat|mulai|daftar)/.test(q)) {
    return {
      reply: isPublicVisitor
        ? "Cara membuat undangan di **SatuMoment**:\n• Daftar gratis di /register\n• Pilih template atau rancang tema pakai **Desain AI**\n• Isi data mempelai, jadwal acara, galeri foto, musik & daftar tamu bernama\n• Aktifkan paket saat siap dibagikan lewat WhatsApp."
        : "Untuk membagikan undangan, aktifkan toggle **Publikasikan** di /undangan. Kelola daftar tamu personal di /manajemen-tamu, dan pantau RSVP serta doa tamu di /buku-tamu.",
      suggestAdmin: false,
    };
  }

  if (isPublicVisitor) {
    return {
      reply:
        'Saya asisten **SatuMoment**! Silakan tanya soal **harga paket**, **fitur undangan**, **Desain AI**, atau **cara buat undangan** di /register. Untuk tanya langsung ke tim kami, gunakan tombol **WhatsApp Admin** di atas.',
      suggestAdmin: false,
    };
  }

  return {
    reply:
      'Saya siap membantu seputar **SatuMoment** (paket & upgrade, progress transfer manual, desain AI, musik YouTube/MP3, serta manajemen tamu). Boleh ceritakan detail kendalamu, atau klik **"Hubungi Admin"** jika ingin ditangani langsung oleh tim admin.',
    suggestAdmin: false,
  };
}

export async function generateSupportAiReply(params: {
  userMessage: string;
  history: Array<{ sender: string; content: string }>;
  userPlan: PlanType;
  invitationTitle: string;
  isPublicVisitor?: boolean;
}): Promise<{ reply: string; suggestAdmin: boolean }> {
  const { userMessage, history, userPlan, invitationTitle, isPublicVisitor = false } = params;
  const fallback = buildKnowledgeFallback(userMessage, userPlan, isPublicVisitor);

  if (!isOpenRouterConfigured()) {
    return fallback;
  }

  try {
    const model = process.env.OPENROUTER_CHAT_MODEL?.trim() || DEFAULT_OPENROUTER_CHAT_MODEL;
    const recent = history
      .filter((m) => m.sender === "USER" || m.sender === "AI" || m.sender === "ADMIN")
      .slice(-8)
      .map((m) => ({
        role: (m.sender === "USER" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

    const text = await openRouterChat({
      model,
      maxTokens: 400,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: [
            "Kamu adalah asisten customer support resmi SatuMoment (platform undangan pernikahan digital Indonesia).",
            "Jawab ramah, ringkas, jelas dalam Bahasa Indonesia.",
            "Fakta layanan:",
            "- Paket Hemat: Rp49.000 (90 hari, 100 tamu, 10 foto, 1x Desain AI, template Gratis).",
            "- Paket Premium: Rp79.000 (180 hari, 300 tamu, 20 foto, 5x Desain AI, template Gratis & Premium, Kisah Cinta).",
            "- Paket Eksklusif: Rp99.000 (Aktif 1 tahun, tamu & foto tanpa batas, 10x Desain AI, Video, Tanpa Watermark).",
            "- Add-on +100 tamu: Rp15.000.",
            "- Upgrade dari paket lebih rendah cukup bayar selisih harga.",
            "- Pembayaran: Bayar Otomatis via Midtrans Snap (Virtual Account, QRIS, e-wallet, kartu) dan Transfer / QRIS Manual.",
            "- Musik latar mendukung link YouTube, upload audio, atau pilih dari Musik Default.",
            isPublicVisitor
              ? 'Pengunjung berada di halaman depan (belum login). Jangan suruh klik "Hubungi Admin" live dashboard. Arahkan ke /register untuk mulai gratis, /desain untuk lihat koleksi, atau tombol "WhatsApp Admin" bila ingin chat langsung ke admin.'
              : `Konteks user: Undangan aktif "${invitationTitle}", paket saat ini "${PLAN_LIMITS[userPlan].name}". Jika butuh pengecekan admin langsung, sarankan klik tombol "Hubungi Admin" di atas chat.`,
          ].join("\n"),
        },
        ...recent,
        { role: "user", content: userMessage },
      ],
    });

    if (!text) return fallback;
    return { reply: text, suggestAdmin: fallback.suggestAdmin };
  } catch {
    return fallback;
  }
}
