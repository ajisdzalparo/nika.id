"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FEATURE_STATUS_LABEL,
  FEATURE_STATUSES,
  FEATURES,
  type FeatureId,
  type FeatureStatus,
  type FeatureStatusMap,
} from "@/lib/features";

/** Status colour, used sparingly: a dot in the active segment and a marker on closed features */
const STATUS_DOT: Record<FeatureStatus, string> = {
  ACTIVE: "bg-[#3E8E5B]",
  MAINTENANCE: "bg-[#C98A1E]",
  COMING_SOON: "bg-[#7A5CB0]",
};

function StatusSegments({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: FeatureStatus;
  disabled: boolean;
  onChange: (next: FeatureStatus) => void;
}) {
  return (
    <div role="radiogroup" aria-label={`Status ${label}`} className="inline-flex shrink-0 rounded-full border border-[#E9DDC6] bg-[#F7F1E6] p-1">
      {FEATURE_STATUSES.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition disabled:cursor-wait ${
              on ? "bg-[#1F1A14] text-[#F6EEDD] shadow-[0_6px_14px_-10px_rgba(26,21,16,.8)]" : "text-[#6B5F50] hover:text-[#1F1A14]"
            }`}
          >
            {on && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />}
            {FEATURE_STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}

/** Admin control for every feature in lib/features.ts: Aktif / Maintenance / Segera hadir, saved on change. */
export function FeatureStatusManager({ initialStatuses }: { initialStatuses: FeatureStatusMap }) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [saving, setSaving] = useState<FeatureId | null>(null);

  const change = async (id: FeatureId, next: FeatureStatus) => {
    const prev = statuses[id];
    if (next === prev) return;
    setStatuses((s) => ({ ...s, [id]: next }));
    setSaving(id);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: { [id]: next } }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatuses((s) => ({ ...s, [id]: prev }));
        return toast.error(d.message || "Gagal menyimpan status fitur");
      }
      if (d.features) setStatuses(d.features);
      const label = FEATURES.find((f) => f.id === id)?.label ?? id;
      toast.success(`${label}: ${FEATURE_STATUS_LABEL[next]}`);
    } catch {
      setStatuses((s) => ({ ...s, [id]: prev }));
      toast.error("Gagal terhubung ke server");
    } finally {
      setSaving(null);
    }
  };

  const closed = FEATURES.filter((f) => statuses[f.id] !== "ACTIVE");

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <CardTitle>Status Fitur</CardTitle>
            <CardDescription>
              <b>Maintenance</b> menutup fitur sementara, <b>Segera hadir</b> untuk fitur yang belum rilis. User melihat pemberitahuan di halaman
              fitur, dan aksinya ditolak sampai fitur aktif lagi.
            </CardDescription>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FFFDF9] px-3 py-1 text-xs font-medium text-[#4A443B]">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${closed.length ? STATUS_DOT.MAINTENANCE : STATUS_DOT.ACTIVE}`} />
            {closed.length ? `${closed.length} dari ${FEATURES.length} fitur ditutup` : "Semua fitur aktif"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-[#F3EBDB] border-t border-[#F3EBDB]">
          {FEATURES.map((f) => {
            const status = statuses[f.id];
            const isClosed = status !== "ACTIVE";
            return (
              <li
                key={f.id}
                className={`flex flex-col gap-3 py-4 pr-6 sm:flex-row sm:items-center sm:justify-between ${
                  isClosed ? "border-l-2 border-l-[#D9B56A] bg-[#FCF8F1] pl-[22px]" : "pl-6"
                }`}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15px] font-medium text-[#1F1A14]">
                    {f.label}
                    {saving === f.id && <IconLoader2 size={14} className="animate-spin text-[#8A6424]" />}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#7D7468]">{f.description}</p>
                </div>
                <StatusSegments label={f.label} value={status} disabled={saving === f.id} onChange={(s) => void change(f.id, s)} />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
