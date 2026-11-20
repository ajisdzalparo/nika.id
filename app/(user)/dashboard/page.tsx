import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconArrowRight, IconCheck, IconPalette } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { Phone } from "@/components/landing/primitives";
import { ShareLink } from "@/components/user/dashboard-parts";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation, listUserInvitations } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { getMaxGuests, getPlanLimits, type PlanType } from "@/lib/limits";
import { getTemplateBySlug } from "@/lib/templates";
import { getActiveAiTheme } from "@/lib/ai-design/server";
import { isAiDesignEnabled } from "@/lib/system-settings";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("id-ID", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }).format(new Date()));
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

const fmt = new Intl.NumberFormat("id-ID");

function daysUntil(date: Date | string | null | undefined) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export default async function UserDashboardPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [user, active, allInvitations, aiDesignEnabled] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true } }),
    getActiveInvitation(session.user.id),
    listUserInvitations(session.user.id),
    isAiDesignEnabled(),
  ]);
  if (!user) redirect("/login");

  const [guestCount, messages, rsvps] = await Promise.all([
    prisma.guest.count({ where: { invitationId: active.id } }),
    prisma.guestMessage.findMany({ where: { invitationId: active.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.rSVP.findMany({ where: { invitationId: active.id }, select: { attendance: true, guests: true } }),
  ]);
  const messageCount = await prisma.guestMessage.count({ where: { invitationId: active.id } });

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Bapak & Ibu Tamu", active.weddingDate ?? undefined);
  const plan = active.plan as PlanType;
  const limits = getPlanLimits(plan);
  const maxGuests = getMaxGuests(plan, active.extraGuestQuota ?? 0);
  const template = active.templateSlug ? getTemplateBySlug(active.templateSlug) : undefined;
  const aiTheme = active.templateSlug === "ai-design" ? await getActiveAiTheme(active.activeAiDesignId) : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://undanginyuk.ajisdzalparo.com";
  const url = `${baseUrl}/${active.slug ?? ""}`;

  const hasCouple = Boolean(raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.fullName || raw.bride?.name);
  const hasEvents = Boolean(raw.events?.length || raw.event?.date);
  const hasGallery = data.gallery.length > 0;
  const couple = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : "kami";

  const daysLeft = daysUntil(hasEvents ? (data.events[0]?.date ?? data.event?.date) : active.weddingDate);

  const attending = rsvps.filter((r) => r.attendance.toUpperCase() === "HADIR").reduce((n, r) => n + (r.guests || 1), 0);

  const steps = [
    { label: "Pilih desain undangan", done: Boolean(template), href: aiDesignEnabled ? "/desain-ai" : "/pilih-template" },
    { label: "Isi data kedua mempelai", done: hasCouple, href: "/editor" },
    { label: "Tambahkan jadwal acara", done: hasEvents, href: "/editor" },
    { label: "Unggah foto galeri", done: hasGallery, href: "/editor" },
    { label: "Masukkan daftar tamu", done: guestCount > 0, href: "/manajemen-tamu" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  const stats = [
    { label: "Dilihat", value: active.views, href: undefined },
    { label: "Akan hadir", value: attending, href: "/buku-tamu" },
    { label: "Ucapan", value: messageCount, href: "/buku-tamu" },
    { label: "Tamu terdaftar", value: guestCount, href: "/manajemen-tamu" },
  ];

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Active invitation banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] px-4 py-3 text-sm">
            <span className="text-[#6B6358]">
              Undangan aktif: <strong className="font-medium text-[#1E1B17]">{active.title}</strong>{" "}
              <span className="text-xs">({allInvitations.length} undangan di akun)</span>
            </span>
            <Link href="/undangan" className="font-medium text-[#8A6A2F] hover:underline">
              Kelola / buat undangan baru →
            </Link>
          </div>

          {/* Greeting */}
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">{greeting()}</p>
              <h2 className="font-(family-name:--font-landing-display) text-4xl font-medium leading-tight text-[#1E1B17] md:text-5xl">
                {hasCouple ? (
                  <>
                    {data.groom.nickname} <em className="text-[#8A6A2F]">&amp;</em> {data.bride.nickname}
                  </>
                ) : (
                  <>Halo, {user.name?.split(" ")[0] ?? "kalian"}</>
                )}
              </h2>
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <p className="text-[15px] text-[#6B6358]">
                <span className="font-(family-name:--font-landing-display) text-3xl lining-nums text-[#1E1B17]">{daysLeft}</span> hari lagi menuju hari bahagia
              </p>
            )}
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              {/* Invitation card */}
              <section className="grid gap-6 rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
                <div className="mx-auto flex w-full justify-center sm:w-auto">
                  {aiTheme ? (
                    <Phone theme={aiTheme} data={data} zoom={0.5} />
                  ) : template ? (
                    <div className="relative h-[374px] w-[201px] overflow-hidden rounded-[30px] border-[7px] border-[#111] bg-white">
                      <Image src={template.thumbnail} alt={template.name} fill sizes="201px" className="object-cover" />
                    </div>
                  ) : (
                    <Link href="/desain-ai" className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed sm:h-[374px] sm:w-[201px] sm:rounded-[30px] border-[#D6CBB8] px-6 text-center text-sm text-[#6B6358] transition-colors hover:border-[#8A6A2F]">
                      <IconPalette size={26} className="text-[#8A6A2F]" />
                      Belum ada desain. Rancang dengan AI atau pilih template.
                    </Link>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${plan === "FREE" ? "bg-[#C9A45C]" : active.isPublic === false ? "bg-[#B8AD9A]" : "bg-emerald-600"}`} />
                      <span className="text-sm text-[#6B6358]">
                        {plan === "FREE" ? "Mode pratinjau (belum diterbitkan)" : active.isPublic === false ? "Undangan disembunyikan" : "Undangan aktif"}
                      </span>
                    </div>
                    <h3 className="font-(family-name:--font-landing-display) text-3xl text-[#1E1B17]">{aiTheme?.name ?? template?.name ?? active.title}</h3>
                    <p className="text-[15px] leading-relaxed text-[#6B6358]">
                      {aiTheme ? aiTheme.mood : template ? template.description : "Pilih desain, isi data, lalu bagikan link ini ke tamu."}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-sm">
                      <Link href="/editor" className="inline-flex min-h-11 items-center gap-1 font-medium text-[#1E1B17] underline-offset-4 hover:underline">
                        Ubah isi
                      </Link>
                      <Link href="/desain-ai" className="inline-flex min-h-11 items-center gap-1 font-medium text-[#1E1B17] underline-offset-4 hover:underline">
                        Ganti desain
                      </Link>
                      {active.slug && (
                        <Link href={`/${active.slug}${plan === "FREE" || !active.isPublic ? "?preview=1" : ""}`} target="_blank" className="inline-flex min-h-11 items-center gap-1 font-medium text-[#8A6A2F] underline-offset-4 hover:underline">
                          {plan === "FREE" || !active.isPublic ? "Pratinjau undangan" : "Buka undangan"}
                        </Link>
                      )}
                    </div>
                  </div>
                  {active.slug && <ShareLink url={url} couple={couple} />}
                </div>
              </section>

              {/* Stats */}
              <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E1D8C9] bg-[#E1D8C9] md:grid-cols-4">
                {stats.map((s) => {
                  const inner = (
                    <>
                      <p className="text-[13px] text-[#6B6358]">{s.label}</p>
                      <p className="mt-2 font-(family-name:--font-landing-display) text-4xl tabular-nums lining-nums text-[#1E1B17]">{fmt.format(s.value)}</p>
                    </>
                  );
                  return s.href ? (
                    <Link key={s.label} href={s.href} className="bg-[#FFFDF9] p-5 transition-colors hover:bg-[#FBF8F2]">
                      {inner}
                    </Link>
                  ) : (
                    <div key={s.label} className="bg-[#FFFDF9] p-5">
                      {inner}
                    </div>
                  );
                })}
              </section>

              {/* Recent wishes */}
              <section className="rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-(family-name:--font-landing-display) text-2xl text-[#1E1B17]">Ucapan terbaru</h3>
                  <Link href="/buku-tamu" className="flex min-h-11 items-center gap-1 text-sm text-[#8A6A2F]">
                    Semua <IconArrowRight size={15} />
                  </Link>
                </div>
                {messages.length ? (
                  <ul className="divide-y divide-[#EDE6DA]">
                    {messages.map((m) => (
                      <li key={m.id} className="space-y-1 py-4 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-[#1E1B17]">{m.guestName}</p>
                        <p className="line-clamp-2 text-[15px] leading-relaxed text-[#6B6358]">{m.message}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[15px] text-[#6B6358]">Belum ada ucapan. Ucapan dan doa dari tamu akan muncul di sini setelah undangan dibagikan.</p>
                )}
              </section>
            </div>

            <aside className="space-y-6 max-lg:contents">
              {/* Checklist — moves to the top on small screens until setup is done */}
              <section className={`rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-5 sm:p-6 ${nextStep ? "max-lg:order-first" : ""}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-(family-name:--font-landing-display) text-2xl text-[#1E1B17]">Persiapan</h3>
                  <span className="text-sm tabular-nums text-[#6B6358]">
                    {doneCount}/{steps.length}
                  </span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#EDE6DA]">
                  <div className="h-full rounded-full bg-[#8A6A2F] transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                </div>
                <ul className="mt-5 space-y-1">
                  {steps.map((s) => (
                    <li key={s.label}>
                      <Link href={s.href} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-[15px] transition-colors hover:bg-[#F3EEE5]">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-[#8A6A2F] bg-[#8A6A2F] text-white" : "border-[#CFC5B4]"}`}>
                          {s.done && <IconCheck size={13} stroke={2.5} />}
                        </span>
                        <span className={s.done ? "text-[#9A9083] line-through decoration-[#CFC5B4]" : "text-[#1E1B17]"}>{s.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {nextStep && (
                  <Link href={nextStep.href} className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-[#1E1B17] text-sm font-medium text-[#F7F3EC] transition-opacity hover:opacity-90">
                    Lanjutkan: {nextStep.label.toLowerCase()} <IconArrowRight size={16} />
                  </Link>
                )}
              </section>

              {/* Plan */}
              <section className="rounded-2xl bg-[#15130F] p-5 text-[#F3EBDD] sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A45C]">Paket kalian</p>
                <p className="mt-2 font-(family-name:--font-landing-display) text-3xl">{limits.name}</p>
                <ul className="mt-4 space-y-2 text-sm text-[#CFC5B4]">
                  <li>{maxGuests === Infinity ? "Tamu tanpa batas" : `Hingga ${maxGuests} tamu bernama`}</li>
                  <li>{limits.aiDesignQuota}× desain AI</li>
                  <li>
                    {plan === "FREE"
                      ? "Pratinjau gratis · aktifkan paket untuk terbit"
                      : active.planExpiresAt
                        ? `Aktif sampai ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(active.planExpiresAt)}`
                        : limits.activeDays === null
                          ? "Aktif selamanya"
                          : `Masa aktif ${limits.activeDays} hari`}
                  </li>
                </ul>
                {plan !== "EKSKLUSIF" && (
                  <Link href="/upgrade" className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#F3EBDD] text-sm font-medium text-[#15130F] transition-opacity hover:opacity-90">
                    {plan === "FREE" ? "Aktifkan paket" : "Tingkatkan paket"}
                  </Link>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
