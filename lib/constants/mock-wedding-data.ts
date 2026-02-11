import { WeddingData } from "@/types/wedding";

export const MOCK_WEDDING_DATA: WeddingData = {
  guestName: "Tamu Undangan",
  groom: {
    nickname: "Adit",
    fullName: "Aditya Pratama",
    fatherName: "Bpk. Bambang Heru",
    motherName: "Ibu Siti Aminah",
    instagram: "adityapratama",
    photo: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop",
  },
  bride: {
    nickname: "Sarah",
    fullName: "Sarah Ayuningsih",
    fatherName: "Bpk. Ahmad Subarjo",
    motherName: "Ibu Ratna Sari",
    instagram: "sarahayuningsih",
    photo: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop",
  },
  event: {
    date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    time: "09:00 - 11:00",
    venue: "Gedung Serbaguna Jakarta",
    address: "Jl. M.H. Thamrin No. 1, Menteng, Jakarta Pusat",
    mapUrl: "https://maps.google.com",
  },
  events: [
    {
      id: "1",
      title: "Akad Nikah",
      date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      time: "08:00 - 10:00",
      venue: "Masjid Agung Jakarta",
      address: "Jl. Lapangan Banteng Barat No.1, Jakarta Pusat",
      mapUrl: "https://maps.google.com",
    },
    {
      id: "2",
      title: "Resepsi",
      date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      time: "11:00 - 14:00",
      venue: "Ballroom Hotel Indonesia",
      address: "Jl. M.H. Thamrin No. 1, Jakarta Pusat",
      mapUrl: "https://maps.google.com",
    },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
  ],
  story: {
    title: "Kisah Cinta Kami",
    content:
      "Kami bertemu pertama kali di tahun 2020 saat sedang menempuh pendidikan di universitas yang sama. Berawal dari pertemanan biasa, perlahan benih cinta mulai tumbuh hingga akhirnya kami memutuskan untuk melangkah ke jenjang yang lebih serius.",
  },
  gifts: {
    enabled: true,
    bankAccounts: [
      {
        bankName: "BCA",
        accountHolder: "Aditya Pratama",
        accountNumber: "1234567890",
      },
      {
        bankName: "Mandiri",
        accountHolder: "Sarah Ayuningsih",
        accountNumber: "0987654321",
      },
    ],
  },
};
