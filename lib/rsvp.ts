// Client helper for invitation forms. /api/public/submit takes one record per
// request with an explicit `type`, so attendance and the wish are sent separately.

export type Attendance = "HADIR" | "MUNGKIN" | "TIDAK HADIR";

export interface Wish {
  guestName: string;
  message: string;
  createdAt: string;
}

export function invitationSlugFromPath() {
  return typeof window === "undefined" ? "" : window.location.pathname.split("/").filter(Boolean)[0] ?? "";
}

export async function submitRsvp({
  slug,
  name,
  attendance,
  message,
  phone,
  guests,
  companions,
  customAnswer,
}: {
  slug: string;
  name: string;
  attendance: Attendance;
  message: string;
  phone?: string;
  guests?: number;
  companions?: string;
  customAnswer?: string;
}) {
  const post = (body: Record<string, unknown>) =>
    fetch("/api/public/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, guestName: name, ...body }) });

  const rsvp = await post({ type: "RSVP", attendance, phone, guests, companions, customAnswer });
  if (!rsvp.ok) throw new Error("RSVP_FAILED");
  const saved = (await rsvp.json().catch(() => ({}))) as { checkInToken?: string | null };
  if (message.trim()) {
    const msg = await post({ type: "MESSAGE", message });
    if (!msg.ok) throw new Error("MESSAGE_FAILED");
  }
  return { checkInToken: saved.checkInToken ?? null };
}
