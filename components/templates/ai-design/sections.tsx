"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { IconBrandInstagram, IconCalendarPlus, IconCheck, IconCopy, IconMapPin, IconSend } from "@tabler/icons-react";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { WeddingData, WeddingEvent } from "@/types/wedding";
import { useCountdown } from "@/hooks/use-countdown";
import { Corners, Divider, foilTextStyle } from "./ornaments";
import { invitationSlugFromPath, submitRsvp, type Attendance, type Wish } from "@/lib/rsvp";
import { cardShape, displayItalic, isScript, labelClass, photoShape } from "./theme";

// ─── helpers ─────────────────────────────────────────────────────────────

const validDate = (d: string | Date | null | undefined) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Formats a date in Indonesian; returns "" for missing or invalid dates (an event without a date yet). */
const fmtDate = (d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) => {
  const date = validDate(d);
  return date ? new Intl.DateTimeFormat("id-ID", opts).format(date) : "";
};

export function getEvents(data: WeddingData): WeddingEvent[] {
  if (data.events?.length) return data.events;
  if (data.event) return [{ id: "main", title: "Resepsi", ...data.event }];
  return [];
}

export function mainDate(data: WeddingData) {
  return validDate(getEvents(data)[0]?.date);
}

export function coverPhoto(data: WeddingData) {
  return data.gallery?.[0] || data.bride.photo || data.groom.photo;
}

function frameStyle(theme: AiTheme): CSSProperties {
  const c = "color-mix(in srgb, var(--accent) 60%, transparent)";
  switch (theme.frame) {
    case "hairline":
      return { border: `1px solid ${c}` };
    case "double":
      return { border: `4px double ${c}` };
    case "dotted":
      return { border: `1.5px dotted var(--accent)` };
    default:
      return {};
  }
}

type RevealVariant = "up" | "left" | "right" | "scale";

const REVEAL_HIDDEN: Record<RevealVariant, string> = {
  up: "opacity-0 translate-y-4",
  left: "opacity-0 -translate-x-5",
  right: "opacity-0 translate-x-5",
  scale: "opacity-0 scale-[0.96]",
};

