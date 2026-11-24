"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { toast } from "sonner";
import {
  IconAlertCircle,
  IconCamera,
  IconCameraOff,
  IconCameraRotate,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconKeyboard,
  IconPrinter,
  IconQrcode,
  IconRefresh,
  IconScan,
  IconUserCheck,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, PanelTitle, StatTile } from "@/components/common/studio-ui";
import { UrlQr, downloadPlainUrlQr, downloadVenueQrPoster } from "@/components/common/qr-code";

interface CheckedGuest {
  id: string;
  name: string;
  guests: number;
  companions: string | null;
  note: string | null;
  attendance?: string;
  invitation?: string | null;
  checkedInAt: string;
}

interface ScanOutcome {
  id: string;
  kind: "success" | "already" | "error";
  code: string;
  title: string;
  message: string;
  guest?: CheckedGuest;
  scannedAt: string;
}

interface CheckInStats {
  attendingCount: number;
  attendingPeople: number;
  checkedInCount: number;
  checkedInPeople: number;
}

const SCAN_INTERVAL_MS = 250;
const TAB_STORAGE_KEY = "uy-checkin-tab";
const COOLDOWN_MS = 2500;
const fmt = new Intl.NumberFormat("id-ID");
const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateTimeFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Izin kamera ditolak oleh browser. Izinkan akses kamera di pengaturan situs pada bilah alamat, lalu tekan Coba lagi — atau gunakan input kode manual di bawah.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Kamera tidak ditemukan pada perangkat ini. Kamu tetap bisa mencatat kedatangan tamu menggunakan input kode manual.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang memakai kamera lalu coba lagi.";
  }
  return "Tidak dapat mengakses kamera perangkat ini. Pastikan situs dibuka lewat HTTPS/localhost atau gunakan input kode manual.";
}

