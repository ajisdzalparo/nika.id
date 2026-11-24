"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AiDesignTemplate from "./index";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { WeddingData } from "@/types/wedding";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";

const BASE_WIDTH = 375;
const MIN_INNER_HEIGHT = 560;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The real cover of a theme, rendered by the engine and scaled to fill its container
 * edge-to-edge without empty sidebars or bottom voids.
 */
export function CoverThumb({
  theme,
  data,
  zoom = 0.5,
  className = "",
}: {
  theme: AiTheme;
  data?: WeddingData;
  /** Fallback scale before client measurement; after mount, scale fits the container width automatically. */
  zoom?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useIsoLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBox((prev) =>
          prev && Math.abs(prev.w - rect.width) < 0.5 && Math.abs(prev.h - rect.height) < 0.5
            ? prev
            : { w: rect.width, h: rect.height },
        );
      }
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box ? box.w / BASE_WIDTH : zoom;
  const innerHeight = box ? Math.max(MIN_INNER_HEIGHT, Math.ceil(box.h / scale)) : 667;
  const scaledHeight = innerHeight * scale;
  const offsetY = box && scaledHeight > box.h ? (box.h - scaledHeight) / 2 : 0;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none relative select-none overflow-hidden ${className}`}
      style={{ background: theme.palette.background }}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 will-change-transform"
        style={{
          top: offsetY,
          width: BASE_WIDTH,
          height: innerHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          ["--uy-cover-h" as string]: `${innerHeight}px`,
        }}
      >
        <AiDesignTemplate
          data={{ ...(data ?? MOCK_WEDDING_DATA), guestName: undefined }}
          theme={theme}
          embedded
          staticCover
        />
      </div>
    </div>
  );
}
