import { z } from "zod";

export const LandingHighlightSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(160),
});

export const LandingStepSchema = z.object({
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(300),
});

export const LandingFeatureItemSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(240),
});

export const LandingFaqItemSchema = z.object({
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(800),
});

export const LandingContentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().min(1).max(80),
    headlinePrefix: z.string().trim().min(1).max(120),
    headlineHighlight: z.string().trim().max(40),
    headlineSuffix: z.string().trim().max(120),
    subheadline: z.string().trim().min(1).max(400),
    primaryCta: z.string().trim().min(1).max(50),
    secondaryCta: z.string().trim().min(1).max(50),
    highlights: z.array(LandingHighlightSchema).length(3),
  }),
  steps: z.object({
    eyebrow: z.string().trim().min(1).max(60),
    heading: z.string().trim().min(1).max(160),
    items: z.array(LandingStepSchema).min(1).max(6),
  }),
  features: z.object({
    eyebrow: z.string().trim().min(1).max(60),
    heading: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(400),
    items: z.array(LandingFeatureItemSchema).length(6),
  }),
  faq: z.object({
    eyebrow: z.string().trim().min(1).max(60),
    heading: z.string().trim().min(1).max(160),
    items: z.array(LandingFaqItemSchema).min(1).max(15),
  }),
  finalCta: z.object({
    headingPrefix: z.string().trim().min(1).max(120),
    headingHighlight: z.string().trim().max(40),
    headingSuffix: z.string().trim().max(120),
    description: z.string().trim().min(1).max(300),
    buttonLabel: z.string().trim().min(1).max(50),
  }),
  footer: z.object({
    tagline: z.string().trim().min(1).max(240),
    copyright: z.string().trim().min(1).max(100),
  }),
});

export type LandingContent = z.infer<typeof LandingContentSchema>;

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    eyebrow: "Undangan pernikahan digital",
    headlinePrefix: "Undangan yang terasa dibuat ",
    headlineHighlight: "khusus",
    headlineSuffix: " untuk kalian berdua.",
    subheadline:
      "Ceritakan suasana yang kalian impikan. AI kami merancang palet, tipografi, dan ornamennya, lengkap dengan RSVP, amplop digital, dan pengiriman ke tamu lewat WhatsApp.",
    primaryCta: "Buat undangan",
    secondaryCta: "Coba desain AI",
    highlights: [
      { title: "Menit", description: "dari daftar sampai siap dibagikan" },
      { title: "Nama tamu", description: "tampil di sampul undangan" },
      { title: "Kapan saja", description: "isi bisa diubah setelah dibagikan" },
    ],
  },
  steps: {
    eyebrow: "Cara kerja",
    heading: "Tiga langkah, tanpa perlu keahlian desain.",
    items: [
      {
        title: "Pilih atau rancang desain",
        body: "Ambil dari koleksi, atau tulis konsep kalian di Studio Desain AI.",
      },
      {
        title: "Isi data dan foto",
        body: "Nama mempelai, orang tua, acara, lokasi, galeri, musik, dan rekening amplop.",
      },
      {
        title: "Bagikan ke tamu",
        body: "Kirim link dengan nama tiap tamu lewat WhatsApp, lalu pantau RSVP dari dashboard.",
      },
    ],
  },
  features: {
    eyebrow: "Untuk tamu",
    heading: "Setiap tamu disapa dengan namanya.",
    description:
      "Buat daftar tamu sekali, lalu kirim link pribadi lewat WhatsApp. Nama tamu muncul di sampul undangan, sehingga undangan terasa personal tanpa harus mengetik ulang.",
    items: [
      {
        title: "RSVP & buku tamu",
        body: "Tamu konfirmasi hadir dan menulis ucapan; semuanya rapi di dashboard.",
      },
      {
        title: "Amplop digital",
        body: "Nomor rekening dan e-wallet dengan tombol salin sekali ketuk.",
      },
      {
        title: "Musik latar",
        body: "Unggah lagu kalian atau pakai tautan YouTube.",
      },
      {
        title: "Galeri & video",
        body: "Foto prewedding dan video dalam tata letak yang mengikuti desain.",
      },
      {
        title: "Hitung mundur & kalender",
        body: "Tamu bisa menyimpan tanggal acara ke kalender HP.",
      },
      {
        title: "Peta lokasi",
        body: "Akad, resepsi, unduh mantu, masing-masing dengan petunjuk arah.",
      },
    ],
  },
  faq: {
    eyebrow: "Pertanyaan",
    heading: "Yang sering ditanyakan.",
    items: [
      {
        question: "Bagaimana cara kerja Desain AI?",
        answer:
          "Tulis konsep pernikahan kalian, misalnya adat, warna, atau suasana. AI menyusun tema lengkap (warna, huruf, ornamen, dan tata letak) yang langsung tampil di pratinjau. Jumlah desain AI mengikuti paket.",
      },
      {
        question: "Apakah undangan bisa diubah setelah dibagikan?",
        answer:
          "Bisa. Semua perubahan dari dashboard langsung tampil di link yang sama, jadi tamu tidak perlu menerima link baru.",
      },
      {
        question: "Bagaimana tamu menerima undangan?",
        answer:
          "Setiap tamu mendapat link dengan namanya sendiri, yang bisa dikirim lewat WhatsApp atau disalin ke aplikasi lain.",
      },
      {
        question: "Berapa lama undangan aktif?",
        answer:
          "Masa aktif mengikuti paket yang dipilih, dari 3 bulan hingga 1 tahun.",
      },
      {
        question: "Apakah bisa memakai lagu sendiri?",
        answer: "Bisa, unggah file musik atau gunakan tautan YouTube.",
      },
    ],
  },
  finalCta: {
    headingPrefix: "Mulai rancang undangan ",
    headingHighlight: "kalian",
    headingSuffix: " hari ini.",
    description:
      "Daftar, coba Studio Desain AI, dan lihat undangan kalian di HP sebelum memutuskan paket.",
    buttonLabel: "Buat undangan",
  },
  footer: {
    tagline: "Undangan pernikahan digital yang dirancang sesuai cerita kalian.",
    copyright: "© 2026 SatuMoment",
  },
};
