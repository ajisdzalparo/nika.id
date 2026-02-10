import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconHeart, IconTemplate, IconUsers, IconSparkles } from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <IconHeart className="w-20 h-20 mx-auto text-pink-500" />
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            nika<span className="text-pink-500">.id</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">Platform undangan pernikahan digital yang modern, elegan, dan mudah digunakan</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">Buat Undangan Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">Masuk</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6">
            <IconTemplate className="w-12 h-12 mx-auto text-pink-500" />
            <h3 className="text-xl font-semibold">Template Cantik</h3>
            <p className="text-muted-foreground">Pilihan desain undangan yang modern dan elegan untuk pernikahan Anda</p>
          </div>
          <div className="text-center space-y-4 p-6">
            <IconUsers className="w-12 h-12 mx-auto text-pink-500" />
            <h3 className="text-xl font-semibold">Kelola Tamu</h3>
            <p className="text-muted-foreground">Manajemen tamu, RSVP, dan ucapan yang mudah dan terintegrasi</p>
          </div>
          <div className="text-center space-y-4 p-6">
            <IconSparkles className="w-12 h-12 mx-auto text-pink-500" />
            <h3 className="text-xl font-semibold">Mudah Digunakan</h3>
            <p className="text-muted-foreground">Interface yang intuitif dan mudah untuk membuat undangan dalam hitungan menit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
