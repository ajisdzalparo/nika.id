/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IconTemplate, IconUsers, IconSparkles, IconHeart, IconDeviceMobile, IconShare } from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Template Premium & Eksklusif",
    description: "Kami menyediakan puluhan desain undangan yang dikurasi oleh desainer profesional. Mulai dari gaya Minimalist, Floral, hingga Royal Gold yang mewah, semuanya siap mempercantik momen spesial Anda.",
    icon: IconTemplate,
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    title: "Manajemen Tamu & RSVP Pintar",
    description: "Lupakan pencatatan manual. Pantau konfirmasi kehadiran tamu secara real-time. Anda bisa melihat siapa saja yang hadir, jumlah tamu, hingga ucapan doa langsung dari dashboard admin yang intuitif.",
    icon: IconUsers,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Editor Custom Tanpa Batas",
    description: "Punya ide kreatif? Editor drag-and-drop kami memungkinkan Anda mengubah teks, foto, musik latar, hingga story perjalanan cinta Anda dengan sangat mudah. Tidak perlu keahlian desain atau coding!",
    icon: IconSparkles,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    title: "Optimasi Mobile & Fast Loading",
    description: "90% tamu akan membuka undangan melalui smartphone. Undangan nika.id dioptimalkan agar ringan dan tampil sempurna di semua layar perangkat, memberikan pengalaman terbaik bagi tamu Anda.",
    icon: IconDeviceMobile,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    title: "Buku Tamu & Gallery Interaktif",
    description: "Bagikan kebahagiaan melalui galeri foto dan video pre-wedding yang estetik. Biarkan tamu meninggalkan kesan dan pesan (ucapan) yang akan tersimpan selamanya sebagai kenang-kenangan digital.",
    icon: IconHeart,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    title: "Berbagi Instan ke WhatsApp",
    description: "Sebarkan link undangan secara personal kepada tamu lewat integrasi WhatsApp. Anda juga bisa menyebarkannya ke berbagai platform media sosial lainnya hanya dalam satu klik saja.",
    icon: IconShare,
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

export function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feature-card", {
        y: 60,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Fitur Unggulan Yang Memudahkan</h2>
          <p className="text-slate-600 text-lg leading-relaxed">Kami memahami bahwa persiapan pernikahan itu melelahkan. Itulah mengapa nika.id hadir dengan fitur lengkap yang dirancang khusus untuk menghemat waktu dan tenaga Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={feature.title} className="feature-card p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:border-pink-200 hover:shadow-2xl hover:shadow-pink-50 transition-all duration-300 group">
              <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center ${feature.color} mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                <feature.icon size={36} />
              </div>
              <h3 className="text-xl font-black mb-4 text-slate-900 leading-tight">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
