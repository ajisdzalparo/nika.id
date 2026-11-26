import type { AiTheme } from "@/lib/ai-design/schema";
import type { Wish } from "@/lib/rsvp";

export interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

export interface WeddingEvent {
  id: string;
  title: string; // Misal: "Akad Nikah", "Resepsi", "Unduh Mantu"
  date: string | Date;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
  // Pinned location from the map picker (optional; older data only has mapUrl)
  lat?: number;
  lng?: number;
}

export interface WeddingData {
  guestName?: string;
  groom: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    photo?: string;
  };
  bride: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    photo?: string;
  };
  // Mendukung banyak acara (Akad, Resepsi, dll)
  events: WeddingEvent[];
  // Untuk kompatibilitas ke belakang (akan di-migrate gradual)
  event?: {
    date: string | Date;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  };
  gallery: string[];
  video?: string;
  story: {
    title: string;
    content: string;
  };
  gifts: {
    enabled: boolean;
    bankAccounts: BankAccount[];
  };
  music?: {
    enabled: boolean;
    url: string;
    type?: "youtube" | "upload";
  };
  quote?: {
    text: string;
    source: string; // e.g. "QS. Ar-Rum: 21", "Kejadian 2:24", or empty for a general quote
    /** false hides the quote section entirely */
    enabled?: boolean;
  };
  loveStory?: {
    enabled: boolean;
    chapters: {
      title: string; // e.g. "Pertemuan", "Pendekatan", "Lamaran"
      content: string;
    }[];
  };
  // Penambahan data profesional
  extendedFamily?: {
    title: string; // Misal: "Turut Mengundang"
    members: string[];
  };
  protocol?: {
    enabled: boolean;
    items: string[]; // ["Masker", "Cuci Tangan", "Jaga Jarak", dll]
  };
  streaming?: {
    enabled: boolean;
    platform: string; // "Zoom", "YouTube", "Instagram"
    url: string;
  };
  rsvpDeadline?: string | Date;
  /** RSVP form options set by the couple in the editor */
  rsvp?: {
    /** Most people one RSVP may bring, including the guest (default 5) */
    maxGuests?: number;
    /** Ask for a WhatsApp number (default true) */
    askPhone?: boolean;
    /** Give guests who are coming a personal QR to show at the venue (optional, default off) */
    qrCheckIn?: boolean;
    /** One extra question of their own, e.g. "Alergi makanan?" with fixed answers */
    question?: { label: string; options: string[] };
  };
  extra?: Record<string, string | number | boolean>;
  // Theme for the "ai-design" template, attached server-side from the user's active AiDesign
  aiTheme?: AiTheme;
  // Guest wishes shown under the RSVP form (latest first, rejected ones excluded)
  wishes?: Wish[];
  // Agency branding when the owner is an active B2B Mitra
  agencyBranding?: {
    name: string;
    instagram?: string | null;
    whatsapp?: string | null;
  } | null;
}
