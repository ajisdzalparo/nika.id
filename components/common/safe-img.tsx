"use client";

import { useState } from "react";

/**
 * <img> that falls back to a quiet placeholder with the template name when the
 * file is missing or the URL is broken (e.g. an external thumbnail that was removed).
 */
export function SafeImg({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return (
      <div className={`flex items-center justify-center bg-[#EFE8DC] p-4 text-center ${className}`} role="img" aria-label={alt}>
        <span className="font-(family-name:--font-landing-display) text-2xl leading-tight text-[#8A6A2F]">{alt}</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={`object-cover ${className}`} />;
}
