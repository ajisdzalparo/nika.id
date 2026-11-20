"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { L } from "./primitives";

const links = [
  { label: "Desain AI", href: "/#desain-ai" },
  { label: "Koleksi", href: "/desain" },
  { label: "Fitur", href: "/#fitur" },
  { label: "Harga", href: "/#harga" },
  { label: "FAQ", href: "/#faq" },
];

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={light ? "/logo-light.png" : "/logo.png"}
      alt="UNDANGIN YUK"
      className="h-8 w-auto object-contain sm:h-9"
    />
  );
}

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300"
      style={{ background: scrolled || open ? "rgba(247,243,236,.92)" : "transparent", borderBottom: `1px solid ${scrolled || open ? L.line : "transparent"}`, backdropFilter: scrolled ? "blur(10px)" : undefined }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="UNDANGIN YUK beranda">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm transition-colors hover:text-(--ink)" style={{ color: L.muted, ["--ink" as string]: L.ink }}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="flex h-10 items-center px-4 text-sm font-medium" style={{ color: L.ink }}>
            Masuk
          </Link>
          <Link href="/register" className="flex h-10 items-center rounded-full px-5 text-sm font-medium transition-opacity hover:opacity-90" style={{ background: L.ink, color: L.bg }}>
            Buat undangan
          </Link>
        </div>

        <button className="flex h-11 w-11 items-center justify-center md:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open}>
          {open ? <IconX size={24} color={L.ink} /> : <IconMenu2 size={24} color={L.ink} />}
        </button>
      </nav>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t px-4 pb-6 pt-2 duration-200 md:hidden" style={{ borderColor: L.line }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex h-12 items-center border-b text-[17px]" style={{ borderColor: L.line, color: L.ink }}>
              {l.label}
            </a>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/login" className="flex h-12 items-center justify-center rounded-full border text-sm font-medium" style={{ borderColor: L.line, color: L.ink }}>
              Masuk
            </Link>
            <Link href="/register" className="flex h-12 items-center justify-center rounded-full text-sm font-medium" style={{ background: L.ink, color: L.bg }}>
              Buat undangan
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
