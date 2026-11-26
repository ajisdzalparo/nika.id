"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Trash2, ExternalLink, LogIn, Calendar, Heart, ChevronLeft, ChevronRight, ShieldCheck, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  accountType?: string;
  agencyName?: string | null;
  agencyVerified?: boolean;
  agencyQuota?: number;
  referralCode?: string | null;
  createdAt: string;
  invitationSlug: string | null;
  partnerName: string | null;
  weddingDate: string | null;
  templateSlug: string | null;
}

interface UsersClientProps {
  initialUsers: User[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  currentUserId?: string;
}

export function UsersClient({ initialUsers, totalPages, currentPage, totalCount, currentUserId }: UsersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Sync state with URL when URL changes (back/forward)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams, searchQuery]);

  // Debounced search update to URL
  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (searchQuery === currentQ) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("q", searchQuery);
        params.set("page", "1");
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery, pathname, router, searchParams]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleImpersonate = async (userId: string) => {
    setIsImpersonating(userId);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        throw new Error("Gagal melakukan impersonasi");
      }

      toast.success("Berhasil masuk sebagai user");

      // Force reload to switch context to that user
      window.location.assign(new URL("/", window.location.origin));
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan impersonasi");
    } finally {
      setIsImpersonating(null);
    }
  };

  // Mitra status is admin-only (after a WhatsApp chat or an approved application)
  const handleToggleMitra = async (user: User) => {
    const makeMitra = user.accountType !== "AGENCY";
    setIsUpdatingRole(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: makeMitra ? "AGENCY" : "PERSONAL" }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status mitra");
      toast.success(makeMitra ? `${user.agencyName || user.name || user.email} sekarang Mitra` : "Status mitra dicabut");
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui status mitra");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    const isAdmin = user.role?.toLowerCase() === "admin";
    const nextRole = isAdmin ? "USER" : "admin";
    setIsUpdatingRole(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal mengubah role");
      }
      toast.success(nextRole === "admin" ? `${user.name || user.email} dijadikan admin` : `Akses admin ${user.name || user.email} dicabut`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah role");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus user");
      }

      toast.success("User berhasil dihapus");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menghapus user");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" aria-label="Cari pengguna" placeholder="Cari nama, usaha mitra, email, atau slug..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                ["all", "Semua"],
                ["agency", "Mitra B2B"],
              ] as const
            ).map(([k, l]) => {
              const active = (searchParams.get("tipe") === "agency" ? "agency" : "all") === k;
              return (
                <Button
                  key={k}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (k === "agency") params.set("tipe", "agency");
                    else params.delete("tipe");
                    params.set("page", "1");
                    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
                  }}
                >
                  {l}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {isPending && <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />}
          Menampilkan {totalCount} user
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User & Kontak</TableHead>
              <TableHead>Pasangan & Acara</TableHead>
              <TableHead>Design</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Tidak ada user yang ditemukan
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-base">{user.name ?? "-"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Daftar:{" "}
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Heart className="h-3 w-3 text-pink-500" />
                        <span>{user.partnerName ?? "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {user.weddingDate
                            ? new Date(user.weddingDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Belum diset"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit font-normal text-[10px] px-1.5 py-0">
                        {user.templateSlug ?? "No Template"}
                      </Badge>
                      {user.invitationSlug && (
                        <a href={`/${user.invitationSlug}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
                          /{user.invitationSlug}
                          <ExternalLink className="h-2 w-2" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={user.role?.toLowerCase() === "admin" ? "default" : "secondary"} className="w-fit">
                        {user.role?.toLowerCase() === "admin" ? "Admin" : user.role}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            disabled={isUpdatingRole === user.id}
                            className={
                              user.accountType === "AGENCY"
                                ? "inline-flex w-fit items-center gap-1 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-2 py-0.5 text-[10px] font-medium text-[#5C431A] hover:bg-[#ECE2CE]"
                                : "inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-[#D9C9A6] px-2 py-0.5 text-[10px] font-medium text-[#8A6424] hover:bg-[#F7F0E1]"
                            }
                          >
                            {user.accountType === "AGENCY" ? `Mitra · ${user.agencyQuota ?? 0} kuota` : "+ Jadikan Mitra"}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.accountType === "AGENCY" ? `Cabut status Mitra ${user.agencyName || user.name || user.email}?` : `Jadikan ${user.name || user.email} Mitra?`}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.accountType === "AGENCY"
                                ? "Menu Mitra, link mitra, dan pemakaian kuota ditutup. Sisa kuota tetap tersimpan dan bisa dipakai lagi kalau status Mitra dikembalikan."
                                : "Akun ini mendapat menu Mitra: dashboard klien, link mitra dengan bonus kuota, dan paket kuota grosir. Pakai ini untuk mitra yang mendaftar lewat WhatsApp."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleMitra(user)}>
                              {user.accountType === "AGENCY" ? "Cabut Mitra" : "Jadikan Mitra"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-100 transition-opacity">
                      {user.id !== currentUserId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 px-2 text-xs"
                              disabled={isUpdatingRole === user.id}
                              title={user.role?.toLowerCase() === "admin" ? "Cabut akses admin" : "Jadikan admin"}
                            >
                              {user.role?.toLowerCase() === "admin" ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5 text-[#8A6424]" />}
                              <span className="hidden sm:inline">{user.role?.toLowerCase() === "admin" ? "Cabut admin" : "Jadikan admin"}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {user.role?.toLowerCase() === "admin" ? `Cabut akses admin ${user.name || user.email}?` : `Jadikan ${user.name || user.email} sebagai admin?`}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.role?.toLowerCase() === "admin"
                                  ? "User ini tidak lagi dapat mengakses panel admin."
                                  : "User ini akan memiliki akses penuh ke panel admin, termasuk mengelola template, pengguna, dan transaksi."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleToggleAdmin(user)}>
                                {user.role?.toLowerCase() === "admin" ? "Cabut admin" : "Jadikan admin"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="ghost" size="icon-sm" title="Masuk sebagai pengguna ini" aria-label={`Masuk sebagai ${user.name || user.email}`} onClick={() => handleImpersonate(user.id)} disabled={isImpersonating === user.id}>
                        <LogIn className={`h-4 w-4 ${isImpersonating === user.id ? "animate-pulse" : ""}`} />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${user.name || user.email}`} title="Hapus pengguna" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus User {user.name}?</AlertDialogTitle>
                            <AlertDialogDescription>Tindakan ini permanen. Semua data undangan, tamu, dan pesan dari user ini akan dihapus selamanya.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting === user.id}>
                              {isDeleting === user.id ? "Menghapus..." : "Hapus Permanen"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || isPending}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isPending}>
              Berikutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
