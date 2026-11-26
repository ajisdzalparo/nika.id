# SatuMoment — model bisnis & roadmap

Keputusan pemilik produk, diperbarui 26 Nov 2026. Harga di sini adalah nilai awal; setelah harga bisa diatur
dari admin (lihat "Urutan pengerjaan"), admin yang jadi sumber kebenaran dan `lib/limits.ts` hanya default.

Prinsip: **harga selalu terlihat sebelum pelanggan memilih**, tidak ada biaya kejutan setelah mereka mengedit.

## Dua jalur jualan

| | Perorangan (B2C) | Mitra (B2B: WO, MUA, foto studio, percetakan, reseller perorangan) |
|---|---|---|
| Cara bayar | Per undangan (paket) | Mulai gratis (uji coba) → bonus kuota dari klien → beli kuota grosir |
| Jumlah undangan | 1–3 (akad, resepsi, unduh mantu) | Puluhan–ratusan |
| Branding | Logo SatuMoment di footer | Nama usaha di footer; tanpa logo SatuMoment di Mitra Kuota tinggi |

Jalur Mitra adalah mesin utama (pembelian berulang); B2C dari mulut ke mulut dan referral.

## Pricing perorangan

| Paket | Harga | Template | Tamu | Masa aktif | Video / love story | Kredit AI | Tanpa watermark |
|---|---|---|---|---|---|---|---|
| Hemat | Rp 49rb | Semua | 100 | 90 hari | – | 1 | – |
| Premium | Rp 129rb | Semua | 300 | 180 hari | Love story | 5 | – |
| Eksklusif | Rp 159rb | Semua | Tanpa batas | 1 tahun | Keduanya | 10 | ✓ |

- **Semua template katalog terbuka di semua paket berbayar.** Paket dibedakan dari fasilitas, bukan dari desain.
  Hemat dipertahankan untuk pasar menengah ke bawah.
- **Harga paket bisa diatur admin** tanpa deploy.
- Akun gratis tetap bisa membuat pratinjau lengkap; bayar saat undangan mau dipublikasikan.
- **Garansi uang kembali 7 hari** selama undangan belum dipublikasikan.
- Perpanjangan masa aktif Rp 25rb/tahun dan add-on +100 tamu Rp 15rb (keduanya di /upgrade). Upgrade bayar selisih.

## Program Mitra

Satu program dengan tahapan, untuk usaha (WO, studio, MUA, percetakan) maupun **reseller perorangan**
(teman/kenalan yang ikut menjual tanpa punya usaha).

**Status Mitra hanya diberikan admin** (✓ dibangun): lewat form di landing page / halaman Mitra → disetujui di
`/admin/mitra`, atau setelah ngobrol di WhatsApp → tombol "Jadikan Mitra" di `/admin/users`. User tidak bisa
mengaktifkan sendiri; kuota grosir, link mitra berbonus, dan menu Mitra hanya untuk akun yang disetujui.

1. **Uji coba (gratis).** Pengajuan lewat form di landing page → admin verifikasi ringan
   (nama usaha/nama, Instagram, WA) → admin beri kode promo 100% untuk 2–3 undangan, berlaku terbatas
   (mis. 30 hari).
2. **Mitra Referral (gratis gabung).** Mitra punya kode/link. Klien membeli paket lewat link mitra dengan harga
   normal (**tanpa diskon klien**: mitra menentukan harga ke kliennya sendiri). Imbalan mitra berupa
   **bonus kuota**, bukan uang: setiap 3 klien membeli → 1 undangan gratis (setara Premium). Tidak ada
   uang keluar, penarikan, atau urusan pajak.
