"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const ROUTE_LABELS: Record<string, string> = {
  "/upgrade": "Buka Paket & Pembayaran",
  "/pilih-template": "Lihat Koleksi Template",
  "/editor": "Buka Editor",
  "/desain-ai": "Buka Desain AI",
  "/desain": "Lihat Template",
  "/register": "Daftar Gratis",
  "/pengaturan": "Buka Pengaturan",
  "/manajemen-tamu": "Buka Daftar Tamu",
  "/buku-tamu": "Buka RSVP & Ucapan",
  "/undangan": "Lihat Daftar Undangan",
  "/dashboard": "Buka Beranda",
};

const TOKEN_RE =
  /(\*\*[^*]+\*\*|`[^`]+`|\(\/(?:upgrade|pilih-template|editor|desain-ai|desain|register|pengaturan|manajemen-tamu|buku-tamu|undangan|dashboard)\)|\/(?:upgrade|pilih-template|editor|desain-ai|desain|register|pengaturan|manajemen-tamu|buku-tamu|undangan|dashboard)(?![a-z0-9-/]))/g;

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s)]*)?)\)$/i;

function renderInline(line: string, isUserBubble: boolean): ReactNode[] {
  const parts = line.split(TOKEN_RE);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className={`font-semibold ${isUserBubble ? "text-white" : "text-[#1A1510]"}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
            isUserBubble ? "bg-white/15 text-[#F5E8CA]" : "bg-[#F3EBDB] text-[#40372B]"
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const normalizedPath = part.startsWith("(/") && part.endsWith(")") ? part.slice(1, -1) : part;
    if (normalizedPath in ROUTE_LABELS) {
      return (
        <Link
          key={idx}
          href={normalizedPath}
          className={`mx-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium underline underline-offset-2 transition ${
            isUserBubble
              ? "bg-white/15 text-[#F5E8CA] hover:bg-white/25"
              : "bg-[#F5E8CA]/70 text-[#78571E] hover:bg-[#EFE2C2]"
          }`}
        >
          {ROUTE_LABELS[normalizedPath]}
        </Link>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function formatChatPreview(content: string): string {
  const cleaned = content
    .replace(/!\[[^\]]*\]\([^)]+\)\n?/g, "📷 Gambar ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
  return cleaned || "Lampiran gambar";
}

export function ChatMessageText({ content, isUserBubble = false }: { content: string; isUserBubble?: boolean }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) {
          return <div key={i} className="h-1" />;
        }

        const imgMatch = line.trim().match(IMAGE_LINE_RE);
        if (imgMatch) {
          const [, alt, url] = imgMatch;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-black/10 bg-black/5 transition hover:opacity-95"
              title="Klik untuk memperbesar gambar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={alt || "Lampiran gambar"} className="max-h-56 w-auto max-w-full rounded-xl object-contain" />
            </a>
          );
        }

        const bulletMatch = line.match(/^\s*(?:•|-|\*)\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-0.5">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                  isUserBubble ? "bg-[#D9B56A]" : "bg-[#8A6424]"
                }`}
              />
              <div className="min-w-0 flex-1">{renderInline(bulletMatch[1], isUserBubble)}</div>
            </div>
          );
        }
        return <p key={i}>{renderInline(line, isUserBubble)}</p>;
      })}
    </div>
  );
}
