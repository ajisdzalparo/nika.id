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
    source: string; // e.g. "Qs. Ar-Rum: 21"
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
  extra?: Record<string, string | number | boolean>;
}
