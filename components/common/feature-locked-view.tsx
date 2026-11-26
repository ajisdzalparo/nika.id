"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconArrowLeft } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import type { FeatureStatus } from "@/lib/features";

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, summary, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [contenteditable="true"]';

/**
 * Keeps the real feature page visible and scrollable while its status is COMING_SOON or MAINTENANCE,
 * adds a slim status notice right beneath SiteHeader, and blocks interactive actions inside the page body.
 */
export function FeatureLockedView({
  label,
  status,
  children,
}: {
  label: string;
  status: Exclude<FeatureStatus, "ACTIVE">;
  children: ReactNode;
}) {
  const lastToastAt = useRef(0);
  const maintenance = status === "MAINTENANCE";

  const notifyBlocked = () => {
    const now = Date.now();
    if (now - lastToastAt.current < 1400) return;
    lastToastAt.current = now;
    toast.info(
      maintenance
        ? `${label} sedang dalam perbaikan. Aksi sementara dinonaktifkan.`
        : `${label} segera hadir. Kamu sedang melihat pratinjau tampilannya.`,
    );
  };

  const isInsideAllowedChrome = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('[data-site-header="true"], [data-feature-banner="true"], [data-feature-allow="true"]'));
  };

  const blockIfInteractive = (e: React.SyntheticEvent) => {
    if (isInsideAllowedChrome(e.target)) return;
    const el = e.target instanceof Element ? e.target.closest(INTERACTIVE_SELECTOR) : null;
    if (!el && e.type !== "submit") return;
    e.preventDefault();
    e.stopPropagation();
    notifyBlocked();
  };

  const blockKeyDown = (e: React.KeyboardEvent) => {
    if (isInsideAllowedChrome(e.target)) return;
    // Allow page scrolling keys (arrows, PageUp/Down, Home/End, Tab)
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Tab", "Escape"].includes(e.key)) return;
    const el = e.target instanceof Element ? e.target.closest(INTERACTIVE_SELECTOR) : null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    notifyBlocked();
  };

  return (
    <div
      data-feature-locked={status}
      onPointerDownCapture={blockIfInteractive}
      onMouseDownCapture={blockIfInteractive}
      onClickCapture={blockIfInteractive}
      onSubmitCapture={blockIfInteractive}
      onChangeCapture={blockIfInteractive}
      onKeyDownCapture={blockKeyDown}
      className="flex flex-1 flex-col [&>*:not([data-site-header]):not([data-feature-banner])]:order-3 [&>*:not([data-site-header]):not([data-feature-banner])_a]:cursor-not-allowed [&>*:not([data-site-header]):not([data-feature-banner])_button]:cursor-not-allowed [&>*:not([data-site-header]):not([data-feature-banner])_input]:cursor-not-allowed [&>*:not([data-site-header]):not([data-feature-banner])_textarea]:cursor-not-allowed [&_[data-feature-allow='true']]:!cursor-pointer [&_[data-feature-allow='true']_a]:!cursor-pointer [&_[data-feature-allow='true']_button]:!cursor-pointer [&>[data-site-header]]:order-1"
    >
      <div
        data-feature-banner="true"
        role="status"
        className="order-2 border-b border-[#E6D5B2] bg-[#F7F0E1]/95 px-4 py-3 lg:px-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1F1A14] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F6EEDD]">
                {maintenance ? "Sedang perbaikan" : "Segera hadir"}
              </span>
              <span className="font-medium text-[#1F1A14]">{label}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#5E5446]">
              {maintenance
                ? "Fitur ini sedang diperbaiki. Kamu tetap bisa melihat tampilannya, namun tombol & aksi sementara dinonaktifkan."
                : "Kamu sudah bisa melihat pratinjau tampilannya — seluruh tombol & aksi sementara dinonaktifkan hingga fitur resmi dirilis."}
            </p>
          </div>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-9 shrink-0 rounded-full border-[#DFC99B] bg-[#FFFDF9] px-4 text-xs text-[#1F1A14] hover:border-[#8A6424] hover:bg-white",
            })}
          >
            <IconArrowLeft size={14} /> Kembali ke beranda
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
