import ExcelJS from "exceljs";
import { readSpreadsheetRows, styleHeader } from "@/lib/excel";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";

/**
 * Columns of the guest list Excel template — mirrors the manual "Tambah Tamu" dialog 1-to-1.
 * Legacy column names ("Nama", "WhatsApp", "Grup", "VIP") remain accepted when importing older files.
 */
export const GUEST_IMPORT_COLUMNS = [
  "Jenis Penerima",
  "Tipe Tamu",
  "Sapaan",
  "Nama Tamu *",
  "Nomor WhatsApp",
  "Label Grup",
  "Jumlah Tamu",
  "RSVP",
  "Acara",
  "Catatan",
] as const;

export const DEFAULT_GUEST_LABELS = ["Keluarga", "Teman Kantor", "Teman Kuliah", "Blast", "Manual"] as const;
export const DEFAULT_GUEST_GREETINGS = ["Bapak/Ibu", "Saudara/i", "Kak", "Dear"] as const;
export const MAX_GUEST_IMPORT_ROWS = 2000;

export interface GuestImportRow {
  name: string;
  recipientType: "PERSONAL" | "GROUP";
  guestType: "REGULAR" | "VIP";
  greeting: string | null;
  phone: string | null;
  label: string | null;
  maxGuests: number;
  rsvpEnabled: boolean;
  eventName: string | null;
  note: string | null;
}

export interface GuestImportResult {
  guests: GuestImportRow[];
  errors: { row: number; message: string }[];
}

export interface GuestTemplateOptions {
  eventOptions?: string[];
  labelOptions?: string[];
}

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max) || null;

function normHeader(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCol(headers: string[], aliases: string[]): number {
  for (const a of aliases) {
    const idx = headers.indexOf(a);
    if (idx >= 0) return idx;
  }
  return -1;
}

export async function parseGuestFile(buffer: ArrayBuffer, filename: string): Promise<GuestImportResult> {
  const rows = await readSpreadsheetRows(buffer, filename, "tamu");
  const guests: GuestImportRow[] = [];
  const errors: GuestImportResult["errors"] = [];
  if (!rows.length) return { guests, errors: [{ row: 1, message: "File kosong" }] };

  const header = rows[0].map(normHeader);
  const col = {
    recipientType: findCol(header, ["jenis penerima", "penerima"]),
    guestType: findCol(header, ["tipe tamu", "vip"]),
    greeting: findCol(header, ["sapaan"]),
    name: findCol(header, ["nama tamu", "nama"]),
    phone: findCol(header, ["nomor whatsapp", "no. whatsapp", "whatsapp", "no wa", "telepon"]),
    label: findCol(header, ["label grup", "grup", "label"]),
    maxGuests: findCol(header, ["jumlah tamu", "kuota tamu"]),
    rsvp: findCol(header, ["rsvp", "status rsvp"]),
    eventName: findCol(header, ["acara", "sesi acara"]),
    note: findCol(header, ["catatan"]),
  };

  if (col.name < 0) {
    return {
      guests,
      errors: [{ row: 1, message: 'Kolom "Nama Tamu" atau "Nama" tidak ditemukan. Gunakan template daftar tamu terbaru.' }],
    };
  }

  const body = rows.slice(1);
  if (body.length > MAX_GUEST_IMPORT_ROWS) {
    return { guests, errors: [{ row: 1, message: `Maksimal ${MAX_GUEST_IMPORT_ROWS} tamu per file` }] };
  }

  const get = (r: unknown[], idx: number) => (idx >= 0 ? r[idx] : undefined);

  body.forEach((r, i) => {
    const rowNo = i + 2;
    if (r.every((c) => String(c ?? "").trim() === "")) return;

    const name = text(get(r, col.name), 120);
    if (!name) return errors.push({ row: rowNo, message: "Nama Tamu wajib diisi" });

    const rawPhone = String(get(r, col.phone) ?? "").trim();
    const phone = rawPhone ? normalizePhoneDigits(rawPhone) : "";
    if (rawPhone && (!phone || !isValidPhoneDigits(phone))) {
      return errors.push({ row: rowNo, message: `Nomor WhatsApp "${rawPhone}" tidak valid` });
    }

    const rawCount = String(get(r, col.maxGuests) ?? "").trim();
    const maxGuests = rawCount ? Number(rawCount) : 1;
    if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) {
      return errors.push({ row: rowNo, message: "Jumlah Tamu harus angka bulat 1–20" });
    }

    const rawRecipient = String(get(r, col.recipientType) ?? "").trim().toLowerCase();
    const recipientType: "PERSONAL" | "GROUP" =
      rawRecipient.startsWith("grup") || rawRecipient.startsWith("group") ? "GROUP" : "PERSONAL";

    const rawGuestType = String(get(r, col.guestType) ?? "").trim().toLowerCase();
    const guestType: "REGULAR" | "VIP" =
      ["ya", "y", "yes", "vip", "1", "true"].includes(rawGuestType) || rawGuestType.startsWith("vip")
        ? "VIP"
        : "REGULAR";

    const rawRsvp = String(get(r, col.rsvp) ?? "").trim().toLowerCase();
    const rsvpEnabled = !["nonaktif", "tidak", "no", "false", "0", "off"].includes(rawRsvp);

    guests.push({
      name,
      recipientType,
      guestType,
      greeting: text(get(r, col.greeting), 40),
      phone: phone || null,
      label: text(get(r, col.label), 40),
      maxGuests,
      rsvpEnabled,
      eventName: text(get(r, col.eventName), 80),
      note: text(get(r, col.note), 200),
    });
  });

  return { guests, errors };
}

