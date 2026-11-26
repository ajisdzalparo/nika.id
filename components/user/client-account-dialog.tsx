"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconCopy, IconLoader2, IconTrash, IconUserCircle } from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { waLink } from "@/lib/phone";

interface Member {
  userId: string;
  name: string | null;
  email: string;
}

/** Login details for a new client account, shown once, with copy and WhatsApp send. */
export function ClientLoginCard({
  created,
  clientName,
  invitationTitle,
  clientWhatsapp,
  appUrl,
}: {
  created: { email: string; tempPassword: string | null };
  clientName: string;
  invitationTitle: string;
  clientWhatsapp: string | null;
  appUrl: string;
}) {
  const loginText = [
    `Halo${clientName ? ` ${clientName}` : ""}, akun untuk undangan "${invitationTitle}" sudah siap.`,
    `Masuk di ${appUrl}/login`,
    `Email: ${created.email}`,
    created.tempPassword ? `Password sementara: ${created.tempPassword} (ganti di menu Pengaturan setelah masuk)` : "Pakai password akunmu yang sudah ada.",
    "Di sana kamu bisa memilih template, mengedit isi undangan, serta mengelola tamu, RSVP, ucapan, dan check-in.",
  ].join("\n");
  const wa = waLink(clientWhatsapp, loginText);
  return (
    <div className="space-y-3 rounded-xl border border-[#E6D5B2] bg-[#FCF8F1] p-4 text-sm">
      <p className="font-medium text-[#1F1A14]">Akun klien siap</p>
      <pre className="whitespace-pre-wrap font-sans text-[13px] text-[#40372B]">{loginText}</pre>
      {created.tempPassword && <p className="text-xs text-[#8A6424]">Password sementara hanya ditampilkan sekali ini. Kirim sekarang ke klien.</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(loginText);
            toast.success("Info login disalin");
          }}
        >
          <IconCopy /> Salin
        </Button>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "gold", size: "sm", className: "h-8 px-3.5 text-xs" })}
          >
            <IconBrandWhatsapp size={15} /> Kirim via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Mitra gives a client their own login for one invitation, so the client sees their guests, RSVP,
 * wishes and check-in while the mitra keeps full access.
 */
export function ClientAccountDialog({
  invitationId,
  invitationTitle,
  clientName,
  clientWhatsapp,
  appUrl,
  compact = false,
}: {
  invitationId: string;
  invitationTitle: string;
  clientName: string | null;
  clientWhatsapp: string | null;
  appUrl: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [name, setName] = useState(clientName ?? "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; tempPassword: string | null } | null>(null);

  const load = async () => {
    const res = await fetch(`/api/user/invitations/${invitationId}/client-account`);
    const d = await res.json().catch(() => ({}));
    if (res.ok) setMembers(d.members);
    else toast.error(d.message || "Gagal memuat akun klien");
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/user/invitations/${invitationId}/client-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.message || "Gagal membuat akun klien");
      setCreated({ email: d.email, tempPassword: d.tempPassword });
      setEmail("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Member) => {
    const res = await fetch(`/api/user/invitations/${invitationId}/client-account?userId=${encodeURIComponent(m.userId)}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal mencabut akses");
    setMembers((list) => list?.filter((x) => x.userId !== m.userId) ?? null);
    toast.success(`Akses ${m.email} dicabut`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) void load();
        else setCreated(null);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            compact
              ? "inline-flex h-8 items-center justify-center gap-1 rounded-full border border-[#E9DDC6] bg-white px-2.5 text-xs font-medium text-[#1F1A14] transition hover:border-[#8A6424] hover:bg-[#FCF8F1]"
              : "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E9DDC6] bg-white px-3.5 text-xs font-medium text-[#1A1510] transition hover:border-[#8A6424] hover:bg-[#FCF8F1]"
          }
        >
          <IconUserCircle size={compact ? 14 : 15} /> {compact ? "Akun" : "Akun Klien"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Akun klien</DialogTitle>
          <DialogDescription>
            Klien masuk dengan akunnya sendiri untuk memilih template, mengedit undangan, serta mengelola tamu, RSVP, ucapan, dan check-in &ldquo;{invitationTitle}&rdquo;. Anda tetap bisa
            melihat dan mengelola semuanya dari akun Mitra.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <ClientLoginCard created={created} clientName={name} invitationTitle={invitationTitle} clientWhatsapp={clientWhatsapp} appUrl={appUrl} />
        ) : (
          <form onSubmit={add} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`ca-name-${invitationId}`}>Nama klien</Label>
                <Input id={`ca-name-${invitationId}`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} placeholder="Contoh: Dinda Putri" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`ca-email-${invitationId}`}>Email klien</Label>
                <Input
                  id={`ca-email-${invitationId}`}
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={120}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                  title="Masukkan alamat email yang valid, contoh: dinda@email.com"
                  placeholder="dinda@email.com"
                  className="h-10"
                />
              </div>
            </div>
            <Button type="submit" variant="ink" disabled={busy} className="w-full">
              {busy && <IconLoader2 className="animate-spin" />}
              Buat akun klien
            </Button>
          </form>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8A6424]">Punya akses</p>
          {members === null ? (
            <p className="text-sm text-[#6B5F50]">Memuat…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-[#6B5F50]">Belum ada akun klien untuk undangan ini.</p>
          ) : (
            <ul className="divide-y divide-[#F3EBDB] rounded-xl border border-[#EDE3CF]">
              {members.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[#1F1A14]">{m.name || m.email}</span>
                    <span className="block truncate text-xs text-[#6B5F50]">{m.email}</span>
                  </span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Cabut akses ${m.email}`} onClick={() => void remove(m)}>
                    <IconTrash className="text-[#9A3B2B]" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
