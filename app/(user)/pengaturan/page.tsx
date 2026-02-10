import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PengaturanPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
            <p className="text-muted-foreground">Kelola pengaturan tambahan undangan Anda</p>
          </div>

          <Tabs defaultValue="music" className="w-full max-w-2xl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="music">Musik</TabsTrigger>
              <TabsTrigger value="envelope">Amplop Digital</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
            </TabsList>

            {/* Musik Latar */}
            <TabsContent value="music" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Background Music</CardTitle>
                  <CardDescription>Upload lagu yang akan diputar saat tamu membuka undangan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="music-file">Upload File Musik (MP3)</Label>
                    <Input id="music-file" type="file" accept="audio/mp3" />
                    <p className="text-xs text-muted-foreground">Maksimal 5MB, durasi 2-3 menit</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="music-url">Atau Gunakan Link (SoundCloud/Spotify)</Label>
                    <Input id="music-url" placeholder="https://soundcloud.com/..." />
                  </div>
                  <Button>Simpan</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Amplop Digital */}
            <TabsContent value="envelope" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Digital Envelope</CardTitle>
                  <CardDescription>Nomor rekening untuk tamu yang ingin memberikan hadiah digital</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Nama Bank</Label>
                    <Input id="bank-name" placeholder="Bank BCA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Nomor Rekening</Label>
                    <Input id="account-number" placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Atas Nama</Label>
                    <Input id="account-name" placeholder="Budi Santoso" />
                  </div>
                  <Button>Simpan</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profil & Password */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Profil</CardTitle>
                  <CardDescription>Update informasi akun Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Nama</Label>
                    <Input id="profile-name" defaultValue="Budi & Ani" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input id="profile-email" type="email" defaultValue="budi@email.com" />
                  </div>
                  <Button>Update Profil</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ganti Password</CardTitle>
                  <CardDescription>Update password akun Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Password Saat Ini</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password Baru</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button>Ganti Password</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
