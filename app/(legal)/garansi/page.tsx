import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Garansi 7 Hari · SatuMoment",
  description: "Uang kembali penuh dalam 7 hari selama undangan belum dibagikan.",
  alternates: { canonical: "/garansi" },
};

export default function GaransiPage() {
  return (
    <LegalPage
      eyebrow="Garansi"
      title="Uang kembali dalam 7 hari"
      updated="26 November 2026"
      intro={
        <p>
          Kami ingin kalian membeli dengan tenang. Bila undangan ternyata tidak sesuai harapan, ajukan pengembalian dana dalam 7 hari selama
          undangan belum dibagikan ke tamu.
        </p>
      }
    >
      <section>
        <h2>Syarat</h2>
        <ul>
          <li>Diajukan paling lambat 7 hari setelah pembayaran paket berhasil.</li>
          <li>Undangan belum dibagikan: belum dikirim ke tamu dan belum dibuka oleh tamu.</li>
          <li>Berlaku untuk pembelian paket undangan dan upgrade paket.</li>
        </ul>
      </section>

      <section>
        <h2>Tidak termasuk</h2>
        <ul>
          <li>Top-up Kredit Desain AI yang sudah dipakai.</li>
          <li>Kuota Mitra yang sudah dipakai untuk mengaktifkan undangan klien.</li>
          <li>Pesanan gratis dari kode promo atau kode uji coba.</li>
        </ul>
      </section>

      <section>
        <h2>Cara mengajukan</h2>
        <p>
          Kirim email ke {SUPPORT_EMAIL} atau hubungi admin lewat WhatsApp dengan menyebutkan email akun, judul undangan, dan nomor rekening
          atau e-wallet tujuan pengembalian. Kami memproses dalam 3 hari kerja. Setelah dana dikembalikan, undangan kembali ke mode pratinjau.
        </p>
      </section>
    </LegalPage>
  );
}
