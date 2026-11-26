import type { ReactNode } from "react";
import Link from "next/link";
import { Display, Eyebrow, L } from "./primitives";

export const SUPPORT_EMAIL = "admin@satumoment.com";

const LEGAL_LINKS = [
  { href: "/garansi", label: "Garansi 7 hari" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/syarat-layanan", label: "Syarat Layanan" },
];

/** Reading layout for the policy pages: narrow column, Bodoni title, numbered sections. */
export function LegalPage({ eyebrow, title, updated, intro, children }: { eyebrow: string; title: string; updated: string; intro: ReactNode; children: ReactNode }) {
  return (
    <main className="px-4 pb-24 pt-28 md:px-6 md:pt-36">
      <article className="mx-auto max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Display as="h1" className="mt-3 text-[2.4rem] sm:text-5xl">
          {title}
        </Display>
        <p className="mt-3 text-sm" style={{ color: L.muted }}>
          Terakhir diperbarui {updated}
        </p>
        <div className="mt-8 text-[17px] leading-[1.75]" style={{ color: L.ink }}>
          {intro}
        </div>
        <div className="mt-12 space-y-10 text-[16px] leading-[1.75] [&_h2]:font-(family-name:--font-landing-display) [&_h2]:text-2xl [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5" style={{ color: L.ink }}>
          {children}
        </div>
        <div className="mt-16 border-t pt-8 text-sm" style={{ borderColor: L.line, color: L.muted }}>
          <p>
            Pertanyaan? Hubungi kami di{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium underline underline-offset-4" style={{ color: L.accent }}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <nav aria-label="Kebijakan" className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-10 items-center underline-offset-4 hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </article>
    </main>
  );
}
