"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Kept in sync with lib/checkin.ts (server-only module) */
const CHECKIN_PREFIX = "UY-CHECKIN:";
export const checkInQrText = (token: string) => `${CHECKIN_PREFIX}${token}`;

const INK = "#1F1A14";
const GOLD = "#8A6424";

/** A check-in QR as an image (renders on the client; a soft placeholder until ready). */
export function CheckInQr({ token, size = 180, className = "" }: { token: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(checkInQrText(token), { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: INK, light: "#FFFFFF" } })
      .then((url) => alive && setSrc(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`QR check-in ${token}`} width={size} height={size} className={`rounded-xl bg-white ${className}`} />
  ) : (
    <span className={`block animate-pulse rounded-xl bg-[#F3EBDB] ${className}`} style={{ width: size, height: size }} aria-hidden />
  );
}

function save(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

const safeName = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "tamu";

export interface QrImage {
  dataUrl: string;
  filename: string;
}

/** Plain QR with the code printed under it. */
export async function downloadStandardQr(token: string, guestName: string) {
  const img = await renderStandardQr(token, guestName);
  save(img.dataUrl, img.filename);
}

export async function renderStandardQr(token: string, guestName: string): Promise<QrImage> {
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, checkInQrText(token), { margin: 2, width: 720, color: { dark: INK, light: "#FFFFFF" } });
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 820;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(qr, 0, 0);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = "600 34px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(guestName, 360, 760, 660);
  ctx.fillStyle = GOLD;
  ctx.font = "500 26px monospace";
  ctx.fillText(token, 360, 800);
  return { dataUrl: c.toDataURL("image/png"), filename: `qr-${safeName(guestName)}.png` };
}

type QrCardInfo = { guestName: string; couple: string; date?: string | null; venue?: string | null; note?: string | null };

/** A small invitation card: couple, guest, date, QR — ready to share on WhatsApp. */
export async function downloadQrCard(token: string, info: QrCardInfo) {
  const img = await renderQrCard(token, info);
  save(img.dataUrl, img.filename);
}

export async function renderQrCard(token: string, info: QrCardInfo): Promise<QrImage> {
  const W = 900;
  const H = 1500;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  // Champagne paper with a thin gold double frame
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FCF8F1");
  bg.addColorStop(1, "#F3E8D3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = "600 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("THE WEDDING OF", W / 2, 190);
  ctx.fillStyle = INK;
  ctx.font = "400 76px 'Bodoni Moda', Georgia, serif";
  ctx.fillText(info.couple, W / 2, 300, W - 160);

  ctx.fillStyle = "#6B5F50";
  ctx.font = "400 30px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Kepada Yth.", W / 2, 410);
  ctx.fillStyle = INK;
  ctx.font = "600 44px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(info.guestName, W / 2, 470, W - 160);
  if (info.note) {
    ctx.fillStyle = GOLD;
    ctx.font = "500 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(info.note, W / 2, 520, W - 160);
  }

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, checkInQrText(token), { margin: 1, width: 520, color: { dark: INK, light: "#FFFFFF" } });
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(W / 2 - 290, 580, 580, 580);
  ctx.drawImage(qr, W / 2 - 260, 610);

  ctx.fillStyle = INK;
  ctx.font = "500 30px monospace";
  ctx.fillText(token, W / 2, 1210);
  ctx.fillStyle = "#6B5F50";
  ctx.font = "400 28px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Tunjukkan QR ini kepada penerima tamu", W / 2, 1270);
  if (info.date) {
    ctx.fillStyle = INK;
    ctx.font = "500 32px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(info.date, W / 2, 1350, W - 160);
  }
  if (info.venue) {
    ctx.fillStyle = "#6B5F50";
    ctx.font = "400 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(info.venue, W / 2, 1400, W - 160);
  }
  return { dataUrl: c.toDataURL("image/png"), filename: `kartu-${safeName(info.guestName)}.png` };
}

/**
 * Sends a guest their QR on WhatsApp. On phones the image itself is shared (system share sheet, pick
 * WhatsApp); elsewhere the image is downloaded and the guest's chat opens with the message ready, so the
 * image only needs to be attached. Returns how it was sent.
 */
export async function shareQrOnWhatsapp(img: QrImage, phone: string | null, message: string): Promise<"shared" | "manual"> {
  const blob = await (await fetch(img.dataUrl)).blob();
  const file = new File([blob], img.filename, { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: message });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }
  save(img.dataUrl, img.filename);
  const digits = (phone ?? "").replace(/\D/g, "");
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  return "manual";
}

