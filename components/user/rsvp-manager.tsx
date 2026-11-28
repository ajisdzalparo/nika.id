"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconCircleCheck,
  IconCircleDashed,
  IconDownload,
  IconEyeCheck,
  IconPencil,
  IconQrcode,
  IconScan,
  IconSearch,
  IconShieldLock,
  IconTrash,
  IconUserCheck,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TablePagination, useClientSort } from "@/components/common/table-pagination";
import { SortableTableHead, TableHead } from "@/components/ui/table";
import { StatTile } from "@/components/common/studio-ui";
import { CheckInQr, downloadQrCard, downloadStandardQr, renderQrCard, renderStandardQr, shareQrOnWhatsapp } from "@/components/common/qr-code";
import { waLink } from "@/lib/phone";

export interface RsvpRow {
  id: string;
  guestName: string;
  attendance: string;
  guests: number;
  phone: string | null;
  companions: string | null;
  customAnswer: string | null;
  note: string | null;
  checkInToken: string | null;
  checkedInAt: string | null;
  webOpenedAt?: string | null;
  webOpenCount?: number;
  createdAt: string;
}

type Filter = "SEMUA" | "HADIR" | "MUNGKIN" | "TIDAK HADIR" | "CHECKIN" | "BELUM";

const STATUS: Record<string, { label: string; cls: string }> = {
  HADIR: { label: "Hadir", cls: "bg-[#EEF4EA] text-[#3F6B3A]" },
  MUNGKIN: { label: "Mungkin", cls: "bg-[#F6EEDF] text-[#8A6424]" },
  "TIDAK HADIR": { label: "Berhalangan", cls: "bg-[#F6E7E4] text-[#9A3B2E]" },
};

const fmt = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/**
 * RSVP guest list for the couple: numbers at a glance, search / filter / sort, a page at a time,
 * and per guest: check-in, QR download (plain or as a small invitation card), a note and delete.
 */
