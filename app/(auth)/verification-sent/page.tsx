"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconMail, IconLoader2, IconCircleCheck, IconAlertCircle, IconRefresh } from "@tabler/icons-react";

export default function VerificationSentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);

    try {
      // TODO: Implement resend logic with better-auth
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResendSuccess(true);
      setResendCooldown(60); // 60 seconds cooldown
    } catch {
      // Handle error
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-200/40 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[35%] h-[35%] bg-pink-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-purple-400 to-pink-500 w-full" />

          <CardHeader className="pt-12 pb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center mb-6">
              <div className="relative">
                <div className="p-6 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
                  <IconMail className="w-16 h-16 text-purple-500" strokeWidth={1.5} />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg"
                >
                  <IconCircleCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
                </motion.div>
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-black text-center tracking-tight">
              Cek Email <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Anda</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Kami telah mengirimkan link verifikasi ke <strong className="text-gray-900">{email}</strong>
              </p>

              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <IconAlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 text-left space-y-1">
                    <p className="font-semibold">Langkah selanjutnya:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-600">
                      <li>Buka inbox email Anda</li>
                      <li>Cari email dari nika.id</li>
                      <li>Klik tombol "Verifikasi Email"</li>
                    </ol>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500">Tidak menerima email?</p>
            </div>

            {/* Resend Button */}
            <Button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full h-12 rounded-2xl bg-white border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all text-purple-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <span className="flex items-center gap-2">
                  <IconLoader2 size={18} className="animate-spin" />
                  Mengirim ulang...
                </span>
              ) : resendCooldown > 0 ? (
                <span>Kirim ulang dalam {resendCooldown}s</span>
              ) : (
                <span className="flex items-center gap-2">
                  <IconRefresh size={18} />
                  Kirim Ulang Email
                </span>
              )}
            </Button>

            {resendSuccess && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-green-600 bg-green-50 p-3 rounded-xl border-2 border-green-100 text-center">
                ✓ Email verifikasi telah dikirim ulang!
              </motion.div>
            )}

            {/* Quick Links */}
            <div className="pt-4 border-t-2 border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-3">Buka email client:</p>
              <div className="flex gap-2 justify-center">
                <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 transition-colors">
                  Gmail
                </a>
                <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 transition-colors">
                  Outlook
                </a>
                <a href="https://mail.yahoo.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 transition-colors">
                  Yahoo
                </a>
              </div>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <button onClick={() => router.push("/login")} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                ← Kembali ke halaman login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