function Reveal({ children, className = "", delay = 0, variant = "up" }: { children: ReactNode; className?: string; delay?: number; variant?: RevealVariant }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Trigger slightly before the element enters the viewport so fast scrolling never shows blank space
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { rootMargin: "0px 0px 20% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${shown ? "opacity-100 translate-x-0 translate-y-0 scale-100" : `${REVEAL_HIDDEN[variant]} motion-reduce:opacity-100 motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100`} ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ theme, children, className = "", tone = "accent" }: { theme: AiTheme; children: ReactNode; className?: string; tone?: "accent" | "muted" }) {
  return (
    <p className={`${labelClass(theme)} ${className}`} style={{ color: tone === "accent" ? "var(--accent)" : "var(--muted)" }}>
      {children}
    </p>
  );
}

function Heading({ theme, children, className = "" }: { theme: AiTheme; children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[2.1rem] leading-tight sm:text-5xl ${displayItalic(theme) ? "italic" : ""} ${className}`} style={{ fontFamily: "var(--font-display)" }}>
      {children}
    </h2>
  );
}

function Names({ theme, children, className = "" }: { theme: AiTheme; children: ReactNode; className?: string }) {
  const script = isScript(theme.typography.names);
  return (
    <span
      className={`block ${script ? "leading-[1.15] pb-1" : "leading-none tracking-tight"} ${className}`}
      style={{ fontFamily: "var(--font-names)", ...foilTextStyle(theme) }}
    >
      {children}
    </span>
  );
}

function Photo({ src, alt, className, fallback }: { src?: string; alt: string; className: string; fallback: string }) {
  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ background: "var(--accent-soft)" }}>
        <span className="text-5xl" style={{ fontFamily: "var(--font-names)", color: "var(--accent)" }}>
          {fallback.charAt(0)}
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`${className} object-cover object-[50%_20%]`} loading="lazy" />;
}

function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative px-6 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-xl">{children}</div>
    </section>
  );
}

// ─── Desktop Sticky Stage (shown on lg+ when opened & not embedded) ──────

export function DesktopStage({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const photo = coverPhoto(data);
  const date = mainDate(data);
  const script = isScript(theme.typography.names);

  return (
    <aside
      className="relative hidden overflow-hidden border-r lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-between lg:p-10 xl:p-12"
      style={{ borderColor: "color-mix(in srgb, var(--ink) 10%, transparent)", background: "var(--surface)" }}
    >
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.78) 100%)" }} />
          <Corners theme={theme} size="w-24 h-24" opacity="opacity-85" />
          <div className="relative z-10">
            <Label theme={theme} className="text-white/85!">
              {theme.copy.coverEyebrow}
            </Label>
          </div>
          <div className="relative z-10 space-y-3 text-white" style={{ ["--muted" as string]: "rgba(255,255,255,.82)" }}>
            <Names theme={theme} className={script ? "text-6xl xl:text-7xl" : "text-5xl uppercase xl:text-6xl"}>
              {data.groom.nickname} &amp; {data.bride.nickname}
            </Names>
            {date && <p className="text-sm tracking-[0.2em] text-white/85">{fmtDate(date)}</p>}
          </div>
        </>
      ) : (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-8 text-center" style={frameStyle({ ...theme, frame: theme.frame === "none" ? "hairline" : theme.frame })}>
          <Corners theme={theme} />
          <Label theme={theme}>{theme.copy.coverEyebrow}</Label>
          <Names theme={theme} className={script ? "text-6xl" : "text-5xl uppercase"}>
            {data.groom.nickname}
          </Names>
          <span className="text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
            &amp;
          </span>
          <Names theme={theme} className={script ? "text-6xl" : "text-5xl uppercase"}>
            {data.bride.nickname}
          </Names>
          <Divider theme={theme} />
          {date && (
            <p className="text-sm tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {fmtDate(date)}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}

// ─── Cover ───────────────────────────────────────────────────────────────

export function Cover({ theme, data, opened, onOpen, screen, embedded = false, staticCover = false }: { theme: AiTheme; data: WeddingData; opened: boolean; onOpen: () => void; screen: string; embedded?: boolean; staticCover?: boolean }) {
  const photo = coverPhoto(data);
  const layout = !photo && (theme.layout.cover === "photo-fullbleed" || theme.layout.cover === "split-photo") ? "centered-frame" : theme.layout.cover;
  const date = mainDate(data);
  const script = isScript(theme.typography.names);
  const namesSize = script ? "text-[3.6rem] sm:text-7xl" : "text-[2.9rem] sm:text-6xl uppercase";

  const guest = data.guestName && (
    <div className="space-y-1.5">
      <Label theme={theme} tone="muted" className="opacity-90">
        Kepada Yth. Bapak/Ibu/Saudara/i
      </Label>
      <p className="text-lg font-medium">{data.guestName}</p>
    </div>
  );

  const btnClass = `inline-flex min-h-11 items-center gap-2 px-8 py-3 text-sm font-medium tracking-wide transition-transform duration-300 hover:-translate-y-0.5 ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"}`;
  const btnStyle = { background: "var(--accent)", color: "var(--on-accent)" };

  const button = !opened && (
    staticCover ? (
      <span className={btnClass} style={btnStyle}>
        {theme.copy.openButton}
      </span>
    ) : (
      <button
        type="button"
        onClick={onOpen}
        className={btnClass}
        style={btnStyle}
      >
        {theme.copy.openButton}
      </button>
    )
  );

  const nameBlock = (
    <div className="space-y-1">
      <Names theme={theme} className={namesSize}>
        {data.groom.nickname}
      </Names>
      <span className="block text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
        &amp;
      </span>
      <Names theme={theme} className={namesSize}>
        {data.bride.nickname}
      </Names>
    </div>
  );

  const dateLine = date && (
    <p className="text-sm tracking-[0.18em]" style={{ color: "var(--muted)" }}>
      {fmtDate(date)}
    </p>
  );

  if (layout === "photo-fullbleed") {
    if (!embedded && !opened) {
      return (
        <section className={`relative min-h-svh overflow-hidden lg:grid lg:grid-cols-[1.08fr_1fr]`}>
          {/* Photo stage: full-bleed on mobile, clean portrait half on desktop so faces are never cropped */}
          <div className="relative flex min-h-svh flex-col items-center justify-end overflow-hidden px-6 pb-16 text-center lg:min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
            <div className="absolute inset-0 lg:hidden" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.35) 45%, var(--bg) 100%)" }} />
            <div className="absolute inset-0 hidden lg:block" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.45) 100%)" }} />
            <div className="lg:hidden">
              <Corners theme={theme} size="w-28 h-28" opacity="opacity-90" />
            </div>
            <div className="relative z-10 space-y-6 text-white lg:hidden" style={{ ["--muted" as string]: "rgba(255,255,255,.82)" }}>
              <Label theme={theme} className="text-white/85!">
                {theme.copy.coverEyebrow}
              </Label>
              {nameBlock}
              {dateLine}
              {guest}
              {button}
            </div>
          </div>

          {/* Desktop editorial invitation card on right half */}
          <div className="relative hidden flex-col items-center justify-center gap-7 px-10 py-16 text-center lg:flex">
            <Corners theme={theme} size="w-28 h-28" opacity="opacity-85" />
            <Label theme={theme}>{theme.copy.coverEyebrow}</Label>
            {nameBlock}
            <Divider theme={theme} />
            {dateLine}
            {guest}
            {button}
          </div>
        </section>
      );
    }

    return (
      <section className={`relative flex ${screen} flex-col items-center justify-end overflow-hidden px-6 pb-16 text-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.35) 45%, var(--bg) 100%)" }} />
        <Corners theme={theme} size="w-28 h-28" opacity="opacity-90" />
        <div className="relative z-10 space-y-6 text-white" style={{ ["--muted" as string]: "rgba(255,255,255,.82)" }}>
          <Label theme={theme} className="text-white/85!">
            {theme.copy.coverEyebrow}
          </Label>
          {nameBlock}
          {dateLine}
          {guest}
          {button}
        </div>
      </section>
    );
  }

  if (layout === "split-photo") {
    return (
      <section className={`relative grid ${screen} grid-rows-[1.15fr_1fr] ${!embedded ? "lg:grid-cols-2 lg:grid-rows-1" : ""}`}>
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
        </div>
        <div className="relative flex flex-col items-center justify-center gap-5 px-6 py-10 text-center lg:px-12">
          <Corners theme={theme} size="w-20 h-20" opacity="opacity-70" />
          <Label theme={theme}>{theme.copy.coverEyebrow}</Label>
          {nameBlock}
          {dateLine}
          {guest}
          {button}
        </div>
      </section>
    );
  }

  if (layout === "arch-window") {
    return (
      <section className={`relative flex ${screen} flex-col items-center justify-center gap-7 px-6 py-14 text-center`}>
        <div className="relative">
          <div className="absolute -inset-2.5 rounded-t-full rounded-b-[22px]" style={frameStyle({ ...theme, frame: theme.frame === "none" ? "hairline" : theme.frame })} />
          <Photo src={photo} alt="" fallback={data.groom.nickname} className="relative h-72 w-52 rounded-t-full rounded-b-[18px]" />
        </div>
        <Label theme={theme}>{theme.copy.coverEyebrow}</Label>
        {nameBlock}
        {dateLine}
        {guest}
        {button}
      </section>
    );
  }

  if (layout === "typographic") {
    return (
      <section className={`relative flex ${screen} flex-col justify-center gap-8 px-8 py-16 ${!embedded ? "mx-auto max-w-2xl" : ""}`}>
        <Label theme={theme}>{theme.copy.coverEyebrow}</Label>
        <div className="space-y-2">
          <Names theme={theme} className={script ? "text-7xl" : "text-[3.4rem] uppercase sm:text-7xl"}>
            {data.groom.nickname}
          </Names>
          <div className="flex items-center gap-4">
            <span className="h-px flex-1" style={{ background: "var(--accent)" }} />
            <span className="text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}>
              &amp;
            </span>
          </div>
          <Names theme={theme} className={`text-right ${script ? "text-7xl" : "text-[3.4rem] uppercase sm:text-7xl"}`}>
            {data.bride.nickname}
          </Names>
        </div>
        {dateLine}
        <div className="flex flex-col items-start gap-6">
          {guest}
          {button}
        </div>
      </section>
    );
  }

  // centered-frame
  return (
    <section className={`relative flex ${screen} items-center justify-center p-4 ${!embedded ? "lg:p-8" : ""}`}>
      <div className={`relative flex h-full min-h-[inherit] w-full flex-col items-center justify-center gap-7 px-6 py-16 text-center ${!embedded ? "lg:max-w-2xl" : ""}`} style={frameStyle({ ...theme, frame: theme.frame === "none" ? "hairline" : theme.frame })}>
        <Corners theme={theme} />
        <Label theme={theme}>{theme.copy.coverEyebrow}</Label>
        {nameBlock}
        <Divider theme={theme} />
        {dateLine}
        {guest}
        {button}
      </div>
    </section>
  );
}

// ─── Opening ─────────────────────────────────────────────────────────────

export function Opening({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  return (
    <Section>
      <Reveal className="space-y-8 text-center">
        <Divider theme={theme} />
        {data.quote?.text && (
          <figure className={`relative px-6 py-9 ${cardShape(theme)}`} style={{ ...frameStyle(theme), background: "var(--surface)" }}>
            <blockquote className={`text-[15px] leading-relaxed ${displayItalic(theme) ? "italic" : ""}`} style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
              “{data.quote.text}”
            </blockquote>
            {data.quote.source && (
              <figcaption className="mt-4">
                <Label theme={theme}>{data.quote.source}</Label>
              </figcaption>
            )}
          </figure>
        )}
        <div className="space-y-4">
          <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
            {theme.copy.greeting}
          </p>
          <p className="leading-relaxed" style={{ color: "var(--muted)" }}>
            {theme.copy.opening}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

// ─── Couple ──────────────────────────────────────────────────────────────

type Person = WeddingData["groom"];

function Parents({ theme, person, role }: { theme: AiTheme; person: Person; role: "Putra" | "Putri" }) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {role} dari Bapak {person.fatherName.replace(/^(Bpk\.?|Bapak)\s*/i, "")}
        <br />& Ibu {person.motherName.replace(/^(Ibu)\s*/i, "")}
      </p>
      {person.instagram && (
        <a href={`https://instagram.com/${person.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm" style={{ color: "var(--accent)" }}>
          <IconBrandInstagram size={16} /> {person.instagram.replace("@", "")}
        </a>
      )}
      <span className="sr-only">{theme.name}</span>
    </div>
  );
}

