"use client";

import { useMemo } from "react";
import { compileSafeWeddingHtml } from "@/lib/ai-design/html-sanitize";
import type { WeddingData } from "@/types/wedding";

/**
 * Renders user/admin uploaded HTML inside a zero-privilege sandboxed iframe.
 * Combined with strict server+client HTML sanitization, scripts, forms, top navigation,
 * and parent DOM/cookie access are completely blocked at the browser engine level.
 */
export function SandboxedHtmlFrame({
  html,
  data,
  title = "Pratinjau Template HTML",
  className = "h-screen min-h-[700px] w-full border-0 bg-white",
}: {
  html: string;
  data: WeddingData;
  title?: string;
  className?: string;
}) {
  const srcDoc = useMemo(() => compileSafeWeddingHtml(html, data), [html, data]);

  return (
    <iframe
      title={title}
      srcDoc={srcDoc}
      sandbox=""
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}
