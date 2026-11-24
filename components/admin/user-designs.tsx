"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconLoader2, IconTemplate } from "@tabler/icons-react";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import type { AiTheme } from "@/lib/ai-design/schema";

export interface UserDesignRow {
  id: string;
  prompt: string;
  source: string;
  createdAt: string;
  theme: AiTheme;
  userName: string;
}

export function UserDesigns({ rows }: { rows: UserDesignRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const promote = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/catalog/from-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designId: id }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal membuat template");
      toast.success("Draf template dibuat. Lengkapi lalu aktifkan.");
      router.push(`/admin/templates/${j.id}`);
    } finally {
      setBusy(null);
    }
  };

  if (!rows.length) return <p className="py-16 text-center text-zinc-500">Belum ada desain AI dari user.</p>;

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {rows.map((r) => (
        <article key={r.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <CoverThumb theme={r.theme} zoom={0.6} className="aspect-[9/14] w-full" />
          <div className="space-y-3 p-4">
            <div>
              <p className="truncate font-serif text-xl">{r.theme.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {r.userName} · {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(r.createdAt))}
                {r.source === "CATALOG" ? " · dari katalog" : ""}
              </p>
            </div>
            <p className="line-clamp-2 text-sm text-zinc-600">{r.prompt}</p>
            <button onClick={() => promote(r.id)} disabled={busy !== null} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-zinc-900 text-sm font-medium text-zinc-50 disabled:opacity-50">
              {busy === r.id ? <IconLoader2 size={15} className="animate-spin" /> : <IconTemplate size={15} />} Jadikan template
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
