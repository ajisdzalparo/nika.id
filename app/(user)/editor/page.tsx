import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditorPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editor Undangan</h1>
              <p className="text-muted-foreground">Lengkapi data undangan pernikahan Anda</p>
            </div>
            <Button>Simpan Semua</Button>
          </div>

          <Tabs defaultValue="mempelai" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mempelai">Mempelai</TabsTrigger>
              <TabsTrigger value="acara">Acara</TabsTrigger>
              <TabsTrigger value="galeri">Galeri</TabsTrigger>
              <TabsTrigger value="cerita">Cerita</TabsTrigger>
            </TabsList>

            {/* Tab Mempelai */}
            <TabsContent value="mempelai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Mempelai Pria</CardTitle>
                  <CardDescription>Informasi lengkap mempelai pria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="groom-name">Nama Lengkap</Label>
                      <Input id="groom-name" placeholder="Budi Santoso" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groom-instagram">Instagram</Label>
                      <Input id="groom-instagram" placeholder="@budisantoso" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groom-parents">Nama Orang Tua</Label>
                    <Input id="groom-parents" placeholder="Bapak Harto & Ibu Siti" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groom-photo">Upload Foto</Label>
                    <Input id="groom-photo" type="file" accept="image/*" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Mempelai Wanita</CardTitle>
                  <CardDescription>Informasi lengkap mempelai wanita</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bride-name">Nama Lengkap</Label>
                      <Input id="bride-name" placeholder="Ani Wijaya" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bride-instagram">Instagram</Label>
                      <Input id="bride-instagram" placeholder="@aniwijaya" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bride-parents">Nama Orang Tua</Label>
                    <Input id="bride-parents" placeholder="Bapak Agus & Ibu Rina" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bride-photo">Upload Foto</Label>
                    <Input id="bride-photo" type="file" accept="image/*" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Acara */}
            <TabsContent value="acara" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detail Acara</CardTitle>
                  <CardDescription>Waktu dan lokasi pernikahan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-date">Tanggal</Label>
                      <Input id="event-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-time">Waktu</Label>
                      <Input id="event-time" type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-venue">Nama Venue</Label>
                    <Input id="event-venue" placeholder="Gedung Serbaguna" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-address">Alamat Lengkap</Label>
                    <Textarea id="event-address" placeholder="Jl. Merdeka No. 123, Jakarta Pusat" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-maps">Google Maps Link</Label>
                    <Input id="event-maps" placeholder="https://maps.google.com/..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Galeri */}
            <TabsContent value="galeri" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Galeri Foto & Video</CardTitle>
                  <CardDescription>Upload foto prewedding dan video</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gallery-photos">Upload Foto</Label>
                    <Input id="gallery-photos" type="file" accept="image/*" multiple />
                    <p className="text-xs text-muted-foreground">Maksimal 10 foto, ukuran masing-masing 2MB</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gallery-video">Link Video (YouTube/Vimeo)</Label>
                    <Input id="gallery-video" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Cerita */}
            <TabsContent value="cerita" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cerita Cinta (Opsional)</CardTitle>
                  <CardDescription>Bagikan perjalanan cinta Anda dengan tamu</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="story-title">Judul Cerita</Label>
                    <Input id="story-title" placeholder="Kisah Kami" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="story-content">Cerita</Label>
                    <Textarea id="story-content" placeholder="Ceritakan bagaimana Anda berdua bertemu dan memulai perjalanan cinta..." rows={10} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
