import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi · SatuMoment",
  description: "Data apa yang SatuMoment kumpulkan, untuk apa, dan bagaimana kami menjaganya.",
};

export default function KebijakanPrivasiPage() {
  return (
    <LegalPage
      eyebrow="Kebijakan"
      title="Kebijakan Privasi"
      updated="26 November 2026"
      intro={
        <p>
          SatuMoment membantu kalian membuat dan membagikan undangan pernikahan digital. Halaman ini menjelaskan data yang kami simpan,
          alasannya, dan hak kalian atas data tersebut, sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.
        </p>
      }
    >
      <section>
        <h2>1. Data yang kami kumpulkan</h2>
        <ul>
          <li>
            <b>Data akun:</b> nama, email, password (tersimpan dalam bentuk terenkripsi), dan nomor WhatsApp bila diisi.
          </li>
          <li>
            <b>Isi undangan:</b> nama mempelai dan keluarga, tanggal dan lokasi acara, foto, video, musik, cerita, dan rekening amplop digital
            yang kalian masukkan.
          </li>
          <li>
            <b>Data tamu:</b> nama dan nomor WhatsApp tamu yang kalian tambahkan, serta RSVP, ucapan, dan status check-in yang dikirim tamu.
          </li>
          <li>
            <b>Data transaksi:</b> paket yang dibeli, nominal, dan status pembayaran. Data kartu atau rekening pembayaran diproses oleh
            Midtrans dan tidak kami simpan.
          </li>
          <li>
            <b>Data teknis:</b> alamat IP, jenis perangkat, dan waktu akses untuk keamanan dan mencegah penyalahgunaan.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Untuk apa data dipakai</h2>
        <ul>
          <li>Menampilkan undangan kepada tamu yang kalian undang.</li>
          <li>Mengirim email akun (verifikasi, reset password) dan notifikasi pesanan.</li>
          <li>Memproses pembayaran dan membuat laporan keuangan internal.</li>
          <li>Membantu kalian lewat chat bantuan dan memperbaiki layanan.</li>
        </ul>
        <p>Kami tidak menjual data kalian atau data tamu kepada siapa pun dan tidak memakainya untuk iklan pihak lain.</p>
      </section>

      <section>
        <h2>3. Data tamu</h2>
        <p>
          Kalian adalah pihak yang memasukkan data tamu, jadi pastikan tamu tidak keberatan nomornya dipakai untuk mengirim undangan. Nomor
          WhatsApp tamu hanya dipakai untuk fitur yang kalian jalankan sendiri, seperti mengirim tautan undangan, dan tidak kami hubungi
          untuk keperluan lain.
        </p>
      </section>

      <section>
        <h2>4. Pihak yang ikut memproses data</h2>
        <ul>
          <li>Midtrans, untuk pembayaran otomatis.</li>
          <li>Penyedia server dan penyimpanan file tempat aplikasi dan foto undangan disimpan.</li>
          <li>Penyedia layanan email untuk mengirim email akun.</li>
          <li>Penyedia model AI untuk fitur Desain AI. Yang dikirim hanya deskripsi desain dan gambar referensi yang kalian unggah.</li>
        </ul>
        <p>
          Bila undangan dibuat oleh Mitra (wedding organizer, studio, atau reseller), Mitra tersebut juga dapat melihat data undangan dan
          tamunya untuk membantu kalian.
        </p>
      </section>

      <section>
        <h2>5. Berapa lama data disimpan</h2>
        <p>
          Data undangan disimpan selama akun aktif. Setelah masa aktif paket berakhir, undangan tidak lagi tampil untuk publik. Kalian bisa
          meminta penghapusan akun beserta semua undangan, tamu, dan foto kapan saja. Data transaksi tetap kami simpan sesuai kewajiban
          pencatatan keuangan.
        </p>
      </section>

      <section>
        <h2>6. Hak kalian</h2>
        <p>
          Kalian berhak melihat, memperbaiki, mengunduh, dan meminta penghapusan data pribadi kalian. Sebagian besar bisa dilakukan sendiri
          di menu Pengaturan dan Daftar Tamu; untuk permintaan lain kirim email ke {SUPPORT_EMAIL}. Kami menanggapi paling lambat 3 × 24 jam
          hari kerja.
        </p>
      </section>

      <section>
        <h2>7. Keamanan</h2>
        <p>
          Koneksi ke SatuMoment dienkripsi (HTTPS), password disimpan dalam bentuk hash, dan akses admin dibatasi. Bila terjadi kebocoran data
          yang berdampak pada kalian, kami akan memberi tahu lewat email.
        </p>
      </section>

      <section>
        <h2>8. Perubahan kebijakan</h2>
        <p>Bila kebijakan ini berubah, tanggal di atas diperbarui dan perubahan penting kami umumkan lewat email atau notifikasi di aplikasi.</p>
      </section>
    </LegalPage>
  );
}
