import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconMusic, IconMail, IconUser, IconLock } from "@tabler/icons-react";

export default function PengaturanPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">Pengaturan</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola preferensi dan akun Anda.</p>
          </div>

          <Tabs defaultValue="music" className="w-full flex flex-col md:flex-row gap-8">
            <TabsList className="flex flex-col h-auto w-full md:w-64 bg-transparent gap-2 p-0 justify-start">
              <TabsTrigger
                value="music"
                className="w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-800"
              >
                <IconMusic className="w-4 h-4 mr-3" />
                Musik Latar
              </TabsTrigger>
              <TabsTrigger
                value="envelope"
                className="w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-800"
              >
                <IconMail className="w-4 h-4 mr-3" />
                Amplop Digital
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-800"
              >
                <IconUser className="w-4 h-4 mr-3" />
                Profil Akun
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 space-y-6">
              {/* Musik Latar */}
              <TabsContent value="music" className="mt-0 space-y-4">
                <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  {/* Ambient Gold Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div className="mb-6 relative z-10">
                    <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">Background Music</h3>
                    <p className="text-sm text-zinc-500">Upload lagu yang akan diputar saat tamu membuka undangan</p>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="music-file" className="text-xs font-bold text-zinc-500 uppercase">
                        Upload File Musik (MP3)
                      </Label>
                      <Input id="music-file" type="file" accept="audio/mp3" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                      <p className="text-[10px] text-zinc-400">Maksimal 5MB, durasi 2-3 menit</p>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-100 dark:border-zinc-800" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-zinc-400">Atau</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="music-url" className="text-xs font-bold text-zinc-500 uppercase">
                        Gunakan Link (SoundCloud/Spotify)
                      </Label>
                      <Input id="music-url" placeholder="https://soundcloud.com/..." className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <Button className="w-full sm:w-auto rounded-lg mt-2 bg-primary text-primary-foreground hover:bg-primary/90">Simpan Perubahan</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Amplop Digital */}
              <TabsContent value="envelope" className="mt-0">
                <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  {/* Ambient Gold Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div className="mb-6 relative z-10">
                    <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">Digital Envelope</h3>
                    <p className="text-sm text-zinc-500">Rekening untuk hadiah digital dari tamu</p>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name" className="text-xs font-bold text-zinc-500 uppercase">
                        Nama Bank
                      </Label>
                      <Input id="bank-name" placeholder="Bank BCA" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-number" className="text-xs font-bold text-zinc-500 uppercase">
                        Nomor Rekening
                      </Label>
                      <Input id="account-number" placeholder="1234567890" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-name" className="text-xs font-bold text-zinc-500 uppercase">
                        Atas Nama
                      </Label>
                      <Input id="account-name" placeholder="Budi Santoso" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <Button className="w-full sm:w-auto rounded-lg mt-2 bg-primary text-primary-foreground hover:bg-primary/90">Simpan Perubahan</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Profil & Password */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  {/* Ambient Gold Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div className="mb-6 relative z-10">
                    <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">Informasi Profil</h3>
                    <p className="text-sm text-zinc-500">Update data pribadi Anda</p>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name" className="text-xs font-bold text-zinc-500 uppercase">
                        Nama Lengkap
                      </Label>
                      <Input id="profile-name" defaultValue="Budi & Ani" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email" className="text-xs font-bold text-zinc-500 uppercase">
                        Email Address
                      </Label>
                      <Input id="profile-email" type="email" defaultValue="budi@email.com" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <Button className="w-full sm:w-auto rounded-lg mt-2 bg-primary text-primary-foreground hover:bg-primary/90">Update Profil</Button>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <div className="mb-6 relative z-10">
                    <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <IconLock className="w-5 h-5 text-zinc-400" />
                      Keamanan
                    </h3>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-xs font-bold text-zinc-500 uppercase">
                        Password Saat Ini
                      </Label>
                      <Input id="current-password" type="password" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs font-bold text-zinc-500 uppercase">
                        Password Baru
                      </Label>
                      <Input id="new-password" type="password" className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
                    </div>
                    <Button className="w-full sm:w-auto rounded-lg mt-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800">Ganti Password</Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