export function RsvpManager({
  initialRows,
  qrEnabled,
  card,
  monitoringOnly = false,
}: {
  initialRows: RsvpRow[];
  qrEnabled: boolean;
  card: { couple: string; date?: string | null; venue?: string | null };
  monitoringOnly?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("SEMUA");
  const [sort, setSort] = useState<"baru" | "nama">("baru");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [qrFor, setQrFor] = useState<RsvpRow | null>(null);
  const [qrKind, setQrKind] = useState<"card" | "standard">("card");
  const [noteFor, setNoteFor] = useState<RsvpRow | null>(null);
  const [noteText, setNoteText] = useState("");
  const [deleteFor, setDeleteFor] = useState<RsvpRow | null>(null);
  const [busy, setBusy] = useState(false);

  const coming = rows.filter((r) => r.attendance.toUpperCase() !== "TIDAK HADIR");
  const stats = {
    total: rows.length,
    attending: rows.filter((r) => r.attendance.toUpperCase() === "HADIR").length,
    people: coming.reduce((n, r) => n + (r.guests || 1), 0),
    checkedIn: rows.filter((r) => r.checkedInAt).reduce((n, r) => n + (r.guests || 1), 0),
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (term && !`${r.guestName} ${r.phone ?? ""} ${r.companions ?? ""} ${r.note ?? ""}`.toLowerCase().includes(term)) return false;
      if (filter === "CHECKIN") return Boolean(r.checkedInAt);
      if (filter === "BELUM") return !r.checkedInAt && r.attendance.toUpperCase() !== "TIDAK HADIR";
      if (filter !== "SEMUA") return r.attendance.toUpperCase() === filter;
      return true;
    });
    return list.sort((a, b) => (sort === "nama" ? a.guestName.localeCompare(b.guestName, "id") : b.createdAt.localeCompare(a.createdAt)));
  }, [rows, q, filter, sort]);

  // Column headers sort on top of the "Urutkan" choice; clicking a header a third time returns to it
  const { sortedRows, sort: colSort, onSort: onColSort } = useClientSort(shown, {
    name: (r) => r.guestName,
    status: (r) => r.attendance,
    guests: (r) => r.guests || 1,
    checkin: (r) => (r.checkedInAt ? new Date(r.checkedInAt) : null),
  });
  const pages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const current = Math.min(page, pages);
  const pageRows = sortedRows.slice((current - 1) * perPage, current * perPage);

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/user/rsvp/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("FAILED");
    const data = (await res.json()) as { rsvp: Pick<RsvpRow, "id" | "note" | "checkedInAt" | "checkInToken"> };
    setRows((all) => all.map((r) => (r.id === id ? { ...r, ...data.rsvp } : r)));
    return data.rsvp;
  };

  const toggleCheckIn = async (r: RsvpRow) => {
    try {
      await patch(r.id, { checkedIn: !r.checkedInAt });
      toast.success(r.checkedInAt ? `${r.guestName} ditandai belum datang` : `${r.guestName} sudah check-in`);
    } catch {
      toast.error("Gagal memperbarui status check-in");
    }
  };

  const openQr = async (r: RsvpRow) => {
    if (r.checkInToken) return setQrFor(r);
    try {
      const updated = await patch(r.id, { ensureToken: true });
      setQrFor({ ...r, checkInToken: updated.checkInToken });
    } catch {
      toast.error("Gagal membuat QR");
    }
  };

  const downloadQr = async () => {
    if (!qrFor?.checkInToken) return;
    setBusy(true);
    try {
      if (qrKind === "standard") await downloadStandardQr(qrFor.checkInToken, qrFor.guestName);
      else await downloadQrCard(qrFor.checkInToken, { guestName: qrFor.guestName, note: qrFor.note, ...card });
      setQrFor(null);
    } finally {
      setBusy(false);
    }
  };

  const sendQrOnWhatsapp = async () => {
    if (!qrFor?.checkInToken) return;
    setBusy(true);
    try {
      const img =
        qrKind === "standard"
          ? await renderStandardQr(qrFor.checkInToken, qrFor.guestName)
          : await renderQrCard(qrFor.checkInToken, { guestName: qrFor.guestName, note: qrFor.note, ...card });
      const message = [
        `Halo ${qrFor.guestName},`,
        `terima kasih sudah mengonfirmasi kehadiran di pernikahan ${card.couple}.`,
        "Berikut QR check-in Anda. Mohon tunjukkan kepada penerima tamu saat tiba di lokasi acara.",
      ].join("\n");
      const how = await shareQrOnWhatsapp(img, qrFor.phone, message);
      if (how === "manual") toast.success("QR diunduh. Lampirkan gambarnya di chat WhatsApp yang terbuka.");
      setQrFor(null);
    } catch {
      toast.error("Gagal menyiapkan QR");
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    if (!noteFor) return;
    setBusy(true);
    try {
      await patch(noteFor.id, { note: noteText });
      toast.success("Catatan disimpan");
      setNoteFor(null);
    } catch {
      toast.error("Gagal menyimpan catatan");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteFor) return;
    setBusy(true);
    const res = await fetch(`/api/user/rsvp/${deleteFor.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return toast.error("Gagal menghapus");
    setRows((all) => all.filter((r) => r.id !== deleteFor.id));
    toast.success(`RSVP ${deleteFor.guestName} dihapus`);
    setDeleteFor(null);
  };

  const filters: [Filter, string][] = [
    ["SEMUA", "Semua"],
    ["HADIR", "Hadir"],
    ["MUNGKIN", "Mungkin"],
    ["TIDAK HADIR", "Berhalangan"],
    ...(qrEnabled
      ? ([
          ["CHECKIN", "Sudah check-in"],
          ["BELUM", "Belum datang"],
        ] as [Filter, string][])
      : []),
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total RSVP" value={fmt.format(stats.total)} icon={IconUsers} />
        <StatTile label="Konfirmasi hadir" value={fmt.format(stats.attending)} hint={`dari ${fmt.format(stats.total)} RSVP`} icon={IconUserCheck} delay={60} />
        <StatTile label="Total tamu datang" value={fmt.format(stats.people)} hint="termasuk pendamping" icon={IconUsersGroup} delay={120} />
        <StatTile
          label="Sudah check-in"
          value={qrEnabled ? fmt.format(stats.checkedIn) : "–"}
          hint={qrEnabled ? `dari ${fmt.format(stats.people)} orang` : "QR check-in belum aktif"}
          icon={IconScan}
          delay={180}
        />
      </div>

      {monitoringOnly && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#E6D5B2] bg-[#FAF4E8] px-4 py-3.5 text-sm text-[#40372B]">
          <IconShieldLock size={19} className="mt-0.5 shrink-0 text-[#8A6424]" />
          <div>
            <p className="font-medium text-[#1F1A14]">Mode Pemantauan Mitra</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#5E5446]">
              Anda dapat memantau kehadiran dan ucapan tamu klien secara langsung. Nomor WhatsApp disensor sebagian untuk menjaga privasi tamu.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#EDE3CF] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#F3EBDB] p-4 lg:flex-row lg:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-4">
            <IconSearch size={16} className="shrink-0 text-[#6B5F50]" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              type="search"
              aria-label="Cari tamu"
              placeholder={monitoringOnly ? "Cari nama tamu, pendamping, catatan…" : "Cari nama, nomor, pendamping, catatan…"}
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SelectField value={sort} onChange={(e) => setSort(e.target.value as "baru" | "nama")} aria-label="Urutkan" className="w-auto min-w-36">
              <option value="baru">Terbaru</option>
              <option value="nama">Nama A–Z</option>
            </SelectField>
            {!monitoringOnly && (
              <>
                <a href="/api/user/rsvp/export" download className={buttonVariants({ variant: "outline", className: "h-10 rounded-full border-[#E9DDC6]" })}>
                  <IconDownload size={16} /> Ekspor CSV
                </a>
                <Link href="/wa-blast" className={buttonVariants({ variant: "outline", className: "h-10 rounded-full border-[#E9DDC6]" })}>
                  <IconBrandWhatsapp size={16} className="text-[#8A6424]" /> WA Blast
                  <span className="rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424]">Segera</span>
                </Link>
                {qrEnabled && (
                  <Link href="/check-in" className={buttonVariants({ variant: "gold", className: "h-10 px-4" })}>
                    <IconScan size={16} /> Pindai tamu
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-[#F3EBDB] px-4 py-3">
          {filters.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => {
                setFilter(k);
                setPage(1);
              }}
              className={`h-9 rounded-full border px-3.5 text-xs font-medium transition ${filter === k ? "border-[#1F1A14] bg-[#1F1A14] text-white" : "border-[#E9DDC6] text-[#40372B] hover:border-[#8A6424]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table (desktop) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-[#FBF7EF]">
              <tr className="border-b border-[#EFE6D4]">
                <SortableTableHead sortKey="name" sort={colSort} onSort={onColSort}>Tamu</SortableTableHead>
                <SortableTableHead sortKey="status" sort={colSort} onSort={onColSort}>Status RSVP</SortableTableHead>
                <TableHead>Web Undangan</TableHead>
                <SortableTableHead sortKey="guests" sort={colSort} onSort={onColSort}>Jumlah</SortableTableHead>
                <TableHead>Detail</TableHead>
                {qrEnabled && <SortableTableHead sortKey="checkin" sort={colSort} onSort={onColSort}>Check-in</SortableTableHead>}
                {!monitoringOnly && <TableHead className="text-right">Aksi</TableHead>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const st = STATUS[r.attendance.toUpperCase()] ?? STATUS.HADIR;
                const wa = monitoringOnly ? null : waLink(r.phone);
                return (
                  <tr key={r.id} className="border-t border-[#F3EBDB] align-top transition-colors hover:bg-[#FCF8F1]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1F1A14]">{r.guestName}</p>
                      {monitoringOnly ? (
                        r.phone ? (
                          <p className="text-xs tabular-nums text-[#6B5F50]">{r.phone}</p>
                        ) : (
                          <p className="text-xs text-[#8E8268]">{dateFmt.format(new Date(r.createdAt))}</p>
                        )
                      ) : wa ? (
                        <a href={wa} target="_blank" rel="noreferrer" className="text-xs text-[#8A6424] hover:underline">
                          +{r.phone}
                        </a>
                      ) : (
                        <p className="text-xs text-[#8E8268]">{dateFmt.format(new Date(r.createdAt))}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FB] px-2.5 py-1 text-xs font-medium text-[#2555A6]">
                        <IconEyeCheck size={14} /> Dibuka{(r.webOpenCount ?? 0) > 1 ? ` ${r.webOpenCount}×` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#40372B]">{r.guests} orang</td>
                    <td className="max-w-64 px-4 py-3 text-xs text-[#6B5F50]">
                      {r.companions && <p>Bersama: {r.companions}</p>}
                      {r.customAnswer && <p>Jawaban: {r.customAnswer}</p>}
                      {r.note && <p className="font-medium text-[#8A6424]">Catatan: {r.note}</p>}
                      {!r.companions && !r.customAnswer && !r.note && "–"}
                    </td>
                    {qrEnabled && (
                      <td className="px-4 py-3">
                        {r.attendance.toUpperCase() === "TIDAK HADIR" ? (
                          <span className="text-xs text-[#8E8268]">–</span>
                        ) : r.checkedInAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF4EA] px-2.5 py-1 text-xs font-medium text-[#3F6B3A]">
                            <IconCircleCheck size={14} /> {dateFmt.format(new Date(r.checkedInAt))}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F6E7E4] px-2.5 py-1 text-xs font-medium text-[#9A3B2E]">
                            <IconCircleDashed size={14} /> Belum Check-in
                          </span>
                        )}
                      </td>
                    )}
                    {!monitoringOnly && (
                      <td className="px-4 py-3">
                        <RowActions r={r} qrEnabled={qrEnabled} onCheckIn={toggleCheckIn} onQr={openQr} onNote={(x) => (setNoteFor(x), setNoteText(x.note ?? ""))} onDelete={setDeleteFor} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards (phones) */}
        <ul className="divide-y divide-[#F3EBDB] md:hidden">
          {pageRows.map((r) => {
            const st = STATUS[r.attendance.toUpperCase()] ?? STATUS.HADIR;
            return (
              <li key={r.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1F1A14]">{r.guestName}</p>
                    <p className="text-xs tabular-nums text-[#6B5F50]">
                      {r.guests} orang{r.phone ? ` · ${monitoringOnly ? r.phone : `+${r.phone}`}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>
                {(r.companions || r.customAnswer || r.note) && (
                  <div className="text-xs text-[#6B5F50]">
                    {r.companions && <p>Bersama: {r.companions}</p>}
                    {r.customAnswer && <p>Jawaban: {r.customAnswer}</p>}
                    {r.note && <p className="font-medium text-[#8A6424]">Catatan: {r.note}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  {qrEnabled && r.attendance.toUpperCase() !== "TIDAK HADIR" ? (
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.checkedInAt ? "bg-[#EEF4EA] text-[#3F6B3A]" : "bg-[#F6E7E4] text-[#9A3B2E]"}`}>
                      {r.checkedInAt ? "Sudah Check-in" : "Belum Check-in"}
                    </span>
                  ) : (
                    <span />
                  )}
                  {!monitoringOnly && (
                    <RowActions r={r} qrEnabled={qrEnabled} onCheckIn={toggleCheckIn} onQr={openQr} onNote={(x) => (setNoteFor(x), setNoteText(x.note ?? ""))} onDelete={setDeleteFor} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {!pageRows.length && (
          <p className="px-6 py-16 text-center text-[15px] text-[#6B5F50]">
            {rows.length ? "Tidak ada tamu yang cocok dengan pencarian ini." : "Belum ada RSVP. Konfirmasi tamu akan muncul di sini setelah undangan dibagikan."}
          </p>
        )}

        {shown.length > 0 && (
          <TablePagination
            currentPage={current}
            totalPages={pages}
            totalCount={shown.length}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
            className="border-t border-[#F3EBDB] px-4"
          />
        )}
      </div>

      {/* QR download */}
      <Dialog open={Boolean(qrFor)} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal">QR untuk {qrFor?.guestName}</DialogTitle>
            <DialogDescription>Pilih bentuk QR, lalu kirim langsung ke WhatsApp tamu atau unduh gambarnya.</DialogDescription>
          </DialogHeader>
          {qrFor?.checkInToken && (
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Bentuk QR">
              {(
                [
                  ["card", "Kartu undangan mini"],
                  ["standard", "QR standar"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={qrKind === k}
                  onClick={() => setQrKind(k)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-3 transition ${qrKind === k ? "border-[#8A6424] ring-2 ring-[#8A6424]/20" : "border-[#E9DDC6] hover:border-[#8A6424]"}`}
                >
                  <span className={`flex h-44 w-full items-center justify-center rounded-xl ${k === "card" ? "bg-[linear-gradient(180deg,#FCF8F1,#F3E8D3)]" : "bg-[#F6EEDF]"}`}>
                    {k === "card" ? (
                      <span className="flex flex-col items-center gap-1 rounded-lg border border-[#8A6424]/40 bg-[#FCF8F1] px-3 py-2">
                        <span className="text-[8px] tracking-[0.2em] text-[#8A6424]">THE WEDDING OF</span>
                        <span className="max-w-28 truncate font-(family-name:--font-landing-display) text-sm text-[#1F1A14]">{card.couple}</span>
                        <CheckInQr token={qrFor.checkInToken ?? ""} size={76} />
                      </span>
                    ) : (
                      <CheckInQr token={qrFor.checkInToken ?? ""} size={130} />
                    )}
                  </span>
                  <span className="text-sm font-medium text-[#1F1A14]">{label}</span>
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setQrFor(null)} className="rounded-full">
              Batal
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={downloadQr} className="h-10 rounded-full px-5">
              <IconDownload size={16} /> Unduh
            </Button>
            <Button type="button" variant="gold" disabled={busy} onClick={() => void sendQrOnWhatsapp()} className="h-10 px-5">
              <IconBrandWhatsapp size={16} /> Kirim via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note */}
      <Dialog open={Boolean(noteFor)} onOpenChange={(o) => !o && setNoteFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal">Catatan untuk {noteFor?.guestName}</DialogTitle>
            <DialogDescription>Misalnya nomor meja atau keterangan khusus. Ikut tercetak di kartu QR.</DialogDescription>
          </DialogHeader>
          <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={120} placeholder="Contoh: Meja B6" aria-label="Catatan" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNoteFor(null)} className="rounded-full">
              Batal
            </Button>
            <Button type="button" variant="ink" disabled={busy} onClick={saveNote} className="h-10 px-5">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={Boolean(deleteFor)} onOpenChange={(o) => !o && setDeleteFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal">Hapus RSVP {deleteFor?.guestName}?</DialogTitle>
            <DialogDescription>Konfirmasi kehadiran tamu ini akan dihapus permanen dan QR-nya tidak bisa dipakai lagi.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteFor(null)} className="rounded-full">
              Batal
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={confirmDelete} className="h-10 rounded-full px-5">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowActions({
  r,
  qrEnabled,
  onCheckIn,
  onQr,
  onNote,
  onDelete,
}: {
  r: RsvpRow;
  qrEnabled: boolean;
  onCheckIn: (r: RsvpRow) => void;
  onQr: (r: RsvpRow) => void;
  onNote: (r: RsvpRow) => void;
  onDelete: (r: RsvpRow) => void;
}) {
  const coming = r.attendance.toUpperCase() !== "TIDAK HADIR";
  const btn = "flex size-9 items-center justify-center rounded-full text-[#6B5F50] transition-colors hover:bg-[#F6EEDF] hover:text-[#1F1A14]";
  return (
    <div className="flex items-center justify-end gap-0.5">
      {qrEnabled && coming && (
        <>
          <button type="button" onClick={() => onCheckIn(r)} className={btn} aria-label={r.checkedInAt ? `Batalkan check-in ${r.guestName}` : `Tandai ${r.guestName} sudah datang`} title={r.checkedInAt ? "Batalkan check-in" : "Tandai sudah datang"}>
            {r.checkedInAt ? <IconCircleCheck size={18} className="text-[#3F6B3A]" /> : <IconCircleDashed size={18} />}
          </button>
          <button type="button" onClick={() => onQr(r)} className={btn} aria-label={`QR ${r.guestName}`} title="QR check-in">
            <IconQrcode size={18} />
          </button>
        </>
      )}
      <button type="button" onClick={() => onNote(r)} className={btn} aria-label={`Catatan ${r.guestName}`} title="Catatan">
        <IconPencil size={18} />
      </button>
      <button type="button" onClick={() => onDelete(r)} className={`${btn} hover:text-[#9A3B2E]`} aria-label={`Hapus RSVP ${r.guestName}`} title="Hapus">
        <IconTrash size={18} />
      </button>
    </div>
  );
}
