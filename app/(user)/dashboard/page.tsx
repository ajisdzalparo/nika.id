import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconArrowRight, IconArrowsExchange, IconCalendarEvent, IconCheck, IconEye, IconHeartHandshake, IconLeaf, IconMessageHeart, IconPalette, IconPencil, IconUserCheck, IconUsers } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/common/studio-ui";
import { SiteHeader } from "@/components/site-header";
import { Phone } from "@/components/landing/primitives";
import { LiveCountdown, ShareLink } from "@/components/user/dashboard-parts";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation, listUserInvitations } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { getMaxGuests, getPlanLimits, type PlanType } from "@/lib/limits";
import { getTemplateBySlug } from "@/lib/templates";
import { getActiveAiTheme, getAiQuota } from "@/lib/ai-design/server";
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
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, aiCredits: true } }),
    getActiveInvitation(session.user.id),
    listUserInvitations(session.user.id),
    isAiDesignEnabled(),
  ]);
  if (!user) redirect("/login");

  const [guestCount, messages, rsvps, messageCount, aiQuota] = await Promise.all([
    prisma.guest.count({ where: { invitationId: active.id } }),
    prisma.guestMessage.findMany({ where: { invitationId: active.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.rSVP.findMany({ where: { invitationId: active.id }, select: { attendance: true, guests: true } }),
    prisma.guestMessage.count({ where: { invitationId: active.id } }),
    getAiQuota(user.id, (active.plan ?? "FREE") as PlanType),
  ]);
  const designHref = aiDesignEnabled ? "/desain-ai" : "/pilih-template";

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Bapak & Ibu Tamu", active.weddingDate ?? undefined);
  const plan = active.plan as PlanType;
  const limits = getPlanLimits(plan);
  const maxGuests = getMaxGuests(plan, active.extraGuestQuota ?? 0);
  const template = active.templateSlug ? getTemplateBySlug(active.templateSlug) : undefined;
  const aiTheme = active.templateSlug === "ai-design" ? await getActiveAiTheme(active.activeAiDesignId) : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://satumoment.com";
  const url = `${baseUrl}/${active.slug ?? ""}`;

  const hasCouple = Boolean(raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.fullName || raw.bride?.name);
  const hasEvents = Boolean(raw.events?.length || raw.event?.date);
  const hasGallery = data.gallery.length > 0;
  const couple = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : "kami";

  const daysLeft = daysUntil(hasEvents ? (data.events[0]?.date ?? data.event?.date) : active.weddingDate);

  const attending = rsvps.filter((r) => r.attendance.toUpperCase() === "HADIR").reduce((n, r) => n + (r.guests || 1), 0);

  const steps = [
    { label: "Pilih desain undangan", done: Boolean(template), href: designHref },
    { label: "Isi data kedua mempelai", done: hasCouple, href: "/editor" },
    { label: "Tambahkan jadwal acara", done: hasEvents, href: "/editor" },
    { label: "Unggah foto galeri", done: hasGallery, href: "/editor" },
    { label: "Masukkan daftar tamu", done: guestCount > 0, href: "/manajemen-tamu" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);


  const heroPhoto = data.gallery[0] || data.bride.photo || data.groom.photo || null;
  const eventDate = hasEvents ? (data.events[0]?.date ?? data.event?.date) : active.weddingDate ? new Date(active.weddingDate).toISOString().slice(0, 10) : null;
  const countdownTarget = eventDate ? (/^\d{4}-\d{2}-\d{2}$/.test(String(eventDate)) ? `${eventDate}T08:00:00+07:00` : new Date(eventDate).toISOString()) : null;
  const rsvpMaybe = rsvps.filter((r) => r.attendance.toUpperCase() === "MUNGKIN").length;
  const rsvpNo = rsvps.filter((r) => r.attendance.toUpperCase() === "TIDAK HADIR").length;
  const rsvpYes = rsvps.length - rsvpMaybe - rsvpNo;
  const pct = (n: number) => (rsvps.length ? (n / rsvps.length) * 100 : 0);
  const eventCount = data.events?.length || (data.event?.date ? 1 : 0);
  const aiUsedPct = aiQuota && aiQuota.total + aiQuota.topupCredits > 0 ? Math.min(100, (aiQuota.remaining / (aiQuota.total + aiQuota.topupCredits)) * 100) : 0;

  const statusLabel = plan === "FREE" ? "Mode pratinjau · belum diterbitkan" : active.isPublic === false ? "Undangan disembunyikan" : "Undangan aktif & bisa dibagikan";
  const statusDot = plan === "FREE" ? "bg-[#D9B56A]" : active.isPublic === false ? "bg-[#A89470]" : "bg-emerald-400";
  const previewHref = active.slug ? `/${active.slug}${plan === "FREE" || !active.isPublic ? "?preview=1" : ""}` : null;

  return (
    <>
      <SiteHeader user={session.user} />
      {/* Offered only on this page, now and then, after the visitor has settled in */}
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Hero: the couple's photo under an espresso wash and the gold lattice, with a live countdown */}
            <section className="relative isolate overflow-hidden rounded-3xl bg-[#1A1510] text-[#F6EEDD] shadow-[0_30px_60px_-34px_rgba(26,21,16,.8)] animate-in fade-in zoom-in-[0.98] duration-700">
              {heroPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroPhoto} alt="" className="uy-kenburns absolute inset-0 -z-10 h-full w-full object-cover object-[50%_30%]" />
              )}
              <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(26,21,16,.94)_0%,rgba(26,21,16,.78)_45%,rgba(26,21,16,.35)_100%)]" />
              <div aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0 -z-10 opacity-70" />
              <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="min-w-0 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[linear-gradient(120deg,#B8903F,#E6CB86_50%,#C9A24E)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1F1A14]">{greeting()}</span>
                    <Link href="/undangan" className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 text-xs text-[#E9DFCB] backdrop-blur-sm transition-colors hover:border-[#D9B56A]">
                      {active.title}
                      <span className="text-[#CDBF9F]">· {allInvitations.length} undangan</span>
                      <IconArrowsExchange size={13} />
                    </Link>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[#D9B56A]">The wedding of</p>
                    <h1 className="mt-2 font-(family-name:--font-landing-display) text-[2.5rem] leading-[1.05] tracking-[-0.01em] sm:text-[3.4rem]">
                      {hasCouple ? (
                        <span className="uy-name-reveal block">
                          {data.groom.nickname} <em className="bg-[linear-gradient(110deg,#B8903F,#F0DA9C_45%,#C9A24E_70%,#A8823A)] bg-clip-text px-1 text-transparent">&amp;</em> {data.bride.nickname}
                        </span>
                      ) : (
                        <span className="uy-name-reveal block">Halo, {user.name?.split(" ")[0] ?? "kalian"}</span>
                      )}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#E2D6BE]">
                      <span className={`size-2 rounded-full ${statusDot}`} /> {statusLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={nextStep?.href ?? "/manajemen-tamu"} className={buttonVariants({ variant: "gold", className: "h-11 px-6" })}>
                      {nextStep ? `Lanjutkan: ${nextStep.label.toLowerCase()}` : "Kirim ke tamu"} <IconArrowRight size={17} />
                    </Link>
                    {previewHref && (
                      <Link href={previewHref} target="_blank" className={buttonVariants({ variant: "ghost", className: "h-11 rounded-full border border-white/25 bg-white/5 px-5 text-[#F6EEDD] backdrop-blur-sm hover:bg-white/15 hover:text-white" })}>
                        <IconEye size={17} /> {plan === "FREE" || !active.isPublic ? "Pratinjau" : "Buka undangan"}
                      </Link>
                    )}
                  </div>
                </div>
                {countdownTarget && daysLeft !== null && daysLeft >= 0 && (
                  <div className="space-y-2 md:text-right">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#D9B56A]">Menuju hari bahagia</p>
                    <LiveCountdown target={countdownTarget} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-6 py-3 text-xs text-[#CDBF9F] backdrop-blur-sm sm:px-8">
                <IconLeaf size={15} className="shrink-0 text-[#A9C29A]" />
                Undangan digital kalian menghemat kertas cetak untuk {fmt.format(Math.max(guestCount, 1))} tamu.
              </div>
            </section>

            {/* RSVP at a glance */}
            <Panel delay={100} className="flex flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-[#6B5F50]">Konfirmasi RSVP</p>
                <span className="flex size-9 items-center justify-center rounded-full bg-[#F6EEDF] text-[#8A6424]">
                  <IconUserCheck size={18} stroke={1.6} />
                </span>
              </div>
              <p className="mt-2 font-(family-name:--font-landing-display) text-5xl tabular-nums lining-nums text-[#1F1A14]">{fmt.format(rsvps.length)}</p>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-[#F3EBDB]">
                <span className="bg-[linear-gradient(90deg,#B8903F,#E6CB86)] transition-all duration-700" style={{ width: `${pct(rsvpYes)}%` }} />
                <span className="bg-[#D9CBAE]" style={{ width: `${pct(rsvpMaybe)}%` }} />
                <span className="bg-[#6B5F50]" style={{ width: `${pct(rsvpNo)}%` }} />
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: "Hadir", value: rsvpYes, extra: `${fmt.format(attending)} orang`, dot: "bg-[#C9A24E]" },
                  { label: "Mungkin", value: rsvpMaybe, dot: "bg-[#D9CBAE]" },
                  { label: "Tidak hadir", value: rsvpNo, dot: "bg-[#6B5F50]" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[#40372B]">
                      <span className={`size-2 rounded-full ${r.dot}`} /> {r.label}
                    </span>
                    <span className="tabular-nums text-[#1F1A14]">
                      {r.extra && <span className="mr-2 text-xs text-[#8E8268]">{r.extra}</span>}
                      {fmt.format(r.value)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/buku-tamu" className="group mt-auto flex min-h-10 items-center gap-1 pt-4 text-sm font-medium text-[#8A6424]">
                Lihat daftar RSVP <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Panel>
          </div>

          {/* One connected strip of numbers */}
          <section className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#EDE3CF] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)] animate-in fade-in slide-in-from-bottom-2 duration-700 [animation-delay:150ms] [animation-fill-mode:backwards] sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Tamu terdaftar", value: fmt.format(guestCount), sub: maxGuests === Infinity ? "tanpa batas" : `dari ${fmt.format(maxGuests)}`, icon: IconUsers, href: "/manajemen-tamu" },
              { label: "Dilihat", value: fmt.format(active.views), icon: IconEye },
              { label: "Akan hadir", value: fmt.format(attending), sub: "orang", icon: IconHeartHandshake, href: "/buku-tamu" },
              { label: "Ucapan", value: fmt.format(messageCount), icon: IconMessageHeart, href: "/buku-tamu" },
              { label: "Acara", value: fmt.format(eventCount), icon: IconCalendarEvent, href: "/editor" },
            ].map((it) => {
              const inner = (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-[#6B5F50]">
                    <it.icon size={15} stroke={1.7} className="text-[#8A6424]" /> {it.label}
                  </span>
                  <span className="mt-1.5 block font-(family-name:--font-landing-display) text-[1.7rem] tabular-nums lining-nums leading-none text-[#1F1A14]">
                    {it.value}
                    {it.sub && <span className="ml-1.5 font-sans text-xs text-[#8E8268]">{it.sub}</span>}
                  </span>
                </>
              );
              const cls = "block border-b border-r border-[#F3EBDB] px-4 py-4 sm:px-5";
              return it.href ? (
                <Link key={it.label} href={it.href} className={`${cls} transition-colors hover:bg-[#FCF8F1]`}>
                  {inner}
                </Link>
              ) : (
                <div key={it.label} className={cls}>
                  {inner}
                </div>
              );
            })}
            <Link href="/desain-ai" className="block border-b border-r border-[#F3EBDB] px-4 py-4 transition-colors hover:bg-[#FCF8F1] sm:px-5">
              <span className="flex items-center gap-1.5 text-xs text-[#6B5F50]">
                <IconPalette size={15} stroke={1.7} className="text-[#8A6424]" /> Kredit desain AI
              </span>
              <span className="mt-1.5 block font-(family-name:--font-landing-display) text-[1.7rem] tabular-nums lining-nums leading-none text-[#1F1A14]">
                {aiQuota ? fmt.format(aiQuota.remaining) : 0}
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[#F3EBDB]">
                <span className="block h-full rounded-full bg-[linear-gradient(90deg,#B8903F,#E6CB86)]" style={{ width: `${aiUsedPct}%` }} />
              </span>
            </Link>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              {/* Design & sharing */}
              <Panel delay={120} className="p-5 sm:p-6">
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6424]">Desain undangan</p>
                <h2 className="mt-2 font-(family-name:--font-landing-display) text-3xl text-[#1F1A14]">{aiTheme?.name ?? template?.name ?? active.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6B5F50]">
                  {aiTheme ? aiTheme.mood : template ? template.description : "Pilih desain, isi data, lalu bagikan link ini ke tamu."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/editor" className={buttonVariants({ variant: "ink", size: "sm", className: "h-10 px-4" })}>
                      <IconPencil size={16} /> Ubah isi
                    </Link>
                  <Link href={designHref} className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 rounded-full border-[#E9DDC6] px-4" })}>
                      <IconPalette size={16} /> Ganti desain
                    </Link>
                </div>
                {active.slug && (
                  <div className="mt-6 border-t border-[#F3EBDB] pt-5">
                    <ShareLink url={url} couple={couple} />
                  </div>
                )}
                </div>
                {/* The invitation as guests see it */}
                <div className="hidden justify-center sm:flex">
                  {aiTheme ? (
                    <Phone theme={aiTheme} data={data} zoom={0.4} />
                  ) : template ? (
                    <div className="relative h-[300px] w-[162px] overflow-hidden rounded-[26px] border-[6px] border-[#111] bg-white">
                      <Image src={template.thumbnail} alt={template.name} fill sizes="162px" className="object-cover" />
                    </div>
                  ) : (
                    <Link href={designHref} className="flex h-[300px] w-[162px] flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-[#D9CBAE] px-5 text-center text-sm text-[#6B5F50] transition-colors hover:border-[#8A6424]">
                      <IconPalette size={24} className="text-[#8A6424]" />
                      Pilih desain
                    </Link>
                  )}
                </div>
                </div>
              </Panel>

              {/* Recent wishes */}
              <Panel delay={180} className="p-5 sm:p-6">
                <PanelTitle href="/buku-tamu">Ucapan terbaru</PanelTitle>
                {messages.length ? (
                  <ul className="space-y-3">
                    {messages.map((m) => (
                      <li key={m.id} className="flex gap-3 rounded-xl bg-[#FCF8F1] p-3.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F6EEDF] font-(family-name:--font-landing-display) text-base text-[#8A6424]">
                          {m.guestName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium text-[#1F1A14]">{m.guestName}</p>
                          <p className="line-clamp-2 text-[15px] leading-relaxed text-[#6B5F50]">{m.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E9DDC6] px-5 py-8 text-center text-[15px] text-[#6B5F50]">
                    <IconMessageHeart size={26} className="mx-auto mb-2 text-[#D9B56A]" stroke={1.5} />
                    Ucapan dan doa dari tamu akan muncul di sini setelah undangan dibagikan.
                  </div>
                )}
              </Panel>
            </div>

            <aside className="space-y-6 max-lg:contents">
              {/* Checklist — moves to the top on small screens until setup is done */}
              <Panel delay={140} className={`p-5 sm:p-6 ${nextStep ? "max-lg:order-first" : ""}`}>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Persiapan</h2>
                  <span className="text-sm tabular-nums text-[#6B5F50]">
                    {doneCount}/{steps.length}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F3EBDB]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#B8903F,#E6CB86,#C9A24E)] transition-all duration-700" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                </div>
                <ul className="mt-4 space-y-1">
                  {steps.map((s) => (
                    <li key={s.label}>
                      <Link href={s.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-[15px] transition-colors hover:bg-[#FCF8F1]">
                        <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-[#8A6424] bg-[#8A6424] text-white" : "border-[#D9CBAE]"}`}>
                          {s.done && <IconCheck size={13} stroke={2.5} />}
                        </span>
                        <span className={s.done ? "text-[#9A9083] line-through decoration-[#D9CBAE]" : "text-[#1F1A14]"}>{s.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* Plan */}
              <Panel tone="night" delay={200} className="p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#D9B56A]">Paket kalian</p>
                <p className="mt-2 font-(family-name:--font-landing-display) text-3xl">{limits.name}</p>
                <ul className="mt-4 space-y-2 text-sm text-[#CDBF9F]">
                  <li className="flex gap-2">
                    <IconCheck size={16} className="mt-0.5 shrink-0 text-[#D9B56A]" />
                    {maxGuests === Infinity ? "Tamu tanpa batas" : `Hingga ${fmt.format(maxGuests)} tamu bernama`}
                  </li>
                  {aiQuota && (
                    <li className="flex gap-2">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-[#D9B56A]" />
                      Sisa {aiQuota.remaining} kredit desain AI{aiQuota.topupCredits > 0 ? ` (${aiQuota.topupCredits} dari top-up)` : ""}
                    </li>
                  )}
                  <li className="flex gap-2">
                    <IconCheck size={16} className="mt-0.5 shrink-0 text-[#D9B56A]" />
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
                  <Link href="/upgrade" className={buttonVariants({ variant: "gold", className: "mt-5 h-11 w-full" })}>{plan === "FREE" ? "Aktifkan paket" : "Tingkatkan paket"}</Link>
                )}
              </Panel>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
