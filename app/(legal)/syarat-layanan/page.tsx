import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, SUPPORT_EMAIL } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Syarat Layanan · SatuMoment",
  description: "Ketentuan memakai SatuMoment: akun, paket, pembayaran, konten, dan Program Mitra.",
};

export default function SyaratLayananPage() {
  return (
    <LegalPage
      eyebrow="Kebijakan"
      title="Syarat Layanan"
      updated="26 November 2026"
      intro={<p>Dengan membuat akun atau memakai SatuMoment, kalian menyetujui ketentuan berikut. Mohon dibaca sebelum membeli paket.</p>}
    >
      <section>
        <h2>1. Akun</h2>
        <ul>
          <li>Satu akun untuk satu orang atau satu usaha. Jaga kerahasiaan password kalian.</li>
          <li>Data yang kalian isi harus benar. Kami dapat menangguhkan akun yang dipakai untuk penipuan atau penyalahgunaan.</li>
        </ul>
      </section>

      <section>
        <h2>2. Paket dan pembayaran</h2>
        <ul>
          <li>Akun baru bisa membuat pratinjau undangan gratis. Pembayaran diperlukan saat undangan akan dibagikan ke tamu.</li>
          <li>Harga dibayar sekali per undangan, sesuai paket yang tertera di halaman pembayaran sebelum kalian membayar.</li>
          <li>Semua template katalog termasuk di setiap paket berbayar. Paket berbeda pada jumlah tamu, masa aktif, dan fitur.</li>
          <li>Upgrade paket cukup membayar selisih harga. Masa aktif dihitung sejak paket aktif.</li>
          <li>Kredit Desain AI tidak hangus dan tidak bisa diuangkan.</li>
        </ul>
      </section>

      <section>
        <h2>3. Garansi uang kembali</h2>
        <p>
          Pembayaran paket bisa dikembalikan penuh dalam 7 hari selama undangan belum dibagikan ke tamu. Ketentuan lengkapnya ada di halaman{" "}
          <Link href="/garansi" className="underline underline-offset-4">
            Garansi 7 hari
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>4. Konten undangan</h2>
        <ul>
          <li>Kalian bertanggung jawab atas foto, musik, video, dan teks yang diunggah, termasuk hak cipta dan izin dari orang di dalam foto.</li>
          <li>Dilarang memuat konten yang melanggar hukum, mengandung SARA, pornografi, atau menipu tamu (misalnya rekening amplop palsu).</li>
          <li>Kami dapat menyembunyikan konten atau ucapan tamu yang melanggar ketentuan ini.</li>
          <li>Desain template dan hasil Desain AI boleh kalian pakai untuk undangan kalian, tetapi tidak untuk dijual ulang sebagai template.</li>
        </ul>
      </section>

      <section>
        <h2>5. Program Mitra</h2>
        <ul>
          <li>Status Mitra diberikan oleh admin SatuMoment setelah pengajuan ditinjau, dan dapat dicabut bila ketentuan dilanggar.</li>
          <li>Mitra menentukan harga jual ke kliennya sendiri dan bertanggung jawab atas layanannya kepada klien.</li>
          <li>Kuota Mitra berlaku 12 bulan sejak pembelian dan tidak bisa diuangkan. Bonus kuota diberikan sesuai aturan yang tertera di dasbor Mitra.</li>
          <li>Kode uji coba Mitra hanya untuk akun Mitra yang menerimanya dan berlaku sampai tanggal yang tertera.</li>
        </ul>
      </section>

      <section>
        <h2>6. Ketersediaan layanan</h2>
        <p>
          Kami berusaha menjaga SatuMoment tetap berjalan, namun sesekali ada pemeliharaan atau gangguan. Fitur dapat diubah, ditambah, atau
          ditutup sementara; perubahan yang memengaruhi paket yang sudah dibeli akan kami beritahukan lebih dulu.
        </p>
      </section>

      <section>
        <h2>7. Batas tanggung jawab</h2>
        <p>
          Tanggung jawab kami terbatas pada nilai paket yang kalian bayar untuk undangan yang bersangkutan. Kami tidak bertanggung jawab atas
          kerugian akibat informasi acara yang salah diisi atau tautan yang dibagikan ke orang yang tidak dimaksud.
        </p>
      </section>

      <section>
        <h2>8. Kontak</h2>
        <p>Pertanyaan tentang ketentuan ini dapat dikirim ke {SUPPORT_EMAIL}.</p>
      </section>
    </LegalPage>
  );
}
