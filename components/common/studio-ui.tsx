import type { ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight, type Icon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Dashboard building blocks in the landing page's design system: champagne paper, espresso ink,
 * gold accent, Bodoni headings, the quatrefoil lattice and quiet entrance motion.
 * Use these on user, Mitra and admin pages instead of hand-styled boxes.
 */

/** Page title block: small tracked eyebrow, Bodoni heading, optional description and actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 md:flex-row md:items-end", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#8A6424]">{eyebrow}</p>}
        <h1 className="font-(family-name:--font-landing-display) text-[2.1rem] leading-[1.08] tracking-[-0.01em] text-[#1F1A14] md:text-[2.6rem]">{title}</h1>
        {description && <p className="max-w-2xl text-[15px] leading-relaxed text-[#6B5F50]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

type PanelTone = "paper" | "night" | "champagne";

const PANEL_TONE: Record<PanelTone, string> = {
  paper: "border border-[#EDE3CF] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)]",
  champagne: "border border-[#E9DDC6] bg-[#F6EEDF]",
  night: "bg-[#1A1510] text-[#F6EEDD] shadow-[0_24px_50px_-30px_rgba(26,21,16,.7)]",
};

/**
 * A rounded surface. "night" is the espresso card with the gold lattice (hero and plan cards),
 * "paper" the default white card, "champagne" a soft highlighted block.
 */
export function Panel({
  tone = "paper",
  lattice = tone === "night",
  delay = 0,
  className,
  children,
}: {
  tone?: PanelTone;
  lattice?: boolean;
  /** Entrance stagger in ms */
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("relative overflow-hidden rounded-2xl animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-fill-mode:backwards]", PANEL_TONE[tone], className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {lattice && <div aria-hidden className={cn("pointer-events-none absolute inset-0", tone === "night" ? "uy-lattice-light" : "uy-lattice opacity-60")} />}
      <div className="relative">{children}</div>
    </section>
  );
}

/** Heading row inside a panel, with an optional "see all" link. */
export function PanelTitle({ children, href, linkLabel = "Semua", light = false }: { children: ReactNode; href?: string; linkLabel?: string; light?: boolean }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className={cn("font-(family-name:--font-landing-display) text-2xl", light ? "text-[#F6EEDD]" : "text-[#1F1A14]")}>{children}</h2>
      {href && (
        <Link href={href} className={cn("group flex min-h-10 items-center gap-1 text-sm font-medium", light ? "text-[#D9B56A]" : "text-[#8A6424]")}>
          {linkLabel} <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** A metric with an icon chip; becomes a link with a gentle lift when `href` is given. */
export function StatTile({
  label,
  value,
  icon: StatIcon,
  href,
  hint,
  delay = 0,
  dense = false,
}: {
  label: string;
  value: ReactNode;
  icon?: Icon;
  href?: string;
  hint?: string;
  delay?: number;
  /** Compact below `sm` (three tiles fit one phone row): smaller number, no icon or hint. */
  dense?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-[13px] text-[#6B5F50]", dense && "text-[11px] leading-tight sm:text-[13px]")}>{label}</p>
        {StatIcon && (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F6EEDF] text-[#8A6424] transition-transform duration-500 group-hover:rotate-6", dense && "hidden sm:flex")}>
            <StatIcon size={18} stroke={1.6} />
          </span>
        )}
      </div>
      <p className={cn("mt-3 font-(family-name:--font-landing-display) text-4xl tabular-nums lining-nums text-[#1F1A14]", dense && "mt-1.5 text-3xl sm:mt-3 sm:text-4xl")}>{value}</p>
      {hint && <p className={cn("mt-1 text-xs text-[#8E8268]", dense && "hidden sm:block")}>{hint}</p>}
    </>
  );
  const cls = cn(
    "group block rounded-2xl border border-[#EDE3CF] bg-white p-5 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-fill-mode:backwards] shadow-[0_1px_2px_rgba(26,21,16,.04)]",
    dense && "p-3 sm:p-5",
  );
  const style = delay ? { animationDelay: `${delay}ms` } : undefined;
  return href ? (
    <Link href={href} className={cn(cls, "transition-all hover:-translate-y-0.5 hover:border-[#D9B56A] hover:shadow-[0_16px_30px_-22px_rgba(26,21,16,.35)]")} style={style}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}
