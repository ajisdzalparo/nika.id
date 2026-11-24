import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Absolute base for Open Graph / WhatsApp preview images; without it Next falls back to localhost
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://undanginyuk.ajisdzalparo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "UNDANGIN YUK - Platform Undangan Digital",
  description: "Buat undangan pernikahan digital impianmu dengan mudah dan cepat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} ${mono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