3. **Mitra Kuota (beli di depan)** untuk yang sudah rutin menjual:

   | Paket | Harga | Kuota | Per undangan |
   |---|---|---|---|
   | Mitra 10 | Rp 299rb | 10 | Rp 29,9rb |
   | Mitra 30 | Rp 749rb | 30 | Rp 25rb (+50 kredit AI) |
   | Mitra 100 | Rp 1,99jt | 100 | Rp 19,9rb (+150 kredit AI) |

   1 kuota = 1 undangan setara Premium, berlaku 12 bulan.

- **Laporan penjualan mitra**: mitra mencatat harga jual ke tiap klien; dashboard menampilkan
  jumlah klien, omzet, modal (nilai kuota terpakai), dan untung per bulan.
- Nama usaha mitra tampil di footer undangan klien.
- Komisi uang bisa ditambahkan nanti untuk mitra besar yang memintanya (lihat "Pajak").

## Referral pengguna biasa

- Bukan mitra: **hanya diskon** untuk teman yang diajak (10%, maks Rp 15rb). Tanpa komisi uang.
- Komisi uang yang sudah tercatat sebelum keputusan ini tetap bisa ditarik; minimal penarikan **Rp 50rb**.

## Kredit AI (top-up)
- 1 kredit = 1 generate; generate dengan screenshot referensi = 2 kredit.
- Biaya model desain (Claude Sonnet 5.5 + prompt caching) ≈ Rp 420–510 per generate; cek kemiripan
  memakai Claude Haiku 5.5 (jauh lebih murah).
- Paket: 10 kredit Rp 29rb · 30 kredit Rp 75rb · 100 kredit Rp 229rb. Kredit tidak hangus, tidak bisa diuangkan.
- Referral tidak berlaku untuk top-up kredit AI.

## Marketplace template — ditunda
- Status fitur **Segera hadir** + survei minat ke pengguna. Dibuka setelah ±100 pelanggan berbayar.
- Saat dibuka: tab **"Template Kreator"** terpisah dari katalog, harga terlihat di setiap kartu,
  "di luar paket, sekali beli untuk 1 undangan".
- Kreator kirim template → review admin (kualitas & orisinalitas) → tayang. Fee platform 30%.

## Kepercayaan & legal
- Halaman **Kebijakan Privasi** dan **Syarat Layanan** (data nomor HP tamu, UU PDP), garansi 7 hari.
- Kontak bantuan publik: `admin@satumoment.com` + satu nomor WA bisnis.
- **Pajak:** belum diputuskan. Selama imbalan mitra berupa kuota, tidak ada pembayaran tunai ke pihak luar.

## Laporan keuangan admin
Satu buku besar (ledger) untuk semua uang: pendapatan per sumber (paket, add-on, perpanjangan, top-up AI,
kuota mitra, fee marketplace), kewajiban (saldo belum ditarik), pengeluaran (penarikan dibayar, biaya
payment gateway, biaya operasional), bersih harian/bulanan, grafik, ekspor.

## Urutan pengerjaan (berikutnya)
1. ✓ Semua template terbuka di semua paket berbayar; harga baru Hemat 49 / Premium 129 / Eksklusif 159.
2. ✓ Marketplace "Segera hadir" + survei minat (kartu di /pilih-template, hasil di /admin/pengaturan-admin).
3. ✓ Referral pengguna biasa jadi diskon saja; klien mitra tanpa diskon; imbalan mitra = bonus kuota
   (`MITRA_BONUS_EVERY` di `lib/limits.ts`, dihitung saat pembayaran klien aktif).
4. ✓ Harga paket diatur dari admin (/admin/pengaturan-admin → Harga Paket).
5. ✓ Kode promo 100% (order gratis tanpa gateway); kode uji coba khusus akun mitra dibuat saat admin menyetujui pengajuan.
6. ✓ Import Excel/CSV daftar tamu (template di dialog Impor Excel).
7. ✓ Laporan penjualan mitra di /mitra (harga jual, modal, untung per bulan) + akun klien per undangan.
8. ✓ Halaman /kebijakan-privasi, /syarat-layanan, /garansi (refund masih diproses manual oleh admin).
