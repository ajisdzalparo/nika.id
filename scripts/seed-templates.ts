import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding templates config...");

  // 1. Classic Premium Configuration
  const classicConfig = {
    extraFields: [
      {
        id: "bank_qr",
        label: "Link QR Code Pembayaran (Gift)",
        type: "text",
        placeholder: "https://link-ke-gambar-qr.png",
        section: "fitur",
      },
      {
        id: "quote_source",
        label: "Sumber Kutipan (Misal: Al-Rum 21 / 1 Korintus 13)",
        type: "text",
        placeholder: "Ar-Rum: 21",
        section: "mempelai",
      },
    ],
  };

  // 2. Modern Dark Configuration
  const modernConfig = {
    extraFields: [
      {
        id: "video_bg_url",
        label: "URL Video Background (MP4)",
        type: "text",
        placeholder: "https://example.com/video.mp4",
        section: "galeri",
      },
      {
        id: "accent_color",
        label: "Warna Aksen (Hex)",
        type: "text",
        placeholder: "#FFFFFF",
        section: "fitur",
      },
    ],
  };

  await prisma.template.upsert({
    where: { slug: "classic-premium" },
    update: {
      config: classicConfig,
      isActive: true,
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070",
    },
    create: {
      name: "Classic Premium",
      slug: "classic-premium",
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070",
      description: "Desain floral klasik dengan sentuhan premium dan elegan.",
      config: classicConfig,
      isActive: true,
    },
  });

  await prisma.template.upsert({
    where: { slug: "modern-dark" },
    update: {
      config: modernConfig,
      isActive: true,
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=2070",
    },
    create: {
      name: "Modern Dark",
      slug: "modern-dark",
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=2070",
      description: "Tampilan modern, sleek, dan bold untuk kesan eksklusif.",
      config: modernConfig,
      isActive: true,
    },
  });

  // 3. Royal Gold Configuration
  const royalConfig = {
    extraFields: [
      {
        id: "cover_photo",
        label: "Foto Cover (Entrance)",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2070",
        section: "mempelai",
      },
      {
        id: "luxury_accent",
        label: "Warna Aksen Luxury (Hex)",
        type: "text",
        placeholder: "#D4AF37",
        section: "fitur",
      },
    ],
  };

  await prisma.template.upsert({
    where: { slug: "royal-gold" },
    update: {
      config: royalConfig,
      isActive: true,
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2000",
    },
    create: {
      name: "Royal Gold",
      slug: "royal-gold",
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2000",
      description: "Desain ultra-premium dengan nuansa emas kerajaan dan animasi mewah.",
      config: royalConfig,
      isActive: true,
    },
  });

  // 4. Romantic Elegance Configuration
  const romanticConfig = {
    extraFields: [
      {
        id: "verse_source",
        label: "Sumber Ayat/Quote",
        type: "text",
        placeholder: "QS. Ar-Rum: 21",
        section: "mempelai",
      },
      {
        id: "romantic_accent",
        label: "Warna Aksen Romantis (Hex)",
        type: "text",
        placeholder: "#FFB7C5",
        section: "fitur",
      },
    ],
  };

  await prisma.template.upsert({
    where: { slug: "romantic-elegance" },
    update: {
      config: romanticConfig as any,
      isActive: true,
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069",
    },
    create: {
      name: "Romantic Elegance",
      slug: "romantic-elegance",
      category: "PREMIUM",
      type: "WEDDING",
      thumbnail: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069",
      description: "Desain mobile-first yang romantis, profesional, dan penuh kasih.",
      config: romanticConfig as any,
      isActive: true,
    },
  });

  console.log("Seeding completed! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
