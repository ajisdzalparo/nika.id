"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  INTEREST_ROLE_LABEL,
  INTEREST_ROLES,
  PRICE_BAND_LABEL,
  PRICE_BANDS,
  type InterestRole,
  type PriceBand,
} from "@/lib/marketplace-interest";

export interface MarketplaceInterestAnswer {
  role: InterestRole;
  priceBand: PriceBand | null;
  note: string | null;
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
        on ? "border-[#1F1A14] bg-[#1F1A14] text-[#F6EEDD]" : "border-[#E9DDC6] bg-white text-[#40372B] hover:border-[#8A6424]"
      }`}
    >
      {on && <IconCheck size={14} className="text-[#D9B56A]" />}
      {children}
    </button>
  );
}

/** "Template Kreator · Segera hadir" teaser with a short interest survey (marketplace feature not active yet). */
export function MarketplaceInterestCard({ initial }: { initial: MarketplaceInterestAnswer | null }) {
  const [saved, setSaved] = useState(initial);
  const [editing, setEditing] = useState(!initial);
  const [role, setRole] = useState<InterestRole | null>(initial?.role ?? null);
  const [priceBand, setPriceBand] = useState<PriceBand | null>(initial?.priceBand ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!role) return toast.error("Pilih salah satu jawaban dulu.");
    setBusy(true);
    try {
      const res = await fetch("/api/user/marketplace/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, priceBand, note }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.message || "Gagal menyimpan jawaban");
      setSaved(d.interest);
      setEditing(false);
      toast.success("Terima kasih! Jawabanmu membantu kami menyiapkan marketplace.");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#E6D5B2] bg-[#FFFDF9] p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">
            Template Kreator · Segera hadir
          </p>
          <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Desain dari kreator lain, atau jual desainmu sendiri</h2>
          <p className="text-sm leading-relaxed text-[#5E5446]">
            Semua template di atas sudah termasuk paketmu. Nanti akan ada tab terpisah berisi template buatan kreator, dengan harga
            tertera di setiap kartu (sekali beli untuk 1 undangan). Bantu kami menyiapkannya.
          </p>
        </div>

        {editing ? (
          <div className="w-full space-y-4 lg:max-w-xl">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1F1A14]">Apakah kamu tertarik?</p>
              <div role="radiogroup" aria-label="Minat marketplace" className="flex flex-wrap gap-2">
                {INTEREST_ROLES.map((r) => (
                  <Choice key={r} on={role === r} onClick={() => setRole(r)}>
                    {INTEREST_ROLE_LABEL[r]}
                  </Choice>
                ))}
              </div>
            </div>
            {role && role !== "TIDAK" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#1F1A14]">
                  {role === "JUAL" ? "Harga wajar untuk desainmu (per template)?" : "Harga wajar untuk 1 template kreator?"}
                </p>
                <div role="radiogroup" aria-label="Kisaran harga" className="flex flex-wrap gap-2">
                  {PRICE_BANDS.map((b) => (
                    <Choice key={b} on={priceBand === b} onClick={() => setPriceBand(b)}>
                      {PRICE_BAND_LABEL[b]}
                    </Choice>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Gaya desain yang kamu cari atau ingin kamu jual (opsional)"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="gold" onClick={() => void submit()} disabled={busy || !role}>
                {busy && <IconLoader2 size={15} className="animate-spin" />}
                Kirim jawaban
              </Button>
              {saved && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
                  Batal
                </Button>
              )}
            </div>
          </div>
        ) : (
          saved && (
            <div className="w-full space-y-3 rounded-xl border border-[#EDE3CF] bg-white p-4 lg:max-w-sm">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F1A14]">
                <IconCheck size={16} className="text-[#8A6424]" /> Jawabanmu sudah tercatat
              </p>
              <p className="text-sm text-[#5E5446]">
                {INTEREST_ROLE_LABEL[saved.role]}
                {saved.priceBand ? ` · ${PRICE_BAND_LABEL[saved.priceBand]}` : ""}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                Ubah jawaban
              </Button>
            </div>
          )
        )}
      </div>
    </section>
  );
}
