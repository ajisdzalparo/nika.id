"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/common/number-input";
import { DEFAULT_PLAN_PRICES, PLAN_LIMITS, type PaidPlan, type PlanPrices } from "@/lib/limits";

const PLANS: PaidPlan[] = ["HEMAT", "PREMIUM", "EKSKLUSIF"];

/** Admin control for the price of each paid plan; checkout, landing page and the help chat read it. */
export function PlanPriceManager({ initialPrices }: { initialPrices: PlanPrices }) {
  const [values, setValues] = useState<Record<PaidPlan, string>>(() => ({
    HEMAT: String(initialPrices.HEMAT),
    PREMIUM: String(initialPrices.PREMIUM),
    EKSKLUSIF: String(initialPrices.EKSKLUSIF),
  }));
  const [saved, setSaved] = useState(initialPrices);
  const [busy, setBusy] = useState(false);
  const dirty = PLANS.some((p) => Number(values[p]) !== saved[p]);

  const save = async () => {
    setBusy(true);
    try {
      const planPrices = Object.fromEntries(PLANS.map((p) => [p, Number(values[p])])) as PlanPrices;
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planPrices }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.message || "Gagal menyimpan harga");
      setSaved(d.planPrices);
      toast.success("Harga paket diperbarui");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Harga Paket</CardTitle>
        <CardDescription>
          Berlaku langsung di halaman pembayaran, landing page, dan chat bantuan. Pesanan yang sudah dibuat tetap memakai harga lama. Harga harus
          naik dari Hemat ke Eksklusif.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p} className="space-y-1.5">
              <Label htmlFor={`price-${p}`}>{PLAN_LIMITS[p].name}</Label>
              <NumberInput
                id={`price-${p}`}
                value={values[p]}
                onValueChange={(v) => setValues((s) => ({ ...s, [p]: v }))}
                format="thousands"
                prefix="Rp"
                maxDigits={8}
                className="h-10"
              />
              <p className="text-xs text-[#8E8268]">Bawaan Rp{DEFAULT_PLAN_PRICES[p].toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
        <Button type="button" variant="ink" disabled={busy || !dirty} onClick={() => void save()}>
          {busy && <IconLoader2 className="animate-spin" />}
          Simpan harga
        </Button>
      </CardContent>
    </Card>
  );
}
