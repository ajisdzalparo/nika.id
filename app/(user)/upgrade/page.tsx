"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconCheck, IconClock, IconCopy, IconLoader2, IconX } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { PLAN_LIMITS, type PlanType } from "@/lib/limits";
import { useSession } from "@/lib/auth-client";

interface Order {
  id: string;
  plan: PlanType;
  amount: number;
  paymentProof: string | null;
  createdAt: string;
}
interface Bank {
  bank: string;
  number: string;
  holder: string;
}

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const count = (n: number) => (n === Infinity ? "Tanpa batas" : String(n));

function features(k: PlanType) {
  const p = PLAN_LIMITS[k];
  return [
    `${count(p.maxGuests)} tamu bernama`,
    `${p.aiDesignQuota}× desain AI`,
    p.maxGalleryPhotos ? `Galeri ${count(p.maxGalleryPhotos)} foto` : "",
    p.canUseMusic ? "Musik latar" : "",
    p.canUseRSVP ? "RSVP & ucapan" : "",
    p.canUseLoveStory ? "Kisah cinta" : "",
    p.canUseDigitalGift ? "Amplop digital" : "",
    p.canUseVideo ? "Video" : "",
    p.canRemoveWatermark ? "Tanpa watermark" : "",
    p.activeDays === null ? "Aktif selamanya" : `Aktif ${p.activeDays} hari`,
  ].filter(Boolean);
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 px-3 text-xs font-medium hover:bg-zinc-100"
      aria-label={label}
    >
      {done ? <IconCheck size={14} /> : <IconCopy size={14} />} {done ? "Tersalin" : "Salin"}
    </button>
  );
}