function PersonBlock({ theme, person, role, align = "center", variant = "up" }: { theme: AiTheme; person: Person; role: "Putra" | "Putri"; align?: "center" | "left" | "right"; variant?: RevealVariant }) {
  const layout = theme.layout.couple;
  const script = isScript(theme.typography.names);
  const textAlign = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  const photo =
    layout === "portrait-circle" ? (
      <div className="relative mx-auto w-fit rounded-full p-2" style={{ ...frameStyle({ ...theme, frame: theme.frame === "none" ? "hairline" : theme.frame }) }}>
        <Photo src={person.photo} alt={person.fullName} fallback={person.nickname} className="h-52 w-52 rounded-full" />
      </div>
    ) : layout === "stacked-arch" ? (
      <Photo src={person.photo} alt={person.fullName} fallback={person.nickname} className="mx-auto h-72 w-56 rounded-t-full rounded-b-[18px]" />
    ) : layout === "editorial" ? (
      <Photo src={person.photo} alt={person.fullName} fallback={person.nickname} className={`h-80 w-full ${photoShape(theme)}`} />
    ) : (
      <Photo src={person.photo} alt={person.fullName} fallback={person.nickname} className={`aspect-3/4 w-full ${photoShape(theme)}`} />
    );

  return (
    <Reveal variant={variant} className={`space-y-5 ${textAlign}`}>
      {photo}
      <div className="space-y-2">
        <Names theme={theme} className={script ? "text-5xl" : "text-4xl uppercase"}>
          {person.nickname}
        </Names>
        <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
          {person.fullName}
        </p>
      </div>
      <Parents theme={theme} person={person} role={role} />
    </Reveal>
  );
}

