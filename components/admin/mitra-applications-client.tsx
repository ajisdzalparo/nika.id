"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconBrandInstagram, IconBrandWhatsapp, IconCheck, IconLoader2, IconMail, IconMapPin, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/common/studio-ui";
import { NumberInput } from "@/components/common/number-input";
import { waLink } from "@/lib/phone";
import {
  APPLICANT_TYPE_LABEL,
  APPLICATION_STATUS_LABEL,
  BUSINESS_KIND_LABEL,
  type ApplicantType,
  type ApplicationStatus,
  type BusinessKind,
} from "@/lib/mitra-application";

export interface AdminMitraApplication {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  applicantType: string;
  businessName: string | null;
  businessKind: string | null;
  instagram: string | null;
  city: string | null;
  note: string | null;
  status: string;
  adminNote: string | null;
  hasAccount: boolean;
  createdAt: string;
}

const FILTERS: { id: ApplicationStatus | "ALL"; label: string }[] = [
  { id: "PENDING", label: "Menunggu" },
  { id: "APPROVED", label: "Disetujui" },
  { id: "REJECTED", label: "Ditolak" },
  { id: "ALL", label: "Semua" },
];

const STATUS_CHIP: Record<string, string> = {
  PENDING: "bg-[#F6EEDF] text-[#8A6424]",
  APPROVED: "bg-[#E7F1EA] text-[#2F6B45]",
  REJECTED: "bg-[#F4E6E2] text-[#9A3B2B]",
};

const dateFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Admin review of mitra join requests: approve turns the account into a mitra, reject notifies the applicant. */
export function MitraApplicationsClient({ initial }: { initial: AdminMitraApplication[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("PENDING");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  // Free trial given with the approval: invitations covered by a 100% promo code, and how long it lasts
  const [trialInvites, setTrialInvites] = useState("3");
  const [trialDays, setTrialDays] = useState("30");
  const shown = useMemo(() => (filter === "ALL" ? items : items.filter((i) => i.status === filter)), [items, filter]);

  const review = async (item: AdminMitraApplication, action: "APPROVE" | "REJECT") => {
    setBusy(item.id);
    try {
      const res = await fetch(`/api/admin/mitra-applications/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote: notes[item.id] || undefined,
          trialInvites: Number(trialInvites) || 0,
          trialDays: Number(trialDays) || 30,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.message || "Gagal meninjau pengajuan");
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: d.application.status, adminNote: notes[item.id] || null } : i)));
      toast.success(
        action === "APPROVE"
          ? `${item.businessName || item.name} sekarang Mitra${d.trialCode ? ` · kode uji coba ${d.trialCode} dikirim ke notifikasinya` : ""}`
          : "Pengajuan ditolak",
      );
      router.refresh();
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Filter status" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.id === "ALL" ? items.length : items.filter((i) => i.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
                filter === f.id ? "border-[#1F1A14] bg-[#1F1A14] text-[#F6EEDD]" : "border-[#E9DDC6] bg-white text-[#40372B] hover:border-[#8A6424]"
              }`}
            >
              {f.label} <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Panel className="p-8 text-center text-sm text-[#6B5F50]">Belum ada pengajuan di sini.</Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {shown.map((a) => {
            const wa = waLink(a.whatsapp, `Halo ${a.name}, terima kasih sudah mengajukan diri jadi Mitra SatuMoment.`);
            return (
              <Panel key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-[#1F1A14]">{a.businessName || a.name}</p>
                    <p className="mt-0.5 text-[13px] text-[#6B5F50]">
                      {APPLICANT_TYPE_LABEL[a.applicantType as ApplicantType] ?? a.applicantType}
                      {a.businessKind ? ` · ${BUSINESS_KIND_LABEL[a.businessKind as BusinessKind] ?? a.businessKind}` : ""}
                      {a.businessName ? ` · ${a.name}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${STATUS_CHIP[a.status] ?? ""}`}>
                    {APPLICATION_STATUS_LABEL[a.status as ApplicationStatus] ?? a.status}
                  </span>
                </div>

                <ul className="mt-4 grid gap-2 text-sm text-[#40372B] sm:grid-cols-2">
                  <li className="flex min-w-0 items-center gap-2">
                    <IconMail size={15} className="shrink-0 text-[#8A6424]" />
                    <span className="truncate">{a.email}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconBrandWhatsapp size={15} className="shrink-0 text-[#8A6424]" />
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" className="text-[#8A6424] hover:underline">
                        +{a.whatsapp}
                      </a>
                    ) : (
                      a.whatsapp
                    )}
                  </li>
                  {a.instagram && (
                    <li className="flex min-w-0 items-center gap-2">
                      <IconBrandInstagram size={15} className="shrink-0 text-[#8A6424]" />
                      <a href={`https://instagram.com/${a.instagram}`} target="_blank" rel="noreferrer" className="truncate hover:underline">
                        @{a.instagram}
                      </a>
                    </li>
                  )}
                  {a.city && (
                    <li className="flex items-center gap-2">
                      <IconMapPin size={15} className="shrink-0 text-[#8A6424]" />
                      {a.city}
                    </li>
                  )}
                </ul>
                {a.note && <p className="mt-3 rounded-xl bg-[#FCF8F1] p-3 text-sm text-[#40372B]">{a.note}</p>}
                <p className="mt-3 text-xs text-[#8E8268]">
                  Diajukan {dateFmt.format(new Date(a.createdAt))} ·{" "}
                  {a.hasAccount ? "sudah punya akun" : <span className="font-medium text-[#9A3B2B]">belum punya akun (minta daftar dengan email ini dulu)</span>}
                </p>

                {a.status === "PENDING" ? (
                  <div className="mt-4 space-y-3 border-t border-[#F3EBDB] pt-4">
                    <Textarea
                      value={notes[a.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                      maxLength={500}
                      rows={2}
                      placeholder="Catatan admin (opsional, dikirim ke pendaftar bila ditolak)"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#40372B]">
                      <span>Uji coba gratis</span>
                      <NumberInput value={trialInvites} onValueChange={setTrialInvites} max={10} suffix="undangan" className="h-9 w-36" aria-label="Jumlah undangan uji coba" />
                      <span>selama</span>
                      <NumberInput value={trialDays} onValueChange={setTrialDays} max={90} suffix="hari" className="h-9 w-28" aria-label="Lama uji coba" />
                      <span className="text-xs text-[#8E8268]">(0 undangan = tanpa uji coba)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="ink" disabled={busy === a.id || !a.hasAccount} onClick={() => void review(a, "APPROVE")}>
                        {busy === a.id ? <IconLoader2 className="animate-spin" /> : <IconCheck />}
                        Setujui jadi Mitra
                      </Button>
                      <Button type="button" variant="outline" disabled={busy === a.id} onClick={() => void review(a, "REJECT")}>
                        <IconX /> Tolak
                      </Button>
                    </div>
                  </div>
                ) : (
                  a.adminNote && <p className="mt-3 text-xs text-[#6B5F50]">Catatan admin: {a.adminNote}</p>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
