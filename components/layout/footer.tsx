import Link from "next/link";
import { IconHeart, IconBrandInstagram, IconBrandWhatsapp, IconBrandTiktok } from "@tabler/icons-react";

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <IconHeart size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-foreground">
                nika<span className="text-primary">.id</span>
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-xs">Membantu setiap pasangan menciptakan undangan digital yang indah dan berkesan untuk hari bahagia mereka.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <IconBrandInstagram size={20} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <IconBrandTiktok size={20} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <IconBrandWhatsapp size={20} />
              </Link>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold mb-6 text-foreground">Produk</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Fitur
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-muted-foreground hover:text-primary transition-colors">
                  Template
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Harga
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Resource Column */}
          <div>
            <h4 className="font-bold mb-6 text-foreground">Bantuan</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="text-muted-foreground hover:text-primary transition-colors">
                  Kontak
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="text-muted-foreground hover:text-primary transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="text-muted-foreground hover:text-primary transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold mb-6 text-foreground">Momen Bahagia</h4>
            <p className="text-muted-foreground mb-6">Dapatkan inspirasi pernikahan dan tips undangan langsung di email Anda.</p>
            <div className="flex gap-2 p-1 bg-card border border-border rounded-xl focus-within:border-primary/50 transition-all">
              <input type="email" placeholder="Email anda" className="bg-transparent px-3 py-2 text-sm outline-none grow text-foreground placeholder:text-muted-foreground" />
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors">Kirim</button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Nika.id. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-1">
            Dibuat dengan <IconHeart className="text-primary fill-primary" size={14} /> untuk Cinta
          </div>
        </div>
      </div>
    </footer>
  );
}