export function Couple({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const amp = (
    <Reveal variant="scale" className="py-2 text-center">
      <span className="text-5xl" style={{ fontFamily: "var(--font-names)", color: "var(--accent)" }}>
        &amp;
      </span>
    </Reveal>
  );

  return (
    <Section id="mempelai">
      <Reveal className="mb-14 space-y-3 text-center">
        <Label theme={theme}>Mempelai</Label>
        <Heading theme={theme}>Dua Hati, Satu Janji</Heading>
      </Reveal>
      {theme.layout.couple === "side-by-side" ? (
        <div className="grid grid-cols-2 gap-5">
          <PersonBlock theme={theme} person={data.groom} role="Putra" variant="left" />
          <PersonBlock theme={theme} person={data.bride} role="Putri" variant="right" />
        </div>
      ) : theme.layout.couple === "editorial" ? (
        <div className="space-y-12">
          <div className="pr-10">
            <PersonBlock theme={theme} person={data.groom} role="Putra" align="left" variant="left" />
          </div>
          {amp}
          <div className="pl-10">
            <PersonBlock theme={theme} person={data.bride} role="Putri" align="right" variant="right" />
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <PersonBlock theme={theme} person={data.groom} role="Putra" variant="left" />
          {amp}
          <PersonBlock theme={theme} person={data.bride} role="Putri" variant="right" />
        </div>
      )}
    </Section>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────

function calendarUrl(data: WeddingData, date: Date) {
  const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const next = new Date(date.getTime() + 86400000);
  const ev = getEvents(data)[0];
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Pernikahan ${data.groom.nickname} & ${data.bride.nickname}`,
    dates: `${day(date)}/${day(next)}`,
    location: ev ? `${ev.venue}, ${ev.address}` : "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function Countdown({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const date = mainDate(data) ?? new Date();
  const t = useCountdown(date);
  const units: [number, string][] = [
    [t.days, "Hari"],
    [t.hours, "Jam"],
    [t.minutes, "Menit"],
    [t.seconds, "Detik"],
  ];
  return (
    <section className="relative px-6 py-20" style={{ background: "var(--accent-soft)" }}>
      <Reveal className="mx-auto max-w-xl space-y-8 text-center">
        <Label theme={theme}>Menuju Hari Bahagia</Label>
        <p className="text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          {fmtDate(date)}
        </p>
        <div className="mx-auto grid max-w-sm grid-cols-4 gap-3">
          {units.map(([n, l]) => (
            <div key={l} className={`py-4 ${cardShape(theme)}`} style={{ background: "var(--surface)", ...frameStyle(theme) }}>
              <p className="text-3xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                {String(n).padStart(2, "0")}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                {l}
              </p>
            </div>
          ))}
        </div>
        <a
          href={calendarUrl(data, date)}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex min-h-11 items-center gap-2 px-6 text-sm ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"}`}
          style={{ border: "1px solid var(--accent)", color: "var(--ink)" }}
        >
          <IconCalendarPlus size={18} style={{ color: "var(--accent)" }} /> Simpan ke Kalender
        </a>
      </Reveal>
    </section>
  );
}

// ─── Events ──────────────────────────────────────────────────────────────

function MapButton({ theme, url }: { theme: AiTheme; url: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-11 items-center gap-2 px-6 text-sm font-medium ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"}`}
      style={{ background: "var(--accent)", color: "var(--on-accent)" }}
    >
      <IconMapPin size={17} /> Lihat Lokasi
    </a>
  );
}

/** Small OpenStreetMap preview (when the couple pinned the venue) plus the directions button. */
function EventLocation({ theme, ev }: { theme: AiTheme; ev: WeddingEvent }) {
  const hasPin = typeof ev.lat === "number" && typeof ev.lng === "number";
  const bbox = hasPin ? [ev.lng! - 0.006, ev.lat! - 0.004, ev.lng! + 0.006, ev.lat! + 0.004].map((n) => n.toFixed(5)).join(",") : "";
  return (
    <div className="space-y-4">
      {hasPin && (
        <div className={`overflow-hidden ${theme.corners === "sharp" ? "rounded-none" : "rounded-[12px]"}`} style={{ border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)" }}>
          <iframe
            title={`Peta lokasi ${ev.venue || ev.title}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${ev.lat!.toFixed(6)},${ev.lng!.toFixed(6)}`}
            className="pointer-events-none block h-52 w-full"
            loading="lazy"
          />
        </div>
      )}
      <MapButton theme={theme} url={ev.mapUrl || (hasPin ? `https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}` : "")} />
    </div>
  );
}

export function Events({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const events = getEvents(data);
  if (!events.length) return null;
  const layout = theme.layout.events;

  return (
    <Section id="acara">
      <Reveal className="mb-12 space-y-3 text-center">
        <Label theme={theme}>Rangkaian Acara</Label>
        <Heading theme={theme}>Save the Date</Heading>
      </Reveal>

      {layout === "timeline" ? (
        <ol className="relative space-y-12 border-l pl-8" style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)" }}>
          {events.map((ev, i) => (
            <li key={ev.id ?? i} className="relative">
              <span className="absolute -left-[38.5px] top-1.5 h-3.5 w-3.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 0 5px var(--bg)" }} />
              <Reveal variant="right" className="space-y-3" delay={i * 80}>
                <Label theme={theme}>{fmtDate(ev.date)}</Label>
                <h3 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  {ev.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Pukul {ev.time}
                </p>
                <p className="font-medium">{ev.venue}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {ev.address}
                </p>
                <EventLocation theme={theme} ev={ev} />
              </Reveal>
            </li>
          ))}
        </ol>
      ) : layout === "ticket" ? (
        <div className="space-y-6">
          {events.map((ev, i) => {
            const d = validDate(ev.date);
            return (
              <Reveal key={ev.id ?? i} variant={i % 2 === 0 ? "left" : "right"} delay={i * 80}>
                <article className={`grid grid-cols-[88px_1fr] overflow-hidden ${cardShape(theme)}`} style={{ background: "var(--surface)", ...frameStyle(theme) }}>
                  <div className="flex flex-col items-center justify-center gap-1 border-r border-dashed py-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)", background: "var(--accent-soft)" }}>
                    <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      {fmtDate(d, { month: "short" })}
                    </span>
                    <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                      {d?.getDate() ?? "–"}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      {fmtDate(d, { weekday: "short" })}
                    </span>
                  </div>
                  <div className="space-y-2 p-5">
                    <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                      {ev.title}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      Pukul {ev.time}
                    </p>
                    <p className="font-medium">{ev.venue}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {ev.address}
                    </p>
                    <div className="pt-2">
                      <EventLocation theme={theme} ev={ev} />
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((ev, i) => (
            <Reveal key={ev.id ?? i} delay={i * 80}>
              <article className={`relative space-y-4 px-6 py-10 text-center ${cardShape(theme)}`} style={{ background: "var(--surface)", ...frameStyle(theme) }}>
                <Corners theme={theme} size="w-16 h-16" opacity="opacity-60" />
                <h3 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  {ev.title}
                </h3>
                <Divider theme={theme} className="mx-auto h-5 w-36" />
                <p className="text-lg">{fmtDate(ev.date)}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Pukul {ev.time}
                </p>
                <p className="font-medium">{ev.venue}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {ev.address}
                </p>
                <EventLocation theme={theme} ev={ev} />
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Story ───────────────────────────────────────────────────────────────

export function Story({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const chapters = data.loveStory?.enabled && data.loveStory.chapters?.length ? data.loveStory.chapters : data.story?.content ? [{ title: data.story.title, content: data.story.content }] : [];
  if (!chapters.length) return null;
  return (
    <Section>
      <Reveal className="mb-12 space-y-3 text-center">
        <Label theme={theme}>Kisah Kami</Label>
        <Heading theme={theme}>Perjalanan Cinta</Heading>
      </Reveal>
      <div className="space-y-10">
        {chapters.map((c, i) => (
          <Reveal key={i} variant={i % 2 === 0 ? "left" : "right"} delay={i * 60} className="space-y-3 text-center">
            <p className="text-xs tabular-nums tracking-[0.3em]" style={{ color: "var(--accent)" }}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
              {c.title}
            </h3>
            <p className="leading-relaxed" style={{ color: "var(--muted)" }}>
              {c.content}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────

export function Gallery({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const photos = (data.gallery ?? []).filter(Boolean);
  if (!photos.length) return null;
  const shape = theme.corners === "sharp" ? "rounded-none" : "rounded-[12px]";
  const layout = theme.layout.gallery;

  return (
    <section id="galeri" className="relative py-20 sm:py-28">
      <Reveal className="mb-12 space-y-3 px-6 text-center">
        <Label theme={theme}>Galeri</Label>
        <Heading theme={theme}>Momen Berharga</Heading>
      </Reveal>
      {layout === "filmstrip" ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-4 [scrollbar-width:none]">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" loading="lazy" className={`h-96 w-[72%] shrink-0 snap-center object-cover ${shape}`} />
          ))}
        </div>
      ) : layout === "grid" ? (
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-1.5 px-6">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" loading="lazy" className={`aspect-square w-full object-cover ${i === 0 ? "col-span-2 row-span-2" : ""} ${shape}`} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-xl columns-2 gap-3 px-6 [&>*]:mb-3">
          {photos.map((src, i) => (
            <Reveal key={i} variant="scale" delay={(i % 4) * 60}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className={`w-full object-cover transition-transform duration-700 hover:scale-[1.03] ${i % 3 === 0 ? "aspect-3/4" : "aspect-square"} ${shape}`} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Video ───────────────────────────────────────────────────────────────

export function Video({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  if (!data.video) return null;
  const yt = data.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)?.[1];
  return (
    <Section>
      <Reveal className={`overflow-hidden ${cardShape(theme)}`} >
        {yt ? (
          <iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${yt}`} title="Video" allow="encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <video className="aspect-video w-full" src={data.video} controls playsInline />
        )}
      </Reveal>
    </Section>
  );
}

// ─── Gift ────────────────────────────────────────────────────────────────

function Copy({ theme, text }: { theme: AiTheme; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className={`inline-flex min-h-11 items-center gap-2 px-5 text-sm ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"}`}
      style={{ border: "1px solid var(--accent)" }}
    >
      {done ? <IconCheck size={16} style={{ color: "var(--accent)" }} /> : <IconCopy size={16} style={{ color: "var(--accent)" }} />}
      {done ? "Tersalin" : "Salin Nomor"}
    </button>
  );
}

export function Gift({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  if (!data.gifts?.enabled || !data.gifts.bankAccounts?.length) return null;
  return (
    <Section id="hadiah">
      <Reveal className="mb-10 space-y-4 text-center">
        <Label theme={theme}>Tanda Kasih</Label>
        <Heading theme={theme}>Amplop Digital</Heading>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Doa restu Anda adalah hadiah terindah. Bila berkenan memberi tanda kasih, dapat melalui:
        </p>
      </Reveal>
      <div className="space-y-4">
        {data.gifts.bankAccounts.map((b, i) => (
          <Reveal key={i} delay={i * 60}>
            <div className={`space-y-3 px-6 py-7 text-center ${cardShape(theme)}`} style={{ background: "var(--surface)", ...frameStyle(theme) }}>
              <Label theme={theme}>{b.bankName}</Label>
              <p className="text-2xl tabular-nums tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                {b.accountNumber}
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                a.n. {b.accountHolder}
              </p>
              <Copy theme={theme} text={b.accountNumber} />
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ─── RSVP & wishes ───────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return fmtDate(iso, { day: "numeric", month: "short", year: "numeric" });
}

export function Rsvp({ theme, data, preview }: { theme: AiTheme; data: WeddingData; preview: boolean }) {
  const [name, setName] = useState(data.guestName && data.guestName !== "Tamu Undangan" ? data.guestName : "");
  const [attendance, setAttendance] = useState<Attendance>("HADIR");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [wishes, setWishes] = useState<Wish[]>(data.wishes ?? []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (preview) {
      // In the studio preview, show the wish locally without saving it
      if (message.trim()) setWishes((w) => [{ guestName: name, message, createdAt: new Date().toISOString() }, ...w]);
      setState("sent");
      return;
    }
    setState("sending");
    try {
      await submitRsvp({ slug: invitationSlugFromPath(), name, attendance, message });
      if (message.trim()) setWishes((w) => [{ guestName: name, message, createdAt: new Date().toISOString() }, ...w]);
      setState("sent");
      setMessage("");
    } catch {
      setState("error");
    }
  };

  const radius = theme.corners === "sharp" ? "rounded-none" : "rounded-[12px]";
  const field = `w-full bg-transparent px-4 py-3 text-[15px] outline-none transition focus:ring-2 ${radius}`;
  const fieldStyle: CSSProperties = { border: "1px solid color-mix(in srgb, var(--ink) 18%, transparent)", ["--tw-ring-color" as string]: "color-mix(in srgb, var(--accent) 45%, transparent)" };

  return (
    <Section id="ucapan">
      <Reveal className="mb-10 space-y-3 text-center">
        <Label theme={theme}>RSVP & Ucapan</Label>
        <Heading theme={theme}>Konfirmasi Kehadiran</Heading>
      </Reveal>
      <Reveal>
        {state === "sent" ? (
          <div className={`space-y-2 px-6 py-10 text-center ${cardShape(theme)}`} style={{ background: "var(--surface)", ...frameStyle(theme) }}>
            <IconCheck className="mx-auto" style={{ color: "var(--accent)" }} />
            <p style={{ fontFamily: "var(--font-display)" }} className="text-2xl">
              Terima kasih
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Konfirmasi dan doa Anda sudah kami terima.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className={`space-y-4 p-6 ${cardShape(theme)}`} style={{ background: "var(--surface)", ...frameStyle(theme) }}>
            <input className={field} style={fieldStyle} placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["HADIR", "Hadir"],
                  ["TIDAK HADIR", "Berhalangan"],
                ] as const
              ).map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setAttendance(v)}
                  aria-pressed={attendance === v}
                  className={`min-h-11 text-sm transition ${radius}`}
                  style={attendance === v ? { background: "var(--accent)", color: "var(--on-accent)" } : fieldStyle}
                >
                  {l}
                </button>
              ))}
            </div>
            <textarea className={`${field} min-h-28 resize-none`} style={fieldStyle} placeholder="Tulis ucapan dan doa (opsional)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
            <button
              type="submit"
              disabled={state === "sending"}
              className={`flex min-h-11 w-full items-center justify-center gap-2 text-sm font-medium disabled:opacity-60 ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"}`}
              style={{ background: "var(--accent)", color: "var(--on-accent)" }}
            >
              <IconSend size={16} /> {state === "sending" ? "Mengirim…" : "Kirim"}
            </button>
            {state === "error" && <p className="text-center text-sm text-red-600">Gagal mengirim, coba lagi.</p>}
          </form>
        )}
      </Reveal>

      {/* Wishes from other guests */}
      <Reveal className="mt-12 space-y-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Ucapan & Doa
          </h3>
          <span className="text-sm tabular-nums" style={{ color: "var(--muted)" }}>
            {wishes.length} ucapan
          </span>
        </div>
        {wishes.length ? (
          <ul className="max-h-[520px] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
            {wishes.map((w, i) => (
              <li key={`${w.createdAt}-${i}`} className={`space-y-2 px-5 py-4 ${cardShape(theme)}`} style={{ background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--ink) 10%, transparent)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{w.guestName}</p>
                  <p className="shrink-0 text-xs" style={{ color: "var(--muted)" }}>
                    {timeAgo(w.createdAt)}
                  </p>
                </div>
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {w.message}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Belum ada ucapan. Jadilah yang pertama mengirim doa untuk kedua mempelai.
          </p>
        )}
      </Reveal>
    </Section>
  );
}

// ─── Closing ─────────────────────────────────────────────────────────────

export function Closing({ theme, data }: { theme: AiTheme; data: WeddingData }) {
  const photo = data.gallery?.[1] || data.gallery?.[0];
  return (
    <section className="relative overflow-hidden px-6 pb-28 pt-24 text-center">
      {photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, var(--bg) 0%, transparent 40%, var(--bg) 100%)" }} />
        </>
      )}
      <Reveal className="relative mx-auto max-w-xl space-y-8">
        <Divider theme={theme} />
        <p className="leading-relaxed" style={{ color: "var(--muted)" }}>
          {theme.copy.closing}
        </p>
        <Label theme={theme} tone="muted">
          Kami yang berbahagia
        </Label>
        <Names theme={theme} className={isScript(theme.typography.names) ? "text-6xl" : "text-5xl uppercase"}>
          {data.groom.nickname} &amp; {data.bride.nickname}
        </Names>
        {data.extendedFamily?.members?.length ? (
          <div className="space-y-2 pt-4">
            <Label theme={theme}>{data.extendedFamily.title || "Turut Mengundang"}</Label>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {data.extendedFamily.members.join(" · ")}
            </p>
          </div>
        ) : null}
      </Reveal>
      <p className="relative mt-20 text-xs tracking-wide" style={{ color: "var(--muted)" }}>
        Dibuat dengan <Link href="/" className="underline underline-offset-4">UNDANGIN YUK</Link>
      </p>
    </section>
  );
}
