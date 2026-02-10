/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, Eye, MoreHorizontal, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  status: string;
  paymentProof: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string;
    invitationSlug: string | null;
  };
}

interface TransactionsClientProps {
  initialTransactions: Transaction[];
}

export function TransactionsClient({ initialTransactions }: TransactionsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTransactions = initialTransactions.filter((t) => t.user.name?.toLowerCase().includes(search.toLowerCase()) || t.user.email.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));

  const handleUpdateStatus = async (id: string, status: "SUCCESS" | "FAILED") => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Gagal mengupdate status");

      toast.success(`Transaksi ${status === "SUCCESS" ? "Disetujui" : "Ditolak"}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-500 hover:bg-green-600">Berhasil</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Gagal</Badge>;
      case "PENDING":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari user, email, atau ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Email</TableHead>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Data transaksi tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{t.user.name || "N/A"}</span>
                      <span className="text-xs text-muted-foreground">{t.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground lowercase">#{t.id.slice(-8)}</TableCell>
                  <TableCell>
                    <span className="font-semibold">Rp {t.amount.toLocaleString("id-ID")}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={loading === t.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Eye className="mr-2 h-4 w-4" /> Lihat Bukti
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Bukti Pembayaran</DialogTitle>
                              <DialogDescription>
                                Transaksi oleh {t.user.name} pada {new Date(t.createdAt).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 flex flex-col items-center">
                              {t.paymentProof ? (
                                <div className="relative w-full aspect-3/4 max-h-[500px] overflow-hidden rounded-lg border">
                                  <img src={t.paymentProof} alt={`Bukti pembayaran dari ${t.user.name}`} className="object-contain w-full h-full" />
                                </div>
                              ) : (
                                <div className="py-20 text-center border-2 border-dashed rounded-lg w-full text-muted-foreground">User belum mengunggah bukti pembayaran.</div>
                              )}

                              <div className="mt-6 flex gap-4 w-full">
                                {t.status === "PENDING" && (
                                  <>
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(t.id, "SUCCESS")}>
                                      <CheckCircle className="mr-2 h-4 w-4" /> Verifikasi Berhasil
                                    </Button>
                                    <Button variant="destructive" className="flex-1" onClick={() => handleUpdateStatus(t.id, "FAILED")}>
                                      <XCircle className="mr-2 h-4 w-4" /> Tolak Pembayaran
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {t.user.invitationSlug && (
                          <DropdownMenuItem onClick={() => window.open(`/${t.user.invitationSlug}`, "_blank")}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Lihat Undangan
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {t.status === "PENDING" && (
                          <>
                            <DropdownMenuItem className="text-green-600 focus:text-green-600" onClick={() => handleUpdateStatus(t.id, "SUCCESS")}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Verifikasi Langsung
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleUpdateStatus(t.id, "FAILED")}>
                              <XCircle className="mr-2 h-4 w-4" /> Tolak Langsung
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
