"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { IconLock, IconLoader } from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProfileTabProps {
  user: {
    name: string | null;
    email: string;
  };
}

export function ProfileTab({ user }: ProfileTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Gagal update profil");
      toast.success("Profil berhasil diperbarui");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Gagal update password");
      toast.success("Password berhasil diperbarui");
      setNewPassword("");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabsContent value="profile" className="mt-0 space-y-6">
      <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
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
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-xs font-bold text-zinc-500 uppercase">
              Email Address
            </Label>
            <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary" />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading} className="w-full sm:w-auto rounded-lg mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <IconLoader className="animate-spin w-4 h-4 mr-2" /> : null}
            Update Profil
          </Button>
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
            <Label htmlFor="new-password" className="text-xs font-bold text-zinc-500 uppercase">
              Password Baru
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary"
            />
          </div>
          <Button onClick={handleUpdatePassword} disabled={loading} className="w-full sm:w-auto rounded-lg mt-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800">
            {loading ? <IconLoader className="animate-spin w-4 h-4 mr-2" /> : null}
            Ganti Password
          </Button>
        </div>
      </div>
    </TabsContent>
  );
}
