import Link from "next/link";
import { IconHeart, IconBrandInstagram, IconBrandWhatsapp, IconBrandTiktok } from "@tabler/icons-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white">
                <IconHeart size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-bold">
                nika<span className="text-pink-500">.id</span>
              </span>
            </Link>
            <p className="text-slate-600 leading-relaxed max-w-xs">Membantu setiap pasangan menciptakan undangan digital yang indah dan berkesan untuk hari bahagia mereka.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:text-pink-500 transition-colors">
                <IconBrandInstagram size={20} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:text-pink-500 transition-colors">
                <IconBrandTiktok size={20} />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:text-pink-500 transition-colors">
                <IconBrandWhatsapp size={20} />
              </Link>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Produk</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/#features" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Fitur
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Template
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Harga
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Resource Column */}
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Bantuan</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/faq" className="text-slate-600 hover:text-pink-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Kontak
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="text-slate-600 hover:text-pink-500 transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Momen Bahagia</h4>
            <p className="text-slate-600 mb-6">Dapatkan inspirasi pernikahan dan tips undangan langsung di email Anda.</p>
            <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl focus-within:border-pink-300 transition-all">
              <input type="email" placeholder="Email anda" className="bg-transparent px-3 py-2 text-sm outline-none grow" />
              <button className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors">Kirim</button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Nika.id. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-1">
            Dibuat dengan <IconHeart className="text-pink-500 fill-pink-500" size={14} /> untuk Cinta
          </div>
        </div>
      </div>
    </footer>
  );
}
