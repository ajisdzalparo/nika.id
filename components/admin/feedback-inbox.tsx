"use client";

import { useMemo, useState } from "react";
import { IconPencil, IconStarFilled } from "@tabler/icons-react";
import { toast } from "sonner";
import { FEEDBACK_CATEGORIES, FEEDBACK_FEATURES, FEEDBACK_STATUSES, labelOf } from "@/lib/feedback-shared";
import { SelectField } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface AdminFeedbackItem {
  id: string;
  category: string;
  feature: string;
  rating: number | null;
  message: string;
  pagePath: string | null;
  status: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string; accountType: string };
}

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm ${
        active ? "border-[#1F1A14] bg-[#1F1A14] text-[#FCF8F1]" : "border-[#E9DDC6] bg-[#FFFDF9] text-[#4A443B] hover:bg-[#F6EEDF]"
      }`}
    >
      {children}
    </button>
  );
}

const STATUS_TONE: Record<string, string> = {
  BARU: "border-[#E9DDC6] bg-[#FFFDF9] text-[#4A443B]",
  DITINJAU: "border-[#E6D5B2] bg-[#F7F0E1] text-[#6E4F1C]",
  DIRENCANAKAN: "border-[#D9C7F0] bg-[#F4EEFB] text-[#4F3A78]",
  SELESAI: "border-[#BFDCC7] bg-[#EEF7F0] text-[#23603A]",
  DITOLAK: "border-[#EBC4BA] bg-[#FBEDE8] text-[#9A3B2A]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium ${STATUS_TONE[status] ?? STATUS_TONE.BARU}`}>
      {labelOf(FEEDBACK_STATUSES, status)}
    </span>
  );
}

