import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconCalendar, IconMapPin, IconHeart } from "@tabler/icons-react";

// This is a public page - fetch wedding data based on slug
export default async function PublicInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // TODO: Fetch wedding data from database using slug
  // For now, using mock data
  const weddingData = {
    groomName: "Budi Santoso",
    brideName: "Ani Wijaya",
    date: "15 Maret 2024",
    time: "10:00 WIB",
    venue: "Gedung Serbaguna",
    address: "Jl. Merdeka No. 123, Jakarta Pusat",
    slug: slug,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <IconHeart className="w-16 h-16 mx-auto text-pink-500" />
          <h1 className="text-5xl md:text-6xl font-serif font-bold">
            {weddingData.groomName} & {weddingData.brideName}
          </h1>
          <p className="text-2xl text-muted-foreground">Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan kami</p>
        </div>

        {/* Event Details */}
        <div className="max-w-2xl mx-auto mt-16 space-y-6">
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <IconCalendar className="w-6 h-6 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Waktu Acara</h3>
                  <p className="text-muted-foreground">{weddingData.date}</p>
                  <p className="text-muted-foreground">{weddingData.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <IconMapPin className="w-6 h-6 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Lokasi</h3>
                  <p className="text-muted-foreground">{weddingData.venue}</p>
                  <p className="text-muted-foreground">{weddingData.address}</p>
                  <Button variant="outline" className="mt-2">
                    Buka Maps
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSVP Form */}
          <Card>
            <CardContent className="p-8">
              <h3 className="font-semibold text-xl mb-4">Konfirmasi Kehadiran</h3>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Nama Anda</Label>
                  <Input id="guest-name" placeholder="Masukkan nama Anda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendance">Kehadiran</Label>
                  <select id="attendance" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Pilih...</option>
                    <option value="hadir">Hadir</option>
                    <option value="tidak">Tidak Hadir</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests-count">Jumlah Tamu</Label>
                  <Input id="guests-count" type="number" min="1" defaultValue="1" />
                </div>
                <Button type="submit" className="w-full">
                  Konfirmasi
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Guest Message */}
          <Card>
            <CardContent className="p-8">
              <h3 className="font-semibold text-xl mb-4">Ucapan & Doa</h3>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message-name">Nama</Label>
                  <Input id="message-name" placeholder="Nama Anda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Ucapan</Label>
                  <Textarea id="message" placeholder="Tulis ucapan dan doa untuk mempelai..." rows={4} />
                </div>
                <Button type="submit" className="w-full">
                  Kirim Ucapan
                </Button>
              </form>

              {/* Display Messages */}
              <div className="mt-8 space-y-4">
                <h4 className="font-semibold">Ucapan dari Tamu</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="font-medium">Ahmad</p>
                    <p className="text-sm text-muted-foreground">Selamat menempuh hidup baru! Bahagia selalu.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="font-medium">Siti</p>
                    <p className="text-sm text-muted-foreground">Semoga langgeng sampai kakek nenek!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
