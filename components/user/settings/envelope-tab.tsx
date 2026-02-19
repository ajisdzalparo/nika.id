"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { IconLoader } from "@tabler/icons-react";
import { UpgradeBanner } from "../upgrade-banner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { WeddingData } from "@/types/wedding";

interface EnvelopeTabProps {
  invitation: { data: WeddingData };
  isEnabled: boolean;
}

export function EnvelopeTab({ invitation, isEnabled }: EnvelopeTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    if (invitation?.data) {
      const bankAccount = invitation.data.gifts?.bankAccounts?.[0];
      if (bankAccount) {
        setBankName(bankAccount.bankName || "");
        setAccountNumber(bankAccount.accountNumber || "");
        setAccountHolder(bankAccount.accountHolder || "");
      }
    }
  }, [invitation]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentData = invitation?.data || {};
      const newData = {
        ...currentData,
        gifts: {
          ...currentData.gifts,
          enabled: true,
          bankAccounts: [
            {
              bankName,
              accountNumber,
              accountHolder,
            },
          ],
        },
      };

      const res = await fetch("/api/user/invitation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newData }),
      });

      if (!res.ok) throw new Error("Gagal update pengaturan");
      toast.success("Pengaturan amplop berhasil disimpan");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabsContent value="envelope" className="mt-0">
      {!isEnabled ? (
        <UpgradeBanner feature="Amplop Digital" plan="Gold" />
      ) : (
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
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
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank BCA"
                className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number" className="text-xs font-bold text-zinc-500 uppercase">
                Nomor Rekening
              </Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name" className="text-xs font-bold text-zinc-500 uppercase">
                Atas Nama
              </Label>
              <Input
                id="account-name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nama Pemilik"
                className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary"
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto rounded-lg mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <IconLoader className="animate-spin w-4 h-4 mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
