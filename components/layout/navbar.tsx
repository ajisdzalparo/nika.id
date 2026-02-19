"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconMenu2, IconX, IconHeart } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Fitur", href: "/#features" },
  { name: "Template", href: "/templates" },
  { name: "Harga", href: "/#pricing" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b", isScrolled ? "bg-background/80 backdrop-blur-md border-border py-3" : "bg-transparent border-transparent py-5")}>
      <div className="container mx-auto px-4 md:px-6">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-110">
              <IconHeart size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              nika<span className="text-primary">.id</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Fitur
            </Link>
            <Link href="/templates" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Template
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Harga
            </Link>
            <Link href="/login" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              Masuk
            </Link>
            <Button asChild className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
              <Link href="/register">Buat Undangan</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <IconX size={28} /> : <IconMenu2 size={28} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-background border-b border-border overflow-hidden">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-lg font-medium text-muted-foreground hover:text-primary py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  {link.name}
                </Link>
              ))}
              <hr className="border-border" />
              <div className="flex flex-col gap-3 pt-2">
                <Button variant="outline" asChild className="w-full justify-center">
                  <Link href="/login">Masuk ke Akun</Link>
                </Button>
                <Button className="w-full justify-center" asChild>
                  <Link href="/register">Daftar Sekarang</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
