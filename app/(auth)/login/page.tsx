/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login failed");
        setLoading(false);
        return;
      }

      // Determine user role from the result (better-auth adds `role` to user)
      const data: any = result?.data ?? result;
      const role: string | undefined =
        data?.session?.user?.role ?? data?.user?.role ?? data?.user?.additionalFields?.role;

      // If user was redirected from a protected page, go back there
      const from = searchParams.get("from");
      const target =
        from && from.length > 0
          ? from
          : role === "ADMIN"
            ? "/templates"
            : "/dashboard";

      router.push(target);

      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Masuk ke nika.id</CardTitle>
        <CardDescription className="text-center">Masukkan email dan password Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Daftar di sini
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
