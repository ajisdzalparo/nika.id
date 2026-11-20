import React from "react";

export function formatIndonesianDate(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortIndonesianDate(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function extractInitials(first?: string, second?: string): {
  a: string;
  b: string;
} {
  const clean = (val?: string) => (val?.trim().charAt(0) || "").toUpperCase();
  return {
    a: clean(first) || "A",
    b: clean(second) || "S",
  };
}

export function BotanicalDivider({
  tone = "gold",
  className = "",
}: {
  tone?: "gold" | "light";
  className?: string;
}) {
  const stroke = tone === "light" ? "#D8C49E" : "#B0915D";
  const line = tone === "light" ? "bg-[#D8C49E]/35" : "bg-[#D9CEBE]";

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className={`h-px w-12 sm:w-16 ${line}`} />
      <svg
        width="26"
        height="16"
        viewBox="0 0 26 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 1.5L16.2 8L13 14.5L9.8 8L13 1.5Z"
          stroke={stroke}
          strokeWidth="1.1"
        />
        <path
          d="M1.5 8C4.8 8 6.8 6.4 8.5 4.2M24.5 8C21.2 8 19.2 6.4 17.5 4.2M1.5 8C4.8 8 6.8 9.6 8.5 11.8M24.5 8C21.2 8 19.2 9.6 17.5 11.8"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      <span className={`h-px w-12 sm:w-16 ${line}`} />
    </div>
  );
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = "center",
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={`space-y-3 ${centered ? "text-center" : "text-left"}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#9A7B4F]">
        {kicker}
      </p>
      <h2 className="font-serif text-3xl font-normal tracking-tight text-[#1F1C18] sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`text-sm leading-relaxed text-[#6B6257] ${
            centered ? "mx-auto max-w-lg" : "max-w-lg"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
      {centered ? <BotanicalDivider className="pt-1" /> : null}
    </div>
  );
}
