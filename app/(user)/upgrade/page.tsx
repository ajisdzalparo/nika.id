"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LIMITS, PlanType } from "@/lib/limits";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: unknown) => void;
          onPending: (result: unknown) => void;
          onError: (result: unknown) => void;
          onClose: () => void;
        },
      ) => void;
    };
  }
}

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: PlanType) => {
    setLoading(plan);

    try {
      const response = await fetch("/api/payment/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        setLoading(null);
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: function (result: unknown) {
          toast.success("Pembayaran berhasil!");
          router.push("/dashboard");
        },
        onPending: function (result: unknown) {
          toast.info("Menunggu pembayaran...");
        },
        onError: function (result: unknown) {
          toast.error("Pembayaran gagal!");
          setLoading(null);
        },
        onClose: function () {
          setLoading(null);
        },
      });
    } catch (error: unknown) {
      toast.error("Terjadi kesalahan");
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} />
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upgrade Akun Anda</h1>
        <p className="text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan pernikahan Anda.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {(Object.keys(PLAN_LIMITS) as PlanType[]).map((planKey) => {
          const plan = PLAN_LIMITS[planKey];
          const isFree = plan.price === 0;

          return (
            <Card key={planKey} className={`relative flex flex-col ${planKey === "GOLD" ? "border-primary shadow-lg" : ""}`}>
              {planKey === "GOLD" && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price)}</span>
                  {!isFree && <span className="text-muted-foreground"> / {plan.activeDays ? `${plan.activeDays} hari` : "selamanya"}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Hingga {plan.maxGuests === Infinity ? "Tak Terbatas" : plan.maxGuests} Tamu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{plan.maxGalleryPhotos === Infinity ? "Tak Terbatas" : plan.maxGalleryPhotos} Foto Galeri</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.canUseMusic ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className={plan.canUseMusic ? "" : "text-muted-foreground line-through"}>Musik Latar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.canUseRSVP ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className={plan.canUseRSVP ? "" : "text-muted-foreground line-through"}>RSVP & Ucapan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.canRemoveWatermark ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className={plan.canRemoveWatermark ? "" : "text-muted-foreground line-through"}>Tanpa Watermark</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.canUseLoveStory ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className={plan.canUseLoveStory ? "" : "text-muted-foreground line-through"}>Cerita Cinta (Love Story)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.canUseDigitalGift ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className={plan.canUseDigitalGift ? "" : "text-muted-foreground line-through"}>Amplop Digital</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={planKey === "GOLD" ? "default" : "outline"} disabled={isFree || loading !== null} onClick={() => handleUpgrade(planKey)}>
                  {loading === planKey && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isFree ? "Saat Ini" : "Pilih Paket"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
