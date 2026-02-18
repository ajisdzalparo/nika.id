"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Trash2, ExternalLink, LogIn, Calendar, Heart, ChevronLeft, ChevronRight } from "lucide-react";

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
}

export function UsersClient({ initialUsers, totalPages, currentPage, totalCount }: UsersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<string | null>(null);

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
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan impersonasi");
    } finally {
      setIsImpersonating(null);
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama, email, atau slug..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" title="Login As" onClick={() => handleImpersonate(user.id)} disabled={isImpersonating === user.id}>
                        <LogIn className={`h-4 w-4 ${isImpersonating === user.id ? "animate-pulse" : ""}`} />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
