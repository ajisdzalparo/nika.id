"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconDownload, IconFileSpreadsheet, IconLoader2, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Adds many guests at once from an Excel/CSV file (template downloadable from the dialog). */
export function GuestImportDialog({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);

  const upload = async () => {
    if (!file) return toast.error("Pilih file dulu");
    setBusy(true);
    setErrors([]);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/user/guests/import", { method: "POST", body });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.errors) setErrors(d.errors);
        return toast.error(d.message || "Gagal mengimpor");
      }
      toast.success(`${d.added} tamu ditambahkan${d.skipped ? ` · ${d.skipped} sudah ada, dilewati` : ""}`);
      setOpen(false);
      setFile(null);
      // The list holds server data from the first render: reload so the imported guests show
      window.location.reload();
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setErrors([]);
          setFile(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="h-10 rounded-full border-[#E9DDC6] px-4">
          <IconUpload size={16} /> Impor Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Impor daftar tamu</DialogTitle>
          <DialogDescription>Tambahkan banyak tamu sekaligus dari Excel atau Google Sheets (.xlsx / .csv). Template sudah dilengkapi pilihan dropdown sesuai form Tambah Tamu.</DialogDescription>
        </DialogHeader>

        <a
          href="/api/user/guests/import"
          download
          className="flex items-center gap-3 rounded-xl border border-dashed border-[#D9C9A6] bg-[#FCF8F1] p-3 text-sm text-[#40372B] hover:border-[#8A6424]"
        >
          <IconFileSpreadsheet size={22} className="shrink-0 text-[#8A6424]" />
          <span className="flex-1">Unduh template Excel berformat (dilengkapi dropdown Jenis Penerima, Tipe Tamu, Sapaan, Label Grup, RSVP &amp; Acara)</span>
          <IconDownload size={16} className="text-[#8A6424]" />
        </a>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-[#1F1A14]">File daftar tamu</span>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#1F1A14] file:px-4 file:py-2 file:text-xs file:font-medium file:text-[#F6EEDD]"
          />
        </label>

        {errors.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-xl bg-[#F4E6E2] p-3 text-xs text-[#7A2F22]">
            <p className="mb-1 font-medium">Perbaiki baris berikut lalu unggah ulang:</p>
            <ul className="space-y-0.5">
              {errors.map((e) => (
                <li key={`${e.row}-${e.message}`}>
                  Baris {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="gold" onClick={() => void upload()} disabled={busy || !file}>
            {busy && <IconLoader2 className="animate-spin" />}
            Impor tamu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
