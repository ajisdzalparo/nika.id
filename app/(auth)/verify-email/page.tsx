"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconCircleCheck, IconAlertCircle, IconLoader2, IconSparkles } from "@tabler/icons-react";

import { Suspense } from "react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Token verifikasi tidak ditemukan");
        return;
      }

      try {
        // TODO: Implement email verification with better-auth
        // For now, simulate verification
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStatus("success");

        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push("/dashboard");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Verifikasi gagal");
      }
    };

    verifyEmail();
  }, [token, router]);

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center mb-6">
              <div className="relative">
                <div className="p-6 rounded-full bg-linear-to-br from-blue-50 to-purple-50 shadow-lg">
                  <IconLoader2 className="w-16 h-16 text-blue-500 animate-spin" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 bg-linear-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl animate-pulse" />
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-black text-center tracking-tight mb-4">Memverifikasi Email...</CardTitle>
            <CardDescription className="text-center text-gray-600">Mohon tunggu sebentar</CardDescription>
          </>
        );

      case "success":
        return (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="flex justify-center mb-6">
              <div className="relative">
                <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 0.6 }} className="p-6 rounded-full bg-linear-to-br from-green-50 to-emerald-50 shadow-lg">
                  <IconCircleCheck className="w-16 h-16 text-green-500" strokeWidth={1.5} />
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                >
                  <IconSparkles className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-black text-center tracking-tight">
              Email <span className="text-transparent bg-clip-text bg-linear-to-r from-green-500 to-emerald-500">Terverifikasi!</span>
            </CardTitle>

            <CardDescription className="text-center text-gray-600 mt-4">Selamat! Email Anda berhasil diverifikasi.</CardDescription>

            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-6 mt-8">
              <p className="text-sm text-green-700 text-center">
                Mengalihkan ke dashboard dalam <strong className="text-2xl font-black text-green-600">{countdown}</strong> detik...
              </p>
            </div>

            <Button onClick={() => router.push("/dashboard")} className="w-full h-12 mt-6 rounded-2xl bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg font-bold">
              Lanjut ke Dashboard
            </Button>
          </>
        );

      case "error":
        return (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="flex justify-center mb-6">
              <div className="p-6 rounded-full bg-linear-to-br from-red-50 to-pink-50 shadow-lg">
                <IconAlertCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-black text-center tracking-tight">
              Verifikasi <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-pink-500">Gagal</span>
            </CardTitle>

            <CardDescription className="text-center text-gray-600 mt-4">{errorMessage || "Terjadi kesalahan saat memverifikasi email"}</CardDescription>

            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mt-8">
              <p className="text-sm text-red-700 text-center">Link verifikasi mungkin sudah kadaluarsa atau tidak valid.</p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button onClick={() => router.push("/register")} className="w-full h-12 rounded-2xl bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg font-bold">
                Daftar Ulang
              </Button>
              <Button onClick={() => router.push("/login")} variant="outline" className="w-full h-12 rounded-2xl border-2 font-bold">
                Kembali ke Login
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-pink-200/40 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[35%] h-[35%] bg-purple-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-pink-400 to-purple-500 w-full" />

          <CardHeader className="pt-12 pb-8">{renderContent()}</CardHeader>
        </Card>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[80vh]">
          <IconLoader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