function FeedbackCard({ item, onSaved }: { item: AdminFeedbackItem; onSaved: (next: AdminFeedbackItem) => void }) {
  const [status, setStatus] = useState(item.status);
  const [reply, setReply] = useState(item.adminReply ?? "");
  const [busy, setBusy] = useState(false);
  // Handled feedback (replied or moved past "Baru") reads as a closed ticket; the form only opens on Edit
  const handled = Boolean(item.adminReply) || item.status !== "BARU";
  const [editing, setEditing] = useState(!handled);
  const dirty = status !== item.status || reply.trim() !== (item.adminReply ?? "");

  const cancelEdit = () => {
    setStatus(item.status);
    setReply(item.adminReply ?? "");
    setEditing(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminReply: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Gagal menyimpan.");
        return;
      }
      onSaved({
        ...item,
        status: data.item.status,
        adminReply: data.item.adminReply,
        repliedAt: data.item.repliedAt ?? null,
      });
      setEditing(false);
      toast.success("Tersimpan. Pengguna mendapat notifikasi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="space-y-4 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#1F1A14]">
            {item.user.name || item.user.email}
            {item.user.accountType === "AGENCY" && <span className="ml-2 rounded-full bg-[#F5E8CA] px-2 py-0.5 text-[11px] text-[#6E4F1C]">Mitra</span>}
          </p>
          <p className="truncate text-xs text-[#7D7468]">
            {item.user.email} · {dateFmt.format(new Date(item.createdAt))}
            {item.pagePath ? ` · dari ${item.pagePath}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[#E9DDC6] px-2.5 py-1 text-[#4A443B]">{labelOf(FEEDBACK_CATEGORIES, item.category)}</span>
          <span className="rounded-full border border-[#E9DDC6] px-2.5 py-1 text-[#4A443B]">{labelOf(FEEDBACK_FEATURES, item.feature)}</span>
          {item.rating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5E8CA] px-2.5 py-1 text-[#6E4F1C]">
              <IconStarFilled size={12} /> {item.rating}/5
            </span>
          )}
        </div>
      </div>

      <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#1F1A14]">{item.message}</p>

      {!editing ? (
        // Ticket view: what was decided and what the user was told, read-only
        <div className="space-y-3 border-t border-[#F3EBDB] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#7D7468]">
              <StatusBadge status={item.status} />
              {item.repliedAt && <span>Dibalas {dateFmt.format(new Date(item.repliedAt))}</span>}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8 rounded-full border-[#E9DDC6] bg-[#FFFDF9] px-3 text-xs">
              <IconPencil size={14} /> Edit
            </Button>
          </div>
          {item.adminReply ? (
            <div className="rounded-xl border-l-2 border-[#8A6424] bg-[#F7F1E6] px-4 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6424]">Balasan admin</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#1F1A14]">{item.adminReply}</p>
            </div>
          ) : (
            <p className="text-sm text-[#7D7468]">Status diperbarui tanpa balasan tertulis.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 border-t border-[#F3EBDB] pt-4">
          <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
            <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
              Status
              <SelectField value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                {FEEDBACK_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </SelectField>
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-[#6B5F50]">
              Balasan untuk pengguna (opsional)
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value.slice(0, 2000))}
                rows={3}
                placeholder="Terima kasih, ini sudah kami catat untuk pembaruan berikutnya…"
                className="min-h-20 rounded-xl border-[#DDD5C7] bg-white text-sm"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            {handled && (
              <Button type="button" variant="ghost" onClick={cancelEdit} disabled={busy} className="h-10 rounded-full px-4 text-sm">
                Batal
              </Button>
            )}
            <Button type="button" variant="ink" onClick={() => void save()} disabled={!dirty || busy} className="h-10 px-5 text-sm font-medium">
              {busy ? "Menyimpan..." : handled ? "Simpan perubahan" : "Kirim"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function FeedbackInbox({ initialItems }: { initialItems: AdminFeedbackItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<string>("BARU");
  const [feature, setFeature] = useState<string>("ALL");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  const ratings = useMemo(() => {
    const byFeature = new Map<string, { sum: number; n: number }>();
    for (const it of items) {
      if (!it.rating) continue;
      const e = byFeature.get(it.feature) ?? { sum: 0, n: 0 };
      e.sum += it.rating;
      e.n += 1;
      byFeature.set(it.feature, e);
    }
    return FEEDBACK_FEATURES.map((f) => ({ ...f, ...(byFeature.get(f.id) ?? { sum: 0, n: 0 }) })).filter((f) => f.n > 0);
  }, [items]);

  const visible = items.filter((it) => (status === "ALL" || it.status === status) && (feature === "ALL" || it.feature === feature));

  return (
    <div className="space-y-6">
      {ratings.length > 0 && (
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E9DDC6] bg-[#E9DDC6] md:grid-cols-4">
          {ratings.map((r) => (
            <div key={r.id} className="bg-[#FFFDF9] p-4">
              <p className="truncate text-[13px] text-[#6B5F50]">{r.label}</p>
              <p className="mt-1 font-serif text-3xl tabular-nums text-[#1F1A14]">
                {(r.sum / r.n).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                <span className="ml-1 font-sans text-xs text-[#7D7468]">/5 · {r.n} nilai</span>
              </p>
            </div>
          ))}
        </section>
      )}

      <div className="space-y-3">
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="Status">
          <FilterChip active={status === "ALL"} onClick={() => setStatus("ALL")}>
            Semua <span className="tabular-nums opacity-70">{items.length}</span>
          </FilterChip>
          {FEEDBACK_STATUSES.map((s) => (
            <FilterChip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>
              {s.label} <span className="tabular-nums opacity-70">{counts[s.id] ?? 0}</span>
            </FilterChip>
          ))}
        </nav>
        <label className="flex items-center gap-2 text-sm text-[#6B5F50]">
          Fitur
          <SelectField size="sm"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
           
          >
            <option value="ALL">Semua fitur</option>
            {FEEDBACK_FEATURES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </SelectField>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#D6CBB8] p-8 text-center text-[15px] text-[#6B5F50]">Tidak ada masukan di filter ini.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((it) => (
            <FeedbackCard key={it.id} item={it} onSaved={(next) => setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)))} />
          ))}
        </ul>
      )}
    </div>
  );
}