export default function UpgradePage() {
  const { data: session } = useSession();
  const currentPlan = ((session?.user as { plan?: PlanType } | undefined)?.plan ?? "FREE") as PlanType;
  const [order, setOrder] = useState<Order | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payment/manual")
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order ?? null);
        setBanks(d.banks ?? []);
        setWhatsapp(d.whatsapp ?? null);
      })
      .finally(() => setLoaded(true));
  }, []);

  const choose = async (plan: PlanType) => {
    setBusy(plan);
    try {
      const res = await fetch("/api/payment/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const d = await res.json();
      if (!res.ok) return toast.error(d.message || "Gagal membuat pesanan");
      setOrder(d.order);
      setBanks(d.banks ?? []);
      setWhatsapp(d.whatsapp ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(null);
    }
  };

  const attachProof = async (url: string) => {
    if (!order) return;
    if (!url) return setOrder({ ...order, paymentProof: null });
    const res = await fetch("/api/payment/manual", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, proofUrl: url }) });
    const d = await res.json();
    if (!res.ok) return toast.error(d.message || "Gagal menyimpan bukti transfer");
    setOrder(d.order);
    toast.success("Bukti transfer terkirim. Kami akan memverifikasinya.");
  };

  const cancel = async () => {
    if (!confirm("Batalkan pesanan ini?")) return;
    setBusy("cancel");
    await fetch("/api/payment/manual", { method: "DELETE" });
    setOrder(null);
    setBusy(null);
  };

  const plans = (Object.keys(PLAN_LIMITS) as PlanType[]).filter((k) => PLAN_LIMITS[k].price > 0);
  const amount = order ? String(order.amount) : "";

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-10">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Paket</p>
            <h2 className="font-serif text-5xl font-medium leading-tight">{order ? "Selesaikan pembayaran" : "Pilih paket untuk acara kalian"}</h2>
            <p className="text-zinc-600">
              Paket saat ini: <strong className="font-medium text-zinc-900">{PLAN_LIMITS[currentPlan].name}</strong>. Pembayaran lewat transfer bank, diverifikasi manual oleh tim kami.
            </p>
          </header>

          {!loaded ? (
            <div className="flex justify-center py-20">
              <IconLoader2 className="animate-spin text-zinc-400" />
            </div>
          ) : order ? (
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Paket {PLAN_LIMITS[order.plan].name}</p>
                    <p className="mt-1 font-serif text-5xl lining-nums">{rupiah(order.amount)}</p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Transfer <strong className="font-medium text-zinc-900">tepat sampai 3 digit terakhir</strong> ({amount.slice(-3)}) agar pembayaran mudah dicocokkan.
                    </p>
                  </div>
                  <CopyButton text={amount} label="Salin nominal" />
                </div>

                <div className="space-y-3 border-t border-zinc-100 pt-5">
                  <p className="text-sm font-medium">Transfer ke salah satu rekening</p>
                  {banks.length ? (
                    banks.map((b) => (
                      <div key={b.number} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.16em] text-[#8A6A2F]">{b.bank}</p>
                          <p className="mt-1 font-serif text-2xl tabular-nums lining-nums">{b.number}</p>
                          <p className="truncate text-sm text-zinc-500">a.n. {b.holder}</p>
                        </div>
                        <CopyButton text={b.number} label={`Salin nomor ${b.bank}`} />
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Rekening tujuan belum diatur. Hubungi admin untuk info pembayaran.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-5">
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Halo, saya sudah transfer ${rupiah(order.amount)} untuk paket ${PLAN_LIMITS[order.plan].name} (pesanan ${order.id.slice(-6)}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 items-center gap-2 rounded-full border border-zinc-300 px-5 text-sm font-medium hover:bg-zinc-100"
                    >
                      <IconBrandWhatsapp size={17} /> Tanya admin
                    </a>
                  )}
                  <button onClick={cancel} disabled={busy !== null} className="flex h-11 items-center gap-2 rounded-full px-4 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800">
                    <IconX size={16} /> Batalkan / ganti paket
                  </button>
                </div>
              </div>

              <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="font-serif text-2xl">Bukti transfer</p>
                <ImageUploadField value={order.paymentProof ?? ""} onChange={attachProof} aspect="aspect-[3/4]" />
                {order.paymentProof ? (
                  <p className="flex gap-2 rounded-xl bg-[#F4EAD6] p-3 text-sm text-[#6E5426]">
                    <IconClock size={18} className="mt-0.5 shrink-0" /> Menunggu verifikasi admin. Paket aktif otomatis setelah disetujui.
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">Setelah transfer, unggah foto atau screenshot bukti transfer di sini.</p>
                )}
              </aside>
            </section>
          ) : (
            <section className="grid gap-5 md:grid-cols-2">
              {plans.map((k) => {
                const p = PLAN_LIMITS[k];
                const isCurrent = k === currentPlan;
                const featured = k === plans[plans.length - 1];
                return (
                  <div key={k} className={`flex flex-col rounded-2xl border p-7 ${featured ? "border-zinc-900 bg-zinc-950 text-zinc-50" : "border-zinc-200 bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-3xl">{p.name}</h3>
                      {featured && <span className="rounded-full bg-[#C9A45C] px-3 py-1 text-[11px] font-medium text-zinc-950">Paling lengkap</span>}
                    </div>
                    <p className="mt-5 font-serif text-5xl lining-nums">{rupiah(p.price)}</p>
                    <p className={`text-sm ${featured ? "text-zinc-400" : "text-zinc-500"}`}>sekali bayar per acara</p>
                    <ul className="mt-6 flex-1 space-y-2.5 text-[15px]">
                      {features(k).map((f) => (
                        <li key={f} className="flex gap-2.5">
                          <IconCheck size={18} className={`mt-0.5 shrink-0 ${featured ? "text-[#C9A45C]" : "text-[#8A6A2F]"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => choose(k)}
                      disabled={isCurrent || busy !== null}
                      className={`mt-7 flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium disabled:opacity-50 ${featured ? "bg-[#F3EBDD] text-zinc-950" : "border border-zinc-900"}`}
                    >
                      {busy === k && <IconLoader2 size={17} className="animate-spin" />}
                      {isCurrent ? "Paket aktif" : `Pilih ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
