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
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg">
              <IconHeart size={24} fill="currentColor" />
            </motion.div>
            <span className="text-2xl font-bold text-foreground">
              nika<span className="text-primary">.id</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === link.href ? "text-primary" : "text-muted-foreground")}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button className="shadow-lg" asChild size="sm">
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
