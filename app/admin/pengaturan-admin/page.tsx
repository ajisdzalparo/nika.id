import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function PengaturanPage() {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "admin") {
    redirect("/login");
  }
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
            <p className="text-muted-foreground">Konfigurasi API dan maintenance</p>
          </div>

          <div className="space-y-6 max-w-4xl">
            {/* Maintenance Mode */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>Aktifkan untuk mengunci sementara akses user saat update sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status Maintenance</p>
                    <p className="text-sm text-muted-foreground">Saat aktif, user tidak dapat mengakses sistem</p>
                  </div>
                  <Toggle />
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Konfigurasi API</CardTitle>
                <CardDescription>Setting untuk integrasi layanan eksternal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* WhatsApp Gateway */}
                <div className="space-y-3">
                  <h4 className="font-semibold">WhatsApp Gateway</h4>
                  <div className="space-y-2">
                    <Label htmlFor="wa-api-key">API Key</Label>
                    <Input id="wa-api-key" type="password" placeholder="••••••••••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-sender">Nomor Pengirim</Label>
                    <Input id="wa-sender" placeholder="+62812345678" />
                  </div>
                </div>

                {/* Email SMTP */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Email SMTP</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input id="smtp-host" placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input id="smtp-port" placeholder="587" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-email">Email</Label>
                    <Input id="smtp-email" type="email" placeholder="noreply@nika.id" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <Input id="smtp-password" type="password" placeholder="••••••••" />
                  </div>
                </div>

                {/* Payment Gateway */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Payment Gateway</h4>
                  <div className="space-y-2">
                    <Label htmlFor="midtrans-server">Midtrans Server Key</Label>
                    <Input id="midtrans-server" type="password" placeholder="••••••••••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="midtrans-client">Midtrans Client Key</Label>
                    <Input id="midtrans-client" type="password" placeholder="••••••••••••••••" />
                  </div>
                </div>

                <Button className="w-full">Simpan Konfigurasi</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