export function CheckInScanner({
  invitationTitle,
  couple,
  slug,
  baseUrl,
  eventDate,
  venue,
  initialStats,
  recentCheckedIn,
}: {
  invitationTitle: string;
  couple: string;
  slug: string;
  baseUrl: string;
  eventDate: string | null;
  venue: string | null;
  initialStats: CheckInStats;
  recentCheckedIn: CheckedGuest[];
}) {
  const router = useRouter();
  const [tab, setTabState] = useState<"print" | "scanner">("print");
  const setTab = useCallback((next: "print" | "scanner") => {
    setTabState(next);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {}
  }, []);

  // Welcome-desk staff reopen this page on their phone: `?mode=scan` or their last tab opens the scanner directly
  useEffect(() => {
    let initial: string | null = new URLSearchParams(window.location.search).get("mode") === "scan" ? "scanner" : null;
    if (!initial) {
      try {
        initial = localStorage.getItem(TAB_STORAGE_KEY);
      } catch {}
    }
    if (initial === "scanner") setTabState("scanner");
  }, []);
  const [stats, setStats] = useState<CheckInStats>(initialStats);
  const [recent, setRecent] = useState<CheckedGuest[]>(recentCheckedIn);
  const [downloading, setDownloading] = useState<"poster" | "plain" | null>(null);
  const [origin, setOrigin] = useState(() => baseUrl.replace(/\/$/, ""));

  // Camera scanner state (Tab 2: Mode Panitia)
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cooldown, setCooldown] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<ScanOutcome | null>(null);
  const [history, setHistory] = useState<ScanOutcome[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const cooldownRef = useRef(false);

  // Sync fresh server props when user clicks "Segarkan"
  useEffect(() => {
    setStats(initialStats);
    setRecent(recentCheckedIn);
  }, [initialStats, recentCheckedIn]);

  // Use real current browser origin for QR URLs (so localhost testing works on the same host too)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  const checkInUrl = slug ? `${origin}/hadir/${slug}` : "";

  const clearCooldown = useCallback(() => {
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    cooldownRef.current = false;
    setCooldown(false);
  }, []);

  const stopCamera = useCallback(() => {
    clearCooldown();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
    setCameraError(null);
  }, [clearCooldown]);

  // Stop camera automatically if user switches away from scanner tab
  useEffect(() => {
    if (tab !== "scanner" && streamRef.current) {
      stopCamera();
    }
  }, [tab, stopCamera]);

  const submitCode = useCallback(
    async (rawCode: string, source: "camera" | "manual") => {
      const trimmed = rawCode.trim();
      if (!trimmed || busyRef.current) return;

      busyRef.current = true;
      setSubmitting(true);

      const nowIso = new Date().toISOString();
      const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      try {
        const res = await fetch("/api/user/rsvp/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });

        const payload = (await res.json().catch(() => ({}))) as {
          already?: boolean;
          guest?: CheckedGuest;
          error?: string;
          message?: string;
        };

        if (!res.ok) {
          const outcome: ScanOutcome = {
            id: entryId,
            kind: "error",
            code: trimmed,
            title: payload.error === "NOT_FOUND" ? "Bukan tamu undangan ini" : "Kode QR tidak dikenali",
            message: payload.message || "Periksa kembali kode QR tamu dan coba lagi.",
            scannedAt: nowIso,
          };
          setLastOutcome(outcome);
          setHistory((prev) => [outcome, ...prev].slice(0, 30));
          if (source === "manual") toast.error(outcome.message);
        } else if (payload.already && payload.guest) {
          const outcome: ScanOutcome = {
            id: entryId,
            kind: "already",
            code: trimmed,
            title: "Sudah check-in sebelumnya",
            message: `${payload.guest.name} tercatat sudah hadir pada ${dateTimeFmt.format(new Date(payload.guest.checkedInAt))}.`,
            guest: payload.guest,
            scannedAt: nowIso,
          };
          setLastOutcome(outcome);
          setHistory((prev) => [outcome, ...prev].slice(0, 30));
          if (source === "manual") toast.info(`${payload.guest.name} sudah check-in sebelumnya`);
        } else if (payload.guest) {
          const guest = payload.guest;
          const outcome: ScanOutcome = {
            id: entryId,
            kind: "success",
            code: trimmed,
            title: "Check-in berhasil",
            message: `Selamat datang, ${guest.name} (${guest.guests} orang).`,
            guest,
            scannedAt: nowIso,
          };
          setLastOutcome(outcome);
          setHistory((prev) => [outcome, ...prev].slice(0, 30));
          setRecent((prev) => [guest, ...prev.filter((g) => g.id !== guest.id)].slice(0, 20));
          if (!guest.invitation || guest.invitation === invitationTitle) {
            setStats((prev) => ({
              ...prev,
              checkedInCount: prev.checkedInCount + 1,
              checkedInPeople: prev.checkedInPeople + (guest.guests || 1),
            }));
          }
          toast.success(`${guest.name} berhasil check-in`);
          // Short buzz so staff know the scan landed without looking at the screen
          if (source === "camera") navigator.vibrate?.(120);
        }
      } catch {
        const outcome: ScanOutcome = {
          id: entryId,
          kind: "error",
          code: trimmed,
          title: "Koneksi terganggu",
          message: "Gagal menghubungi server. Periksa koneksi internet lalu coba pindai lagi.",
          scannedAt: nowIso,
        };
        setLastOutcome(outcome);
        setHistory((prev) => [outcome, ...prev].slice(0, 30));
        toast.error("Gagal memproses check-in");
      } finally {
        busyRef.current = false;
        setSubmitting(false);
        if (source === "camera") {
          cooldownRef.current = true;
          setCooldown(true);
          if (cooldownTimerRef.current !== null) window.clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = window.setTimeout(() => {
            cooldownRef.current = false;
            setCooldown(false);
            cooldownTimerRef.current = null;
          }, COOLDOWN_MS);
        }
      }
    },
    [invitationTitle],
  );

  const startCamera = useCallback(
    async (mode: "environment" | "user" = facingMode) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraState("error");
        setCameraError("Kamera hanya tersedia di browser modern melalui HTTPS atau localhost. Gunakan input kode manual sebagai cadangan.");
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      clearCooldown();
      setCameraError(null);
      setCameraState("starting");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setFacingMode(mode);
        setCameraState("active");
      } catch (err) {
        setCameraState("error");
        setCameraError(cameraErrorMessage(err));
      }
    },
    [clearCooldown, facingMode],
  );

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) window.clearTimeout(cooldownTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "active") return;
    const timer = window.setInterval(() => {
      if (busyRef.current || cooldownRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

      const maxDim = 720;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
      const w = Math.floor(video.videoWidth * scale);
      const h = Math.floor(video.videoHeight * scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const decoded = jsQR(imageData.data, w, h, { inversionAttempts: "dontInvert" });
      if (decoded?.data) {
        void submitCode(decoded.data, "camera");
      }
    }, SCAN_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [cameraState, submitCode]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await submitCode(manualCode, "manual");
    setManualCode("");
  };

  const handleDownloadPoster = async () => {
    if (!checkInUrl) return toast.error("Slug undangan belum diatur");
    setDownloading("poster");
    try {
      await downloadVenueQrPoster(checkInUrl, { couple, date: eventDate, venue });
      toast.success("Poster QR siap cetak berhasil diunduh");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPlain = async () => {
    if (!checkInUrl) return toast.error("Slug undangan belum diatur");
    setDownloading("plain");
    try {
      await downloadPlainUrlQr(checkInUrl, couple);
      toast.success("QR polos berhasil diunduh");
    } finally {
      setDownloading(null);
    }
  };

  const copyCheckInUrl = () => {
    if (!checkInUrl) return;
    navigator.clipboard.writeText(checkInUrl);
    toast.success("Link halaman check-in tamu disalin");
  };

  const remainingRsvp = Math.max(0, stats.attendingCount - stats.checkedInCount);

  return (
    <div className="space-y-6">
      {/* Live attendance metrics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile
          dense
          label="Tamu sudah hadir"
          value={fmt.format(stats.checkedInPeople)}
          hint={`dari ${fmt.format(stats.attendingPeople)} orang terkonfirmasi`}
          icon={IconUsersGroup}
        />
        <StatTile
          dense
          label="Sudah check-in"
          value={fmt.format(stats.checkedInCount)}
          hint={`dari ${fmt.format(stats.attendingCount)} konfirmasi hadir`}
          icon={IconUserCheck}
          delay={60}
        />
        <StatTile
          dense
          label="Menunggu kedatangan"
          value={fmt.format(remainingRsvp)}
          hint="RSVP belum check-in"
          icon={IconClock}
          delay={120}
        />
      </div>

      {/* Mode Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "print" | "scanner")} className="w-full">
        <TabsList className="mb-5 h-auto max-w-full flex-wrap rounded-full bg-[#F6EEDF] p-1 sm:w-fit">
          <TabsTrigger
            value="print"
            className="rounded-full px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm sm:px-5 sm:text-sm"
          >
            <IconPrinter className="mr-1.5 size-4 sm:mr-2" /> QR Cetak Meja Tamu
          </TabsTrigger>
          <TabsTrigger
            value="scanner"
            className="rounded-full px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm sm:px-5 sm:text-sm"
          >
            <IconScan className="mr-1.5 size-4 sm:mr-2" /> Scan QR Panitia
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PRINTABLE VENUE QR (GUEST SELF CHECK-IN) */}
        <TabsContent value="print" className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            {/* Printable QR Standee Studio */}
            <Panel className="p-5 sm:p-6">
              <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
                {/* Visual Standee Preview */}
                <div className="mx-auto w-full max-w-[260px] rounded-2xl border border-[#E6D7BC] bg-[linear-gradient(180deg,#FFFDF9_0%,#FCF8F1_60%,#F3E8D3_100%)] p-3 shadow-[0_18px_40px_-24px_rgba(26,21,16,0.35)]">
                  <div className="flex flex-col items-center rounded-xl border border-[#8A6424]/45 px-4 py-5 text-center">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.24em] text-[#8A6424]">
                      Selamat Datang · Buku Tamu
                    </span>
                    <p className="mt-1.5 max-w-full truncate font-(family-name:--font-landing-display) text-xl text-[#1F1A14]">
                      {couple}
                    </p>
                    <span className="my-2.5 h-px w-12 bg-[#8A6424]/40" />
                    <div className="rounded-xl border border-[#EDE3CF] bg-white p-2.5 shadow-2xs">
                      {checkInUrl ? (
                        <UrlQr url={checkInUrl} size={160} />
                      ) : (
                        <div className="flex size-40 items-center justify-center rounded-lg bg-[#FCF8F1] text-xs text-[#8E8268]">
                          Slug belum diatur
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[11px] font-medium text-[#1F1A14]">Pindai QR untuk isi kehadiran</p>
                    {eventDate && <p className="mt-1 truncate text-[10px] text-[#6B5F50]">{eventDate}</p>}
                    {venue && <p className="max-w-full truncate text-[10px] text-[#8E8268]">{venue}</p>}
                  </div>
                </div>

                {/* Controls & Guide */}
                <div className="min-w-0 space-y-5">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6EEDF] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424]">
                      Paling praktis · Tamu scan sendiri
                    </span>
                    <h2 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14] sm:text-3xl">
                      QR Cetak untuk Meja Tamu
                    </h2>
                    <p className="text-sm leading-relaxed text-[#6B5F50]">
                      Cetak poster ini lalu pajang di meja penerima tamu (standing akrilik / bingkai A5). Tamu cukup arahkan kamera HP-nya, tulis nama &amp; jumlah orang, dan kehadiran langsung masuk ke dashboard tanpa perlu panitia membuka akunmu.
                    </p>
                  </div>

                  {/* Download buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      type="button"
                      variant="gold"
                      disabled={!checkInUrl || downloading !== null}
                      onClick={handleDownloadPoster}
                      className="h-11 px-5"
                    >
                      <IconDownload size={16} />
                      {downloading === "poster" ? "Menyiapkan poster…" : "Unduh Poster Siap Cetak"}
                    </Button>
                    <Button
                      type="button"
                      variant="ink"
                      disabled={!checkInUrl || downloading !== null}
                      onClick={handleDownloadPlain}
                      className="h-11 px-5"
                    >
                      <IconQrcode size={16} />
                      {downloading === "plain" ? "Menyiapkan QR…" : "Unduh QR Polos"}
                    </Button>
                  </div>

                  {/* Shareable / testable link */}
                  {checkInUrl && (
                    <div className="space-y-2 rounded-2xl border border-[#EDE3CF] bg-[#FCF8F1] p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8E8268]">
                        Tautan tujuan QR check-in
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-lg border border-[#E9DDC6] bg-white px-3 py-2 text-xs text-[#1F1A14]">
                          {checkInUrl}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyCheckInUrl}
                          className="h-9 rounded-full border-[#E9DDC6] bg-white px-3.5 text-xs"
                        >
                          <IconCopy size={14} /> Salin
                        </Button>
                        <a
                          href={`/hadir/${slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "h-9 rounded-full border-[#E9DDC6] bg-white px-3.5 text-xs",
                          })}
                        >
                          <IconExternalLink size={14} /> Coba halaman
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 3 quick steps */}
                  <ol className="grid grid-cols-1 gap-2 text-xs text-[#6B5F50] sm:grid-cols-3">
                    <li className="rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/60 p-3">
                      <span className="font-semibold text-[#8A6424]">1. Unduh &amp; cetak</span>
                      <p className="mt-0.5">Cetak ukuran A5/A4 atau masukkan QR polos ke desain akrilikmu.</p>
                    </li>
                    <li className="rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/60 p-3">
                      <span className="font-semibold text-[#8A6424]">2. Tamu scan QR</span>
                      <p className="mt-0.5">Tamu undangan personal otomatis dikenali (1 ketuk hadir); tamu grup cukup tulis namanya.</p>
                    </li>
                    <li className="rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/60 p-3">
                      <span className="font-semibold text-[#8A6424]">3. Tercatat otomatis</span>
                      <p className="mt-0.5">Nama, jumlah tamu, dan ucapan langsung muncul di Buku Tamu.</p>
                    </li>
                  </ol>
                </div>
              </div>
            </Panel>

            {/* Right: Live recent check-ins */}
            <Panel className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Tamu yang Hadir</h2>
                  <p className="text-xs text-[#6B5F50]">Daftar tamu terbaru yang sudah check-in.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.refresh();
                    toast.success("Daftar kehadiran diperbarui");
                  }}
                  className="h-9 rounded-full border-[#E9DDC6] bg-white px-3 text-xs"
                >
                  <IconRefresh size={14} /> Segarkan
                </Button>
              </div>

              {recent.length > 0 ? (
                <ul className="divide-y divide-[#F3EBDB]">
                  {recent.slice(0, 10).map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#1F1A14]">{g.name}</p>
                        <p className="text-xs text-[#6B5F50]">
                          {g.guests} orang
                          {g.companions ? ` · ${g.companions}` : ""}
                          {g.note ? ` · ${g.note}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#EEF4EA] px-2.5 py-1 text-[11px] font-medium text-[#3F6B3A]">
                        {dateTimeFmt.format(new Date(g.checkedInAt))}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-[#E9DDC6] px-4 py-10 text-center text-sm text-[#6B5F50]">
                  <IconUserCheck size={26} className="mx-auto mb-2 text-[#D9B56A]" />
                  Belum ada tamu yang check-in. Setelah tamu memindai QR meja tamu, nama mereka akan langsung muncul di sini.
                </div>
              )}
            </Panel>
          </div>
        </TabsContent>

        {/* TAB 2: STAFF CAMERA SCANNER (OPTIONAL) */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {/* Left: Camera scanner + Result card */}
            <div className="space-y-5">
              <Panel className="p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Pemindai QR Panitia</h2>
                    <p className="mt-0.5 text-xs text-[#6B5F50]">Opsional bila penerima tamu memindai kartu QR pribadi milik masing-masing tamu.</p>
                  </div>
                  {cameraState === "active" && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void startCamera(facingMode === "environment" ? "user" : "environment")}
                        className="h-9 rounded-full border-[#E9DDC6]"
                        title="Ganti kamera depan/belakang"
                      >
                        <IconCameraRotate size={15} /> Ganti kamera
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={stopCamera} className="h-9 rounded-full border-[#E9DDC6] text-[#9A3B2E] hover:bg-[#F6E7E4]">
                        <IconCameraOff size={15} /> Matikan
                      </Button>
                    </div>
                  )}
                </div>

                {/* Viewfinder */}
                {/* Square on phones (held upright at the welcome desk), landscape from sm up */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#E9DDC6] bg-[#1A1510] sm:aspect-[4/3]">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`h-full w-full object-cover transition-opacity duration-300 ${cameraState === "active" ? "opacity-100" : "opacity-0"}`}
                  />
                  <canvas ref={canvasRef} className="hidden" aria-hidden />

                  {cameraState === "active" && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
                      <div className="relative size-48 sm:size-56">
                        <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-[3px] border-t-[3px] border-[#E6CB86]" />
                        <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-[3px] border-t-[3px] border-[#E6CB86]" />
                        <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-[3px] border-l-[3px] border-[#E6CB86]" />
                        <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-[3px] border-r-[3px] border-[#E6CB86]" />
                      </div>
                      <div className="mt-4 flex items-center gap-2 rounded-full bg-[#1A1510]/80 px-3.5 py-1.5 text-xs text-[#F6EEDD] backdrop-blur-sm">
                        <span className={`size-2 rounded-full ${cooldown ? "bg-[#D9B56A]" : "animate-pulse bg-emerald-400"}`} />
                        {cooldown ? "Menunggu 2,5 detik sebelum pindai berikutnya…" : "Siap memindai QR tamu"}
                      </div>
                    </div>
                  )}

                  {cameraState !== "active" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#F6EEDD]">
                      <div aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0 opacity-60" />
                      <div className="relative max-w-sm space-y-4">
                        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#D9B56A]/35 bg-white/5 text-[#D9B56A]">
                          {cameraState === "error" ? <IconAlertCircle size={26} /> : <IconScan size={26} />}
                        </span>

                        {cameraState === "starting" && (
                          <>
                            <p className="font-(family-name:--font-landing-display) text-2xl">Menyalakan kamera…</p>
                            <p className="text-xs leading-relaxed text-[#CDBF9F]">Setujui permintaan izin kamera di browser jika muncul jendela konfirmasi.</p>
                          </>
                        )}

                        {cameraState === "idle" && (
                          <>
                            <p className="font-(family-name:--font-landing-display) text-2xl">Siap menerima tamu</p>
                            <p className="text-xs leading-relaxed text-[#CDBF9F]">
                              Aktifkan kamera belakang perangkat untuk memindai QR pribadi tamu dari kartu RSVP.
                            </p>
                            <Button type="button" variant="gold" onClick={() => void startCamera("environment")} className="h-11 px-6">
                              <IconCamera size={17} /> Aktifkan kamera
                            </Button>
                          </>
                        )}

                        {cameraState === "error" && (
                          <>
                            <p className="font-(family-name:--font-landing-display) text-2xl">Kamera tidak tersedia</p>
                            <p className="text-xs leading-relaxed text-[#E9DFCB]">{cameraError}</p>
                            <Button type="button" variant="gold" onClick={() => void startCamera(facingMode)} className="h-10 px-5">
                              <IconRefresh size={16} /> Coba lagi
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {cooldown && cameraState === "active" && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FCF8F1] px-4 py-2.5 text-xs text-[#6B5F50]">
                    <span>Jeda singkat agar kode yang sama tidak terpindai ganda.</span>
                    <button type="button" onClick={clearCooldown} className="font-medium text-[#8A6424] hover:underline">
                      Pindai lagi sekarang
                    </button>
                  </div>
                )}
              </Panel>

              {lastOutcome && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(26,21,16,.04)] animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    lastOutcome.kind === "success"
                      ? "border-[#C8DDC2] bg-[#EEF4EA] text-[#284724]"
                      : lastOutcome.kind === "already"
                        ? "border-[#E6D4AE] bg-[#F6EEDF] text-[#6A4C18]"
                        : "border-[#E9C9C3] bg-[#F6E7E4] text-[#7E2C22]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                        lastOutcome.kind === "success"
                          ? "bg-[#3F6B3A] text-white"
                          : lastOutcome.kind === "already"
                            ? "bg-[#8A6424] text-white"
                            : "bg-[#9A3B2E] text-white"
                      }`}
                    >
                      {lastOutcome.kind === "success" ? <IconCheck size={22} stroke={2.4} /> : lastOutcome.kind === "already" ? <IconCircleCheck size={22} /> : <IconX size={22} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{lastOutcome.title}</p>
                        <span className="text-xs opacity-75">{timeFmt.format(new Date(lastOutcome.scannedAt))}</span>
                      </div>
                      {lastOutcome.guest ? (
                        <>
                          <p className="mt-1 font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">{lastOutcome.guest.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-white/80 px-2.5 py-1 font-medium text-[#1F1A14]">{lastOutcome.guest.guests} orang</span>
                            {lastOutcome.guest.note && (
                              <span className="rounded-full bg-white/80 px-2.5 py-1 font-medium text-[#8A6424]">Catatan: {lastOutcome.guest.note}</span>
                            )}
                            {lastOutcome.guest.invitation && (
                              <span className="rounded-full bg-white/60 px-2.5 py-1 text-[#40372B]">{lastOutcome.guest.invitation}</span>
                            )}
                          </div>
                          {lastOutcome.guest.companions && <p className="mt-2 text-xs opacity-90">Pendamping: {lastOutcome.guest.companions}</p>}
                          {lastOutcome.kind === "already" && (
                            <p className="mt-1.5 text-xs opacity-90">
                              Pertama check-in: {dateTimeFmt.format(new Date(lastOutcome.guest.checkedInAt))}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-sm">{lastOutcome.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Manual fallback + Session scan history */}
            <div className="space-y-5">
              <Panel className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F6EEDF] text-[#8A6424]">
                    <IconKeyboard size={20} stroke={1.6} />
                  </span>
                  <div>
                    <h2 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Input Kode Manual</h2>
                    <p className="text-xs text-[#6B5F50]">Cadangan bila kamera tidak tersedia atau QR tamu buram.</p>
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
                  <label className="block space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B5F50]">Kode QR tamu</span>
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Contoh: UY-CHECKIN:AB3D9K... atau AB3D9K..."
                      className="h-11 rounded-xl border-[#E9DDC6] bg-[#FCF8F1] font-mono text-sm uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
                      autoComplete="off"
                      disabled={submitting}
                    />
                  </label>
                  <Button type="submit" variant="ink" disabled={submitting || !manualCode.trim()} className="h-11 w-full">
                    <IconQrcode size={17} /> {submitting ? "Memeriksa kode…" : "Catat check-in"}
                  </Button>
                </form>
              </Panel>

              <Panel className="p-5 sm:p-6">
                <PanelTitle>Riwayat scan sesi ini</PanelTitle>
                {history.length > 0 ? (
                  <ul className="divide-y divide-[#F3EBDB]">
                    {history.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-[#1F1A14]">{item.guest?.name ?? item.title}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                item.kind === "success"
                                  ? "bg-[#EEF4EA] text-[#3F6B3A]"
                                  : item.kind === "already"
                                    ? "bg-[#F6EEDF] text-[#8A6424]"
                                    : "bg-[#F6E7E4] text-[#9A3B2E]"
                              }`}
                            >
                              {item.kind === "success" ? "Berhasil" : item.kind === "already" ? "Sudah hadir" : "Gagal"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#6B5F50]">
                            {item.guest
                              ? `${item.guest.guests} orang${item.guest.note ? ` · ${item.guest.note}` : ""}`
                              : item.message}
                          </p>
                        </div>
                        <span className="shrink-0 tabular-nums text-[11px] text-[#8E8268]">{timeFmt.format(new Date(item.scannedAt))}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E9DDC6] px-4 py-7 text-center text-sm text-[#6B5F50]">
                    Belum ada pemindaian di sesi ini. Hasil scan QR maupun input manual akan tercatat di sini.
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
