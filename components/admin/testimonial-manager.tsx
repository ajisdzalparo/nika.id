"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconStarFilled, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/common/studio-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TESTIMONIAL_STATUSES, type TestimonialRow } from "@/lib/testimonials-shared";

type Item = TestimonialRow & { user: { name: string | null; email: string } };

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-[#F5E8CA] text-[#6E4F1C]",
  APPROVED: "bg-[#E3EEE4] text-[#2F5A37]",
  REJECTED: "bg-[#EFE9DF] text-[#6B5F50]",
};

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function TestimonialManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<"ALL" | string>("PENDING");
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
      toast.success(status === "APPROVED" ? "Testimoni tampil di halaman depan" : "Status testimoni diperbarui");
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui testimoni");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Testimoni dihapus");
    } catch {
      toast.error("Gagal menghapus testimoni");
    } finally {
      setBusy(null);
    }
  };

  const count = (s: string) => items.filter((it) => it.status === s).length;
  const visible = items.filter((it) => filter === "ALL" || it.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[{ id: "ALL", label: "Semua" }, ...TESTIMONIAL_STATUSES].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            aria-pressed={filter === s.id}
            className={`h-9 rounded-full border px-4 text-sm transition-colors ${
              filter === s.id ? "border-[#1F1A14] bg-[#1F1A14] text-[#FCF8F1]" : "border-[#DDD5C7] bg-white text-[#40372B] hover:border-[#B8AD9A]"
            }`}
          >
            {s.label} ({s.id === "ALL" ? items.length : count(s.id)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-[#6B5F50]">Belum ada testimoni di filter ini.</Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((it) => (
            <Panel key={it.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex gap-0.5 text-[#C9A24E]">
                  {Array.from({ length: it.rating }, (_, i) => (
                    <IconStarFilled key={i} size={14} />
                  ))}
                </span>
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium ${STATUS_TONE[it.status] ?? STATUS_TONE.PENDING}`}>
                  {TESTIMONIAL_STATUSES.find((s) => s.id === it.status)?.label ?? it.status}
                </span>
              </div>
              <p className="flex-1 text-[15px] italic leading-relaxed text-[#40372B]">&ldquo;{it.message}&rdquo;</p>
              <div className="border-t border-[#F3EBDB] pt-3 text-sm">
                <p className="font-medium text-[#1F1A14]">
                  {it.displayName}
                  {it.city ? <span className="font-normal text-[#6B5F50]"> · {it.city}</span> : null}
                </p>
                <p className="text-xs text-[#8E8268]">
                  {it.user.name || "-"} · {it.user.email} · {dateFmt.format(new Date(it.createdAt))}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {it.status !== "APPROVED" && (
                  <Button size="sm" variant="ink" disabled={busy === it.id} onClick={() => setStatus(it.id, "APPROVED")}>
                    <IconCheck size={14} /> Setujui
                  </Button>
                )}
                {it.status !== "REJECTED" && (
                  <Button size="sm" variant="outline" disabled={busy === it.id} onClick={() => setStatus(it.id, "REJECTED")}>
                    <IconX size={14} /> {it.status === "APPROVED" ? "Sembunyikan" : "Tolak"}
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" disabled={busy === it.id} aria-label="Hapus testimoni">
                      <IconTrash size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus testimoni?</AlertDialogTitle>
                      <AlertDialogDescription>Testimoni dari {it.displayName} akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(it.id)} className="bg-destructive hover:bg-destructive/90">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
