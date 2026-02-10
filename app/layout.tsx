import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nika.id - Professional Digital Wedding Invitation",
  description: "Create your beautiful, elegant, and professional digital wedding invitation with Nika.id. Fast, easy, and premium designs.",
  keywords: ["undangan digital", "wedding invitation", "nika.id", "undangan online", "pernikahan"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
