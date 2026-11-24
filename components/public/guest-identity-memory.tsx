"use client";

import { useEffect } from "react";

export interface StoredGuestIdentity {
  name: string;
  recipientType: "PERSONAL" | "GROUP";
  maxGuests?: number;
  phone?: string;
}

const PREFIX = "uy_guest_identity:";

export function saveGuestIdentity(slug: string, identity: StoredGuestIdentity) {
  if (typeof window === "undefined" || !slug || !identity.name.trim()) return;
  try {
    window.localStorage.setItem(`${PREFIX}${slug}`, JSON.stringify(identity));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
}

export function loadGuestIdentity(slug: string): StoredGuestIdentity | null {
  if (typeof window === "undefined" || !slug) return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredGuestIdentity>;
    if (typeof parsed?.name !== "string" || !parsed.name.trim()) return null;
    return {
      name: parsed.name.trim(),
      recipientType: parsed.recipientType === "GROUP" ? "GROUP" : "PERSONAL",
      maxGuests: typeof parsed.maxGuests === "number" && parsed.maxGuests > 0 ? parsed.maxGuests : undefined,
      phone: typeof parsed.phone === "string" && parsed.phone.trim() ? parsed.phone.trim() : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Silent client helper mounted on `/[slug]` so when a guest opens their personal link
 * (`/<slug>?to=Nama`), their phone remembers them when they later scan the printed venue QR,
 * AND records a genuine browser open on the Guest row (immune to WhatsApp link-preview bots).
 */
export function GuestIdentityMemory({
  slug,
  guest,
  trackGuestId,
  isOwnerPreview = false,
}: {
  slug: string;
  guest: StoredGuestIdentity | null;
  trackGuestId?: string | null;
  isOwnerPreview?: boolean;
}) {
  useEffect(() => {
    if (guest) saveGuestIdentity(slug, guest);
  }, [slug, guest]);

  useEffect(() => {
    if (!trackGuestId || isOwnerPreview || typeof window === "undefined") return;
    const sessionKey = `uy_guest_opened:${trackGuestId}`;
    try {
      if (window.sessionStorage.getItem(sessionKey)) return;
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Proceed even if sessionStorage is unavailable
    }
    void fetch("/api/public/guest-open", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, guestId: trackGuestId }),
      keepalive: true,
    }).catch(() => {});
  }, [slug, trackGuestId, isOwnerPreview]);

  return null;
}
