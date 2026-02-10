"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { IconCopy, IconTrash, IconBrandWhatsapp, IconPlus, IconUsers } from "@tabler/icons-react";
import { toast } from "sonner";

interface Guest {
  id: string;
  name: string;
}

interface GuestListProps {
  initialGuests: Guest[];
  invitationSlug: string;
}

export function GuestList({ initialGuests, invitationSlug }: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${invitationSlug}`;

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setLoading(true);
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error("Gagal menambah tamu");
      const newGuest = await response.json();
      setGuests([newGuest, ...guests]);
      setNewName("");
      toast.success("Tamu berhasil ditambahkan");
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (id: string) => {
    if (!confirm("Hapus tamu ini?")) return;

    try {
      const response = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus tamu");
      setGuests(guests.filter((g) => g.id !== id));
      toast.success("Tamu berhasil dihapus");
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const copyLink = (name: string) => {
    const link = `${baseUrl}?to=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link untuk ${name} berhasil disalin!`);
  };

  const shareWA = (name: string) => {
    const link = `${baseUrl}?to=${encodeURIComponent(name)}`;
    const text = `Halo ${name}, kami mengundang Anda ke acara pernikahan kami. Lihat detailnya di sini: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareGroupWA = () => {
    const text = `Halo teman-teman, kami mengundang Anda ke acara pernikahan kami. Lihat detailnya di sini: ${baseUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyGeneralLink = () => {
    navigator.clipboard.writeText(baseUrl);
    toast.success("Link umum berhasil disalin!");
  };

  return (
    <div className="space-y-6">
      {/* Group Actions */}
      <Card className="border-none shadow-lg bg-linear-to-r from-pink-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="h-6 w-6" />
            Aksi Grup
          </CardTitle>
          <CardDescription className="text-white/80">Bagikan undangan ke grup WhatsApp atau salin link umum.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={shareGroupWA} className="bg-white text-pink-600 hover:bg-white/90 rounded-xl gap-2 font-bold">
            <IconBrandWhatsapp className="h-5 w-5" />
            Share ke Grup WhatsApp
          </Button>
          <Button onClick={copyGeneralLink} variant="outline" className="border-white text-white hover:bg-white/10 rounded-xl gap-2">
            <IconCopy className="h-5 w-5" />
            Salin Link Umum
          </Button>
        </CardContent>
      </Card>

      {/* Add Guest Form */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Tambah Tamu Baru</CardTitle>
          <CardDescription>Input nama tamu untuk generate link personal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addGuest} className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="guest-name">Nama Tamu</Label>
              <Input id="guest-name" placeholder="Contoh: Ahmad Wijaya" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="gap-2 bg-pink-500 hover:bg-pink-600 rounded-xl px-6">
                <IconPlus className="h-4 w-4" />
                Tambah
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Guest List */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Daftar Tamu ({guests.length})</CardTitle>
          <CardDescription>Link personal dan opsi pengiriman</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">Nama Tamu</TableHead>
                  <TableHead className="font-bold text-gray-900">Personal Link</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">{guest.name}</TableCell>
                    <TableCell>
                      <code className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded-lg border border-pink-100 truncate max-w-[200px] block">
                        {invitationSlug}?to={guest.name}
                      </code>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(guest.name)} className="h-9 w-9 rounded-xl hover:bg-gray-100" title="Copy Link">
                        <IconCopy className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => shareWA(guest.name)} className="h-9 w-9 rounded-xl hover:bg-green-50 hover:text-green-600" title="Kirim WhatsApp">
                        <IconBrandWhatsapp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteGuest(guest.id)} className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-500" title="Hapus">
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {guests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      Belum ada tamu. Silakan tambah tamu baru di atas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
