import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { landingDisplay, landingSans } from "@/lib/studio";
// Absolute base for canonical URLs and Open Graph / WhatsApp preview images; without it Next falls back to localhost
import { SITE_URL } from "@/lib/site";

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


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SatuMoment - Platform Undangan Digital",
  description: "Buat undangan pernikahan digital impianmu dengan mudah dan cepat.",
  applicationName: "SatuMoment",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: { siteName: "SatuMoment", type: "website", locale: "id_ID" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} ${mono.variable} ${landingDisplay.variable} ${landingSans.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
