"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconBuildingBank,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconPlus,
  IconQrcode,
  IconTrash,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { BankAccount, PaymentAndContactSettings } from "@/lib/system-settings";

interface SystemSettingsManagerProps {
  initialSettings: PaymentAndContactSettings;
}

export function SystemSettingsManager({ initialSettings }: SystemSettingsManagerProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.maintenanceMode);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const [manualWhatsapp, setManualWhatsapp] = useState(initialSettings.manualWhatsapp);
  const [manualBanks, setManualBanks] = useState<BankAccount[]>(
    initialSettings.manualBanks.length > 0
      ? initialSettings.manualBanks
      : [{ bank: "", number: "", holder: "" }],
  );

  const [midtransServerKey, setMidtransServerKey] = useState(initialSettings.midtransServerKey);
  const [midtransClientKey, setMidtransClientKey] = useState(initialSettings.midtransClientKey);
  const [midtransIsProduction, setMidtransIsProduction] = useState(initialSettings.midtransIsProduction);
  const [showServerKey, setShowServerKey] = useState(false);
  const [showClientKey, setShowClientKey] = useState(false);

  const [savingConfig, setSavingConfig] = useState(false);

  const handleToggleMaintenance = async (next: boolean) => {
    setTogglingMaintenance(true);
    setMaintenanceMode(next);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: next }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMaintenanceMode(!next);
        return toast.error(d.message || "Gagal memperbarui status maintenance");
      }
      setMaintenanceMode(Boolean(d.settings?.maintenanceMode));
      toast.success(next ? "Maintenance Mode diaktifkan" : "Maintenance Mode dimatikan");
    } catch {
      setMaintenanceMode(!next);
      toast.error("Gagal terhubung ke server");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const updateBankField = (idx: number, field: keyof BankAccount, value: string) => {
    setManualBanks((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  };

  const addBankRow = () => {
    if (manualBanks.length >= 10) return;
    setManualBanks((prev) => [...prev, { bank: "", number: "", holder: "" }]);
  };

  const removeBankRow = (idx: number) => {
    setManualBanks((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : [{ bank: "", number: "", holder: "" }];
    });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedBanks = manualBanks
      .map((b) => ({
        bank: b.bank.trim(),
        number: b.number.trim(),
        holder: b.holder.trim(),
      }))
      .filter((b) => b.bank || b.number || b.holder);

    const incomplete = cleanedBanks.find((b) => !b.bank || !b.number || !b.holder);
    if (incomplete) {
      toast.error("Lengkapi nama bank, nomor rekening, dan atas nama pada setiap baris rekening.");
      return;
    }

    setSavingConfig(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualWhatsapp: manualWhatsapp.replace(/\D/g, ""),
          manualBanks: cleanedBanks,
          midtransServerKey: midtransServerKey.trim(),
          midtransClientKey: midtransClientKey.trim(),
          midtransIsProduction,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        return toast.error(d.message || "Gagal menyimpan konfigurasi");
      }
      if (d.settings) {
        setManualWhatsapp(d.settings.manualWhatsapp ?? "");
        setManualBanks(
          d.settings.manualBanks?.length > 0
            ? d.settings.manualBanks
            : [{ bank: "", number: "", holder: "" }],
        );
        setMidtransServerKey(d.settings.midtransServerKey ?? "");
        setMidtransClientKey(d.settings.midtransClientKey ?? "");
        setMidtransIsProduction(Boolean(d.settings.midtransIsProduction));
      }
      toast.success("Konfigurasi pembayaran & WhatsApp tersimpan");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Aktifkan untuk mengunci sementara akses user saat update sistem</CardDescription>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                maintenanceMode
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {maintenanceMode ? "Aktif · User Dikunci" : "Normal"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Status Maintenance</p>
              <p className="text-sm text-muted-foreground">Saat aktif, user tidak dapat mengakses dashboard & editor undangan</p>
            </div>
            <div className="flex items-center gap-2.5">
              {togglingMaintenance && <IconLoader2 size={16} className="animate-spin text-muted-foreground" />}
              <Switch
                checked={maintenanceMode}
                disabled={togglingMaintenance}
                onCheckedChange={handleToggleMaintenance}
                aria-label="Aktifkan Maintenance Mode"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pembayaran & Kontak */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Pembayaran & Kontak</CardTitle>
          <CardDescription>Pengaturan nomor WhatsApp admin, rekening transfer manual, dan Midtrans Snap</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-7">
            {/* WhatsApp Admin (WA Biasa) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconBrandWhatsapp size={18} className="text-emerald-600" />
                <h4 className="font-semibold">WhatsApp Admin (Konfirmasi Manual)</h4>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-admin">Nomor WhatsApp Admin</Label>
                <Input
                  id="wa-admin"
                  value={manualWhatsapp}
                  onChange={(e) => setManualWhatsapp(e.target.value)}
                  placeholder="6281234567890"
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  Gunakan format internasional tanpa `+` atau spasi (contoh: `6281234567890`). Dipakai pada tombol konfirmasi WhatsApp di halaman pembayaran user.
                </p>
              </div>
            </div>

            {/* Rekening Transfer Manual */}
            <div className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IconBuildingBank size={18} className="text-[#8A6A2F]" />
                  <div>
                    <h4 className="font-semibold">Rekening Transfer Manual</h4>
                    <p className="text-xs text-muted-foreground">Rekening tujuan yang tampil saat user memilih metode Transfer Manual</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addBankRow} disabled={manualBanks.length >= 10}>
                  <IconPlus size={14} className="mr-1" /> Tambah Rekening
                </Button>
              </div>

              <div className="space-y-3">
                {manualBanks.map((bank, idx) => (
                  <div key={idx} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label htmlFor={`bank-name-${idx}`} className="text-xs">Bank</Label>
                      <Input
                        id={`bank-name-${idx}`}
                        value={bank.bank}
                        onChange={(e) => updateBankField(idx, "bank", e.target.value)}
                        placeholder="BCA / Mandiri"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bank-number-${idx}`} className="text-xs">Nomor Rekening</Label>
                      <Input
                        id={`bank-number-${idx}`}
                        value={bank.number}
                        onChange={(e) => updateBankField(idx, "number", e.target.value)}
                        placeholder="1234567890"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bank-holder-${idx}`} className="text-xs">Atas Nama</Label>
                      <Input
                        id={`bank-holder-${idx}`}
                        value={bank.holder}
                        onChange={(e) => updateBankField(idx, "holder", e.target.value)}
                        placeholder="PT Undangin Yuk"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBankRow(idx)}
                      aria-label="Hapus rekening"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Gateway Midtrans */}
            <div className="space-y-4 border-t pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IconQrcode size={18} className="text-[#8A6A2F]" />
                  <div>
                    <h4 className="font-semibold">Payment Gateway (Midtrans Snap)</h4>
                    <p className="text-xs text-muted-foreground">Kosongkan bila hanya ingin menerima Transfer Manual</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {midtransIsProduction ? "Production" : "Sandbox"}
                  </span>
                  <Switch
                    checked={midtransIsProduction}
                    onCheckedChange={setMidtransIsProduction}
                    aria-label="Mode Production Midtrans"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="midtrans-server">Midtrans Server Key</Label>
                <div className="relative">
                  <Input
                    id="midtrans-server"
                    type={showServerKey ? "text" : "password"}
                    value={midtransServerKey}
                    onChange={(e) => setMidtransServerKey(e.target.value)}
                    placeholder="SB-Mid-server-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowServerKey((v) => !v)}
                    aria-label={showServerKey ? "Sembunyikan Server Key" : "Lihat Server Key"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showServerKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="midtrans-client">Midtrans Client Key</Label>
                <div className="relative">
                  <Input
                    id="midtrans-client"
                    type={showClientKey ? "text" : "password"}
                    value={midtransClientKey}
                    onChange={(e) => setMidtransClientKey(e.target.value)}
                    placeholder="SB-Mid-client-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientKey((v) => !v)}
                    aria-label={showClientKey ? "Sembunyikan Client Key" : "Lihat Client Key"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showClientKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={savingConfig} className="w-full">
              {savingConfig && <IconLoader2 size={16} className="mr-2 animate-spin" />}
              Simpan Konfigurasi
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
