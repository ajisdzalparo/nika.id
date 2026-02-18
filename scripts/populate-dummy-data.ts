/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FULL_DUMMY_DATA = {
  // Same structure as MOCK_WEDDING_DATA
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
  events: [
    {
      id: "1",
      title: "Akad Nikah",
      date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      time: "08:00 - 10:00",
      venue: "Masjid Agung Jakarta",
      address: "Jl. Lapangan Banteng Barat No.1, Jakarta Pusat",
      mapUrl: "https://maps.google.com",
    },
    {
      id: "2",
      title: "Resepsi",
      date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    content: "Kami bertemu...",
  },
  gifts: {
    enabled: true,
    bankAccounts: [
      {
        bankName: "BCA",
        accountHolder: "Aditya Pratama",
        accountNumber: "1234567890",
      },
    ],
  },
  quote: {
    text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
    source: "Qs. Ar-Rum: 21",
  },
  loveStory: {
    enabled: true,
    chapters: [
      { title: "Pertemuan", content: "Kami bertemu pertama kali di kampus yang sama pada tahun 2020." },
      { title: "Pendekatan", content: "Setelah beberapa bulan saling mengenal, kami mulai sering menghabiskan waktu bersama." },
      { title: "Lamaran", content: "Pada bulan September 2024, kami memutuskan untuk melangkah ke tahap yang lebih serius." },
      { title: "Pernikahan", content: "Dan akhirnya, kami memutuskan untuk menyatukan langkah dalam ikatan suci pernikahan." },
    ],
  },
  streaming: {
    enabled: true,
    platform: "YouTube",
    url: "https://youtube.com/live/example",
  },
  music: {
    enabled: true,
    url: "https://assets.mixkit.co/music/preview/mixkit-wedding-bells-2965.mp3", // Example mock music
  },
};

async function main() {
  console.log("🚀 Populating dummy data for existing users...");

  const invitations = await prisma.invitation.findMany();
  console.log(`Found ${invitations.length} invitations.`);

  if (invitations.length === 0) {
    console.log("⚠️ No invitations found. Creating one for the first user...");
    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.invitation.create({
        data: {
          userId: user.id,
          data: FULL_DUMMY_DATA,
        },
      });
      console.log(`✅ Created invitation with full dummy data for user ${user.email}`);
    } else {
      console.log("❌ No users found either. Please register first.");
    }
  } else {
    for (const inv of invitations) {
      // Only populate if data looks sparse (check for events array)
      const currentData = inv.data as any;
      if (!currentData.events || currentData.events.length === 0) {
        console.log(`Populating data for user ${inv.userId}...`);
        await prisma.invitation.update({
          where: { id: inv.id },
          data: {
            data: FULL_DUMMY_DATA, // FORCE UPDATE to full dummy
          },
        });
      } else {
        console.log(`User ${inv.userId} already has event data. Skipping overwrite (safe mode).`);
      }
    }
  }

  console.log("✨ Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