/** Generic URL QR preview (used for the printable venue self-check-in standee). */
export function UrlQr({ url, size = 200, className = "" }: { url: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: INK, light: "#FFFFFF" } })
      .then((dataUrl) => alive && setSrc(dataUrl))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, size]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="QR Check-in Kehadiran Tamu" width={size} height={size} className={`rounded-xl bg-white ${className}`} />
  ) : (
    <span className={`block animate-pulse rounded-xl bg-[#F3EBDB] ${className}`} style={{ width: size, height: size }} aria-hidden />
  );
}

/** High-res plain QR PNG for custom acrylic stands or print layouts. */
export async function downloadPlainUrlQr(url: string, couple: string) {
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { margin: 2, width: 820, errorCorrectionLevel: "H", color: { dark: INK, light: "#FFFFFF" } });
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1040;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(qr, 40, 40);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = "600 34px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`Check-in · ${couple}`, 450, 930, 820);
  ctx.fillStyle = GOLD;
  ctx.font = "500 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Pindai QR dengan kamera HP untuk mencatat kehadiran", 450, 982, 820);
  save(c.toDataURL("image/png"), `qr-checkin-polos-${safeName(couple)}.png`);
}

/** Printable luxury A5/A4 tabletop standee poster (1200×1800) placed at the welcome desk. */
export async function downloadVenueQrPoster(
  url: string,
  info: { couple: string; date?: string | null; venue?: string | null },
) {
  const W = 1200;
  const H = 1800;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  // Champagne stationery paper gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FFFDF9");
  bg.addColorStop(0.55, "#FCF8F1");
  bg.addColorStop(1, "#F3E8D3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Elegant double gold frame
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(56, 56, W - 112, H - 112);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(76, 76, W - 152, H - 152);

  // Small corner diamond accents
  const corners = [
    [76, 76],
    [W - 76, 76],
    [76, H - 76],
    [W - 76, H - 76],
  ];
  ctx.fillStyle = GOLD;
  for (const [cx, cy] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("SELAMAT DATANG · BUKU TAMU DIGITAL", W / 2, 210);

  ctx.fillStyle = INK;
  ctx.font = "400 96px 'Bodoni Moda', Georgia, serif";
  ctx.fillText(info.couple, W / 2, 330, W - 200);

  // Subtle horizontal divider
  ctx.strokeStyle = "rgba(138, 100, 36, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 140, 385);
  ctx.lineTo(W / 2 + 140, 385);
  ctx.stroke();

  ctx.fillStyle = "#40372B";
  ctx.font = "500 36px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Pindai QR untuk Mengisi Kehadiran", W / 2, 465);

  ctx.fillStyle = "#6B5F50";
  ctx.font = "400 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Buka kamera HP Anda dan arahkan ke kode QR di bawah ini", W / 2, 515);

  // White framed QR card
  const qrSize = 640;
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, { margin: 1, width: qrSize, errorCorrectionLevel: "H", color: { dark: INK, light: "#FFFFFF" } });

  const boxX = W / 2 - (qrSize + 96) / 2;
  const boxY = 580;
  const boxSize = qrSize + 96;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(boxX, boxY, boxSize, boxSize);
  ctx.strokeStyle = "rgba(138, 100, 36, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxSize, boxSize);
  ctx.drawImage(qrCanvas, boxX + 48, boxY + 48);

  // Step guide
  ctx.fillStyle = GOLD;
  ctx.font = "600 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("1. PINDAI QR   ·   2. KONFIRMASI KEHADIRAN   ·   3. SELESAI", W / 2, 1395, W - 180);

  ctx.fillStyle = "#6B5F50";
  ctx.font = "400 22px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Nama otomatis terisi jika sudah membuka undangan personal", W / 2, 1445, W - 180);

  if (info.date) {
    ctx.fillStyle = INK;
    ctx.font = "500 36px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(info.date, W / 2, 1535, W - 200);
  }
  if (info.venue) {
    ctx.fillStyle = "#6B5F50";
    ctx.font = "400 30px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(info.venue, W / 2, 1588, W - 200);
  }

  ctx.fillStyle = "#8E8268";
  ctx.font = "500 22px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("SatuMoment", W / 2, 1680);

  save(c.toDataURL("image/png"), `poster-qr-checkin-${safeName(info.couple)}.png`);
}
