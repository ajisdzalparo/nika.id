"use client";

import { useState } from "react";
import { CheckCircle, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface GuestMessage {
  id: string;
  guestName: string;
  message: string;
  status: string;
  createdAt: string;
  user: {
    invitationSlug: string | null;
    name: string | null;
  };
}

interface ModerationClientProps {
  initialMessages: GuestMessage[];
}

export function ModerationClient({ initialMessages }: ModerationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!res.ok) throw new Error("Gagal menyetujui ucapan");

      toast.success("Ucapan disetujui");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus ucapan");

      toast.success("Ucapan dihapus");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tamu & Undangan</TableHead>
            <TableHead>Pesan Ucapan</TableHead>
            <TableHead>Waktu</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialMessages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                Belum ada ucapan tamu yang masuk.
              </TableCell>
            </TableRow>
          ) : (
            initialMessages.map((msg) => (
              <TableRow key={msg.id} className="group">
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{msg.guestName}</span>
                    <span className="text-xs text-muted-foreground font-mono">/{msg.user.invitationSlug || "(no slug)"}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <p className="text-sm italic text-muted-foreground break-all font-serif leading-relaxed">&ldquo;{msg.message}&rdquo;</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.createdAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={msg.status === "APPROVED" ? "default" : "secondary"} className="text-[10px]">
                    {msg.status === "APPROVED" ? "Disetujui" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {msg.status === "PENDING" && (
                      <Button variant="ghost" size="icon-sm" onClick={() => handleApprove(msg.id)} disabled={loading === msg.id} title="Setujui Ucapan">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" disabled={loading === msg.id} title="Hapus Ucapan">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Ucapan ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ucapan dari <strong>{msg.guestName}</strong> akan dihapus selamanya.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(msg.id)} className="bg-destructive hover:bg-destructive/90">
                            Hapus Sekarang
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
  );
}
