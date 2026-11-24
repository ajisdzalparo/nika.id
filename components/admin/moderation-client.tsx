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
  invitation?: { slug: string | null } | null;
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
                    <span className="text-xs text-muted-foreground font-mono">
                      {msg.invitation?.slug || msg.user.invitationSlug ? `/${msg.invitation?.slug || msg.user.invitationSlug}` : "Undangan tidak diketahui"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="min-w-[220px] max-w-[320px] whitespace-normal">
                  <p className="text-sm italic text-muted-foreground wrap-break-word font-serif leading-relaxed">&ldquo;{msg.message}&rdquo;</p>
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
                  {/* Always visible: hover-only actions are unreachable on touch screens */}
                  <div className="flex items-center justify-end gap-1.5">
                    {msg.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(msg.id)}
                        disabled={loading === msg.id}
                        aria-label={`Setujui ucapan dari ${msg.guestName}`}
                        className="h-8 gap-1 rounded-full text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" /> Setujui
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 rounded-full text-destructive hover:bg-destructive/10"
                          disabled={loading === msg.id}
                          aria-label={`Hapus ucapan dari ${msg.guestName}`}
                        >
                          <Trash2 className="h-4 w-4" /> Hapus
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
