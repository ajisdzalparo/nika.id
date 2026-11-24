// Phone / WhatsApp numbers are stored as international digits without "+" (e.g. "6281234567890"),
// which is exactly what https://wa.me/<digits> expects. Client-safe: no server imports.

export const PHONE_COUNTRIES = [
  { code: "62", label: "Indonesia", short: "ID" },
  { code: "60", label: "Malaysia", short: "MY" },
  { code: "65", label: "Singapura", short: "SG" },
  { code: "61", label: "Australia", short: "AU" },
  { code: "81", label: "Jepang", short: "JP" },
  { code: "44", label: "Inggris", short: "UK" },
  { code: "1", label: "AS / Kanada", short: "US" },
] as const;

export const DEFAULT_PHONE_COUNTRY = "62";

/** Splits a stored number into country code + local part. Local Indonesian input ("0812…") maps to +62. */
export function splitPhone(full: string | null | undefined): { country: string; local: string } {
  const digits = (full ?? "").replace(/\D/g, "");
  if (!digits) return { country: DEFAULT_PHONE_COUNTRY, local: "" };
  if (digits.startsWith("0")) return { country: DEFAULT_PHONE_COUNTRY, local: digits.replace(/^0+/, "") };
  const matched = PHONE_COUNTRIES.find((c) => digits.startsWith(c.code));
  if (matched) return { country: matched.code, local: digits.slice(matched.code.length).replace(/^0+/, "") };
  return { country: DEFAULT_PHONE_COUNTRY, local: digits };
}

/** Cleans what the user typed into the local part: digits only, no leading 0, and a pasted country code is dropped. */
export function normalizeLocalPhone(raw: string, countryCode: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith(countryCode) && digits.length > countryCode.length + 6) {
    digits = digits.slice(countryCode.length);
  }
  return digits.replace(/^0+/, "");
}

export function joinPhone(countryCode: string, local: string): string {
  return local ? `${countryCode}${local}` : "";
}

/** Server-side normalisation of any phone input to stored digits ("0812…" / "+62 812…" → "62812…"). */
export function normalizePhoneDigits(raw: string | null | undefined): string {
  const { country, local } = splitPhone(raw);
  return joinPhone(country, local);
}

/** Minimal sanity check for a stored number (country code + 7–13 digits). */
export function isValidPhoneDigits(digits: string): boolean {
  const { local } = splitPhone(digits);
  return local.length >= 7 && local.length <= 13;
}

export function waLink(digits: string | null | undefined, text?: string): string | null {
  const d = normalizePhoneDigits(digits);
  if (!d) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
