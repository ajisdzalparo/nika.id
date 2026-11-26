"use client";

import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { describePromo, PROMO_KIND_LABELS } from "@/lib/promo-shared";
import { DatePickerField } from "@/components/common/date-time-picker";
import { SelectField } from "@/components/ui/select";
import { NumberInput } from "@/components/common/number-input";

export interface AdminPromo {
  id: string;
  code: string;
  description: string | null;
  percentOff: number | null;
  amountOff: number | null;
  maxDiscount: number | null;
  appliesTo: string;
  minPurchase: number;
  maxUses: number | null;
  perUserLimit: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

const KIND_OPTIONS = Object.entries(PROMO_KIND_LABELS) as [keyof typeof PROMO_KIND_LABELS, string][];
const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const fieldCls =
  "h-10 w-full rounded-xl border border-[#DDD5C7] bg-white px-3 text-sm text-[#1F1A14] outline-none placeholder:text-[#A59B8C] focus:border-[#8A6424]";

function numOrNull(v: string) {
  const n = Number(v.replace(/\D/g, ""));
  return v.trim() && n > 0 ? n : null;
}

function CreatePromoForm({ onCreated }: { onCreated: (p: AdminPromo) => void }) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [value, setValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [kinds, setKinds] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState("");
  const [perUser, setPerUser] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description: description || null,
          percentOff: mode === "PERCENT" ? numOrNull(value) : null,
          amountOff: mode === "AMOUNT" ? numOrNull(value) : null,
          maxDiscount: mode === "PERCENT" ? numOrNull(maxDiscount) : null,
          appliesTo: kinds,
          maxUses: numOrNull(maxUses),
          perUserLimit: numOrNull(perUser) ?? 1,
          expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59+07:00`).toISOString() : null,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.message || "Gagal membuat kode promo.");
        return;
      }
      onCreated({ ...d.item, expiresAt: d.item.expiresAt });
      toast.success(`Kode ${d.item.code} dibuat.`);
      setCode("");
      setDescription("");
      setValue("");
      setMaxDiscount("");
      setKinds([]);
      setMaxUses("");
      setExpiresAt("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-5 sm:p-6">
      <h2 className="font-serif text-2xl text-[#1F1A14]">Buat kode promo</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
          Kode
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24))}
            placeholder="MITRABARU"
            required
            minLength={3}
            className={`${fieldCls} font-mono uppercase tracking-wider`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
          Keterangan untuk pembeli (opsional)
          <input value={description} onChange={(e) => setDescription(e.target.value.slice(0, 120))} placeholder="Diskon 20% paket Mitra pertama" className={fieldCls} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
          Jenis potongan
          <SelectField
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "PERCENT" | "AMOUNT");
              // A rupiah amount is not a valid percentage (and vice versa)
              setValue("");
            }}
          >
            <option value="PERCENT">Persen (%)</option>
            <option value="AMOUNT">Rupiah (Rp)</option>
          </SelectField>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
          {mode === "PERCENT" ? "Besar diskon (%)" : "Potongan (Rp)"}
          {mode === "PERCENT" ? (
            <NumberInput value={value} onValueChange={setValue} max={100} suffix="%" placeholder="20" required className={fieldCls} />
          ) : (
            <NumberInput value={value} onValueChange={setValue} format="thousands" prefix="Rp" placeholder="50.000" required className={fieldCls} />
          )}
        </label>
        {mode === "PERCENT" && (
          <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
            Maks potongan (Rp, opsional)
            <NumberInput value={maxDiscount} onValueChange={setMaxDiscount} format="thousands" prefix="Rp" placeholder="Tanpa batas" className={fieldCls} />
          </label>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs text-[#6B5F50]">Berlaku untuk (kosongkan = semua)</legend>
        <div className="flex flex-wrap gap-2">
          {KIND_OPTIONS.map(([id, label]) => {
            const on = kinds.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setKinds((prev) => (on ? prev.filter((k) => k !== id) : [...prev, id]))}
                className={`h-9 rounded-full border px-3.5 text-sm ${on ? "border-[#1F1A14] bg-[#1F1A14] text-[#FCF8F1]" : "border-[#DDD5C7] bg-white text-[#4A443B]"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
          Total kuota pemakaian
          <NumberInput value={maxUses} onValueChange={setMaxUses} format="thousands" maxDigits={7} placeholder="Tanpa batas" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
          Maks per akun
          <NumberInput value={perUser} onValueChange={setPerUser} max={100} placeholder="1" className={fieldCls} />
        </label>
        <div className="space-y-1.5 text-xs text-[#6B5F50]">
          <span className="block">Berlaku sampai (opsional)</span>
          <DatePickerField value={expiresAt} onChange={setExpiresAt} compact className={fieldCls} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={busy || !code || !value} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#1F1A14] px-5 text-sm font-medium text-[#FCF8F1] disabled:opacity-40">
          <IconPlus size={16} /> {busy ? "Menyimpan..." : "Buat kode"}
        </button>
      </div>
    </form>
  );
}

export function PromoManager({ initialItems }: { initialItems: AdminPromo[] }) {
  const [items, setItems] = useState(initialItems);
  // Captured once so render stays pure; good enough for "expired" badges on an admin list
  const [now] = useState(() => Date.now());

  const toggle = async (p: AdminPromo) => {
    const res = await fetch(`/api/admin/promo/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (!res.ok) return toast.error("Gagal mengubah status.");
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)));
  };

  const remove = async (p: AdminPromo) => {
    const res = await fetch(`/api/admin/promo/${p.id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(d.message || "Gagal menghapus.");
    setItems((prev) => prev.filter((x) => x.id !== p.id));
    toast.success(`Kode ${p.code} dihapus.`);
  };

  return (
    <div className="space-y-8">
      <CreatePromoForm onCreated={(p) => setItems((prev) => [p, ...prev])} />

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-[#1F1A14]">Semua kode</h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#D6CBB8] p-6 text-center text-[15px] text-[#6B5F50]">Belum ada kode promo.</p>
        ) : (
          <ul className="divide-y divide-[#EDE6DA] overflow-hidden rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9]">
            {items.map((p) => {
              const expired = p.expiresAt ? new Date(p.expiresAt).getTime() < now : false;
              const exhausted = p.maxUses !== null && p.usedCount >= p.maxUses;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-semibold tracking-wider text-[#1F1A14]">{p.code}</span>
                      {(!p.isActive || expired || exhausted) && (
                        <span className="rounded-full bg-[#EFE9DF] px-2 py-0.5 text-[11px] text-[#6B5F50]">
                          {!p.isActive ? "Nonaktif" : expired ? "Kedaluwarsa" : "Kuota habis"}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[#4A443B]">{p.description || describePromo(p)}</p>
                    <p className="text-xs text-[#7D7468]">
                      {describePromo(p)} · dipakai {p.usedCount}
                      {p.maxUses ? `/${p.maxUses}` : ""} kali · maks {p.perUserLimit}× per akun
                      {p.expiresAt ? ` · s/d ${dateFmt.format(new Date(p.expiresAt))}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.isActive}
                      aria-label={`${p.isActive ? "Nonaktifkan" : "Aktifkan"} ${p.code}`}
                      onClick={() => void toggle(p)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.isActive ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
                    >
                      <span className={`inline-block h-4.5 w-4.5 rounded-full bg-[#FFFDF9] transition-transform ${p.isActive ? "translate-x-5.5" : "translate-x-1"}`} />
                    </button>
                    {p.usedCount === 0 && (
                      <button
                        type="button"
                        onClick={() => void remove(p)}
                        aria-label={`Hapus ${p.code}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B5F50] hover:bg-[#F5EDDD] hover:text-red-600"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