/**
 * Formatted Excel template matching the manual "Tambah Tamu" dialog 1-to-1,
 * with native dropdown Data Validations (locale-safe hidden sheet references),
 * text formatting for WhatsApp numbers, integer 1–20 validation, and instructions.
 */
export async function buildGuestTemplate(options: GuestTemplateOptions = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SatuMoment";
  wb.created = new Date();

  const events = Array.from(new Set(["Umum", ...(options.eventOptions ?? ["Akad Nikah", "Resepsi"]), "Livestream"].filter(Boolean)));
  const labels = Array.from(new Set([...DEFAULT_GUEST_LABELS, ...(options.labelOptions ?? [])].filter(Boolean)));
  const recipientTypes = ["Personal", "Grup"];
  const guestTypes = ["Reguler", "VIP"];
  const greetings = [...DEFAULT_GUEST_GREETINGS];
  const rsvpStates = ["Aktif", "Nonaktif"];

  // 1. Main worksheet
  const ws = wb.addWorksheet("Tamu", {
    properties: { defaultRowHeight: 22 },
  });
  ws.columns = [
    { header: "Jenis Penerima", key: "recipientType", width: 17 },
    { header: "Tipe Tamu", key: "guestType", width: 14 },
    { header: "Sapaan", key: "greeting", width: 16 },
    { header: "Nama Tamu *", key: "name", width: 28 },
    { header: "Nomor WhatsApp", key: "phone", width: 20, style: { numFmt: "@" } },
    { header: "Label Grup", key: "label", width: 18 },
    { header: "Jumlah Tamu", key: "maxGuests", width: 14, style: { numFmt: "0" } },
    { header: "RSVP", key: "rsvp", width: 13 },
    { header: "Acara", key: "eventName", width: 18 },
    { header: "Catatan", key: "note", width: 30 },
  ];
  styleHeader(ws);
  ws.getRow(1).height = 26;
  ws.autoFilter = "A1:J1";

  // Subtle gold accent on the required "Nama Tamu *" header cell
  ws.getCell("D1").font = { bold: true, color: { argb: "FFE6CB86" } };

  // Two realistic sample rows matching the manual dialog defaults
  const sampleEvent = events.find((e) => e !== "Umum" && e !== "Livestream") ?? events[0] ?? "Umum";
  const sampleRows = [
    {
      recipientType: "Personal",
      guestType: "VIP",
      greeting: "Bapak/Ibu",
      name: "Budi Santoso",
      phone: "081234567890",
      label: "Keluarga",
      maxGuests: 2,
      rsvp: "Aktif",
      eventName: sampleEvent,
      note: "Meja VIP 2",
    },
    {
      recipientType: "Grup",
      guestType: "Reguler",
      greeting: "Saudara/i",
      name: "Tim Kantor PT Maju",
      phone: "",
      label: "Teman Kantor",
      maxGuests: 5,
      rsvp: "Aktif",
      eventName: "Umum",
      note: "Undangan grup kantor",
    },
  ];
  for (const rowData of sampleRows) {
    const row = ws.addRow(rowData);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCF8F1" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE9DDC6" } },
        bottom: { style: "thin", color: { argb: "FFE9DDC6" } },
        left: { style: "thin", color: { argb: "FFF1E8D6" } },
        right: { style: "thin", color: { argb: "FFF1E8D6" } },
      };
      cell.alignment = { vertical: "middle", horizontal: colNumber === 7 ? "center" : "left" };
    });
  }

  // 2. Hidden reference sheet for dropdown lists (range references work in every Excel locale, including id-ID)
  const ref = wb.addWorksheet("_Pilihan", { state: "veryHidden" });
  const writeRefCol = (colLetter: string, header: string, values: string[]) => {
    ref.getCell(`${colLetter}1`).value = header;
    values.forEach((v, i) => {
      ref.getCell(`${colLetter}${i + 2}`).value = v;
    });
    return `'_Pilihan'!$${colLetter}$2:$${colLetter}$${values.length + 1}`;
  };
  const recipientRange = writeRefCol("A", "Jenis Penerima", recipientTypes);
  const guestTypeRange = writeRefCol("B", "Tipe Tamu", guestTypes);
  const greetingRange = writeRefCol("C", "Sapaan", greetings);
  const labelRange = writeRefCol("D", "Label Grup", labels);
  const rsvpRange = writeRefCol("E", "RSVP", rsvpStates);
  const eventRange = writeRefCol("F", "Acara", events);

  // Apply Excel validations across rows 2..501 (lightweight file size, covers typical wedding lists cleanly)
  const MAX_VALIDATED_ROW = 501;
  for (let r = 2; r <= MAX_VALIDATED_ROW; r++) {
    ws.getCell(`A${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [recipientRange],
      showInputMessage: true,
      promptTitle: "Jenis Penerima",
      prompt: "Pilih Personal (1 penerima) atau Grup (keluarga/komunitas).",
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Pilihan tidak valid",
      error: "Pilih Personal atau Grup dari daftar.",
    };
    ws.getCell(`B${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [guestTypeRange],
      showInputMessage: true,
      promptTitle: "Tipe Tamu",
      prompt: "Pilih Reguler atau VIP (penanda emas di daftar tamu).",
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Pilihan tidak valid",
      error: "Pilih Reguler atau VIP dari daftar.",
    };
    ws.getCell(`C${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [greetingRange],
      showInputMessage: true,
      promptTitle: "Sapaan (opsional)",
      prompt: "Pilih dari daftar atau ketik sendiri, mis. Kepada Yth., Bapak, Ibu.",
      showErrorMessage: false,
    };
    ws.getCell(`E${r}`).numFmt = "@";
    ws.getCell(`F${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [labelRange],
      showInputMessage: true,
      promptTitle: "Label Grup (opsional)",
      prompt: "Pilih dari daftar atau ketik label grup baru sendiri.",
      showErrorMessage: false,
    };
    ws.getCell(`G${r}`).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [1, 20],
      showInputMessage: true,
      promptTitle: "Jumlah Tamu",
      prompt: "Masukkan angka 1 sampai 20 (kosong = 1 orang).",
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Jumlah tidak valid",
      error: "Jumlah tamu harus angka bulat antara 1 dan 20.",
    };
    ws.getCell(`H${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [rsvpRange],
      showInputMessage: true,
      promptTitle: "Status RSVP",
      prompt: "Pilih Aktif (tamu bisa isi RSVP) atau Nonaktif.",
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Pilihan tidak valid",
      error: "Pilih Aktif atau Nonaktif dari daftar.",
    };
    ws.getCell(`I${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [eventRange],
      showInputMessage: true,
      promptTitle: "Acara (opsional)",
      prompt: "Pilih sesi acara dari daftar undangan atau ketik manual.",
      showErrorMessage: false,
    };
  }

  // 3. Instructions sheet
  const help = wb.addWorksheet("Petunjuk");
  help.columns = [{ width: 20 }, { width: 16 }, { width: 72 }];
  [
    ["Kolom", "Tipe Input", "Keterangan"],
    ["Jenis Penerima", "Dropdown", "Opsional (default: Personal). Pilih Personal untuk 1 penerima atau Grup untuk keluarga/komunitas."],
    ["Tipe Tamu", "Dropdown", "Opsional (default: Reguler). Pilih VIP untuk memberi penanda emas khusus."],
    ["Sapaan", "Dropdown / Teks", "Opsional. Bisa pilih Bapak/Ibu, Saudara/i, Kak, Dear, atau ketik sapaan sendiri."],
    ["Nama Tamu *", "Teks (Wajib)", "Wajib diisi. Nama yang tampil di sampul undangan tamu."],
    ["Nomor WhatsApp", "Teks (@)", "Opsional. Contoh: 081234567890 atau 6281234567890. Kolom sudah diformat teks agar angka 0 tidak hilang."],
    ["Label Grup", "Dropdown / Teks", `Opsional. Pilih (${labels.join(", ")}) atau ketik label baru sendiri.`],
    ["Jumlah Tamu", "Angka (1–20)", "Opsional (default: 1). Batas maksimal tamu untuk 1 undangan ini."],
    ["RSVP", "Dropdown", "Opsional (default: Aktif). Pilih Aktif agar tamu bisa mengisi konfirmasi kehadiran, atau Nonaktif."],
    ["Acara", "Dropdown / Teks", `Opsional. Pilihan sesuai undangan Anda: ${events.join(", ")}.`],
    ["Catatan", "Teks", "Opsional. Contoh: Meja VIP 2, rekan kerja ayah."],
    ["Info Penting", "-", `Maksimal ${MAX_GUEST_IMPORT_ROWS} tamu per file. Hapus 2 baris contoh sebelum mengunggah. Duplikat (nama & nomor sama) otomatis dilewati.`],
  ].forEach((r) => help.addRow(r));
  styleHeader(help);
  help.getRow(1).height = 24;

  return Buffer.from(await wb.xlsx.writeBuffer());
}
