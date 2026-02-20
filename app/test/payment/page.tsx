"use client";

import { useEffect, useState } from "react";
import { getPendingTransactions, simulateWebhook } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";

type Transaction = Awaited<ReturnType<typeof getPendingTransactions>>[0];

export default function TestPaymentPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const transactions = await getPendingTransactions();
      setData(transactions);
    } catch {
      toast.error("Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async (id: string) => {
    setProcessing(id);
    try {
      await simulateWebhook(id);
      toast.success("Webhook berhasil disimulasikan! Status transaksi diperbarui.");
      await fetchData();
    } catch {
      toast.error("Gagal mensimulasikan webhook");
    } finally {
      setProcessing(null);
    }
  };

  if (process.env.NODE_ENV === "production") {
    return <div className="p-10 text-center">Halaman ini hanya tersedia di mode development.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Payment Simulator</h1>
          <p className="text-muted-foreground">Simulasi pembayaran Midtrans untuk development</p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Tidak ada transaksi PENDING ditemukan. Silakan buat transaksi baru di halaman Upgrade.</CardContent>
          </Card>
        ) : (
          data.map((trx) => (
            <Card key={trx.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{trx.plan} Plan</span>
                  <span className="text-lg font-mono">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(trx.amount)}</span>
                </CardTitle>
                <CardDescription>
                  Order ID: {trx.id} • User: {trx.user.name} ({trx.user.email})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => handleSimulate(trx.id)} disabled={processing === trx.id}>
                    {processing === trx.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simulate Success (Settlement)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
