import { randomBytes } from "node:crypto";

/**
 * Guest check-in codes. Each RSVP can carry a random token; its QR encodes `UY-CHECKIN:<token>` so the
 * scanner can tell our codes apart from any other QR, and a token alone reveals nothing about the guest.
 */
export const CHECKIN_PREFIX = "UY-CHECKIN:";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I, easy to read aloud

export function newCheckInToken(length = 12) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function checkInPayload(token: string) {
  return `${CHECKIN_PREFIX}${token}`;
}

/** Accepts the full QR text or a code typed by hand. */
export function parseCheckInCode(raw: string): string | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  const token = v.startsWith(CHECKIN_PREFIX) ? v.slice(CHECKIN_PREFIX.length) : v;
  return /^[A-Z0-9]{8,24}$/.test(token) ? token : null;
}
