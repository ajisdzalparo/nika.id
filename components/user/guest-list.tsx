"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconCopy, IconTrash, IconBrandWhatsapp, IconUsers, IconShare, IconSearch, IconUserPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Guest {
  id: string;
  name: string;
}

import { PlanType, getPlanLimits } from "@/lib/limits";

interface GuestListProps {
  initialGuests: Guest[];
  invitationSlug: string;
  userPlan: PlanType;
}

export function GuestList({ initialGuests, invitationSlug, userPlan }: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const limits = getPlanLimits(userPlan);
  const isLimitReached = guests.length >= limits.maxGuests;

  const baseUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${invitationSlug}`;

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    if (isLimitReached) {
      toast.error(`Batas tamu tercapai untuk paket ${limits.name}. Upgrade untuk menambah lebih banyak.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/guests", {
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
      const response = await fetch(`/api/user/guests/${id}`, { method: "DELETE" });
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

  const filteredGuests = guests.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Sidebar: Add Guest & Group Actions */}
      <div className="space-y-6 lg:sticky lg:top-24">
        {/* Add Guest Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <IconUserPlus size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium">Tambah Tamu</h3>
              <p className="text-xs text-muted-foreground">
                Total: {guests.length} / {limits.maxGuests === Infinity ? "Unlimited" : limits.maxGuests}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Nama Tamu</label>
              <Input
                placeholder="Cth: Budi Santoso"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-primary rounded-lg"
                disabled={isLimitReached && !loading}
              />
            </div>

            <Button
              onClick={addGuest}
              disabled={loading || isLimitReached}
              className={`w-full h-12 rounded-lg shadow-lg ${
                isLimitReached ? "bg-zinc-200 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 hover:dark:bg-zinc-100"
              }`}
            >
              {loading ? "Menyimpan..." : isLimitReached ? "Batas Tercapai" : "Tambahkan ke Daftar"}
            </Button>
            {isLimitReached && limits.name !== "Gold" && <p className="text-xs text-center text-red-500 font-medium">Upgrade paket untuk menambah lebih banyak tamu.</p>}
          </div>
        </div>

        {/* Group Actions */}
        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-xl p-6 shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconShare size={100} className="text-primary" />
          </div>

          <h3 className="font-serif text-xl font-medium mb-1 relative z-10 text-primary">Bagikan Undangan</h3>
          <p className="text-zinc-400 text-sm mb-6 relative z-10">Untuk grup WA atau sosial media.</p>

          <div className="space-y-3 relative z-10">
            <Button onClick={copyGeneralLink} variant="secondary" className="w-full justify-start h-12 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-sm">
              <IconCopy className="w-5 h-5 mr-3" />
              Salin Link Umum
            </Button>
            <Button onClick={shareGroupWA} className="w-full justify-start h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
              <IconBrandWhatsapp className="w-5 h-5 mr-3" />
              Share ke Grup
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Guest List */}
      {/* Main Content: Guest List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search Bar */}
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl p-2 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shadow-sm">
          <div className="w-10 h-10 flex items-center justify-center text-zinc-400">
            <IconSearch size={20} />
          </div>
          <input type="text" placeholder="Cari nama tamu..." className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[400px]">
          {filteredGuests.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredGuests.map((guest) => (
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={guest.id} className="p-5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 group transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-serif font-bold text-lg border border-zinc-200 dark:border-zinc-700">{guest.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 text-lg">{guest.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">Personal Link</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => copyLink(guest.name)} className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Salin Link">
                      <IconCopy size={18} className="text-zinc-600 dark:text-zinc-300" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => shareWA(guest.name)} className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Kirim WA">
                      <IconBrandWhatsapp size={18} className="text-zinc-600 dark:text-zinc-300" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteGuest(guest.id)} className="h-10 w-10 rounded-full hover:bg-red-50 hover:text-red-500" title="Hapus">
                      <IconTrash size={18} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <IconUsers size={40} className="opacity-50" />
              </div>
              <p>Belum ada tamu yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
