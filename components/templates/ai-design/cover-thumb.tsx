"use client";

import AiDesignTemplate from "./index";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { WeddingData } from "@/types/wedding";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";

/**
 * The real cover of a theme, rendered by the engine and scaled down — a live
 * "screenshot" for cards. Width follows the parent; `zoom` sets the scale.
 */
export function CoverThumb({ theme, data, zoom = 0.4, className = "" }: { theme: AiTheme; data?: WeddingData; zoom?: number; className?: string }) {
  return (
    <div className={`pointer-events-none relative select-none overflow-hidden ${className}`} style={{ background: theme.palette.background }} aria-hidden="true">
      <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ zoom, width: 375 }}>
        <AiDesignTemplate data={{ ...(data ?? MOCK_WEDDING_DATA), guestName: undefined }} theme={theme} embedded staticCover />
      </div>
    </div>
  );
}
