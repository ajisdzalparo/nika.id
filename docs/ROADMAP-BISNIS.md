# UNDANGIN YUK — model bisnis & roadmap

Keputusan pemilik produk (Nov 2026). Angka harga adalah usulan awal; ubah di sini bila berubah, lalu sesuaikan `lib/limits.ts`.

## Dua jalur jualan

| | Perorangan (B2C) | Agency / Mitra (B2B) |
|---|---|---|
| Siapa | Pasangan yang mau menikah | WO, MUA, fotografer, percetakan, vendor dekorasi |
| Cara bayar | Per undangan (paket) | Beli kuota undangan (grosir) atau langganan |
| Jumlah undangan | 1–3 (akad, resepsi, unduh mantu) | Puluhan–ratusan |
| Branding | Logo UNDANGIN YUK di footer | Logo/nama agency, white-label, domain sendiri (paket tinggi) |

Akun perorangan bisa mengajukan naik menjadi agency (verifikasi ringan oleh admin: nama usaha, Instagram, WA bisnis).

## Pricing perorangan (usulan)
| Paket | Harga | Tamu | Masa aktif | Kredit AI awal |
|---|---|---|---|---|
| Hemat | Rp 49rb | 100 | 90 hari | 1 |
| Premium | Rp 79rb | 300 | 180 hari | 5 |
| Eksklusif | Rp 99rb | Tanpa batas | 1 tahun (bukan selamanya) | 10 |

Kredit AI paket dijumlah per akun dari setiap undangan yang dibeli paketnya (mis. akad + resepsi Eksklusif = 20). Undangan yang diaktifkan dari kuota mitra tidak menambah kredit paket. Pembeli Eksklusif lama (sebelum Nov 2026) tetap aktif selamanya.

- Perpanjangan masa aktif Rp 25rb/tahun (belum dibangun). Add-on +100 tamu Rp 15rb. Upgrade bayar selisih.
- "Selamanya" dihapus: biaya server/storage tidak boleh tak terbatas dari bayaran sekali.

## Pricing agency (usulan)
1 kuota = 1 undangan setara Premium. Kuota berlaku 12 bulan.

| Paket | Harga | Kuota | Per undangan | Fitur |
|---|---|---|---|---|
| Mitra 10 | Rp 299rb | 10 | Rp 29,9rb | Logo di footer |
| Mitra 30 | Rp 749rb | 30 | Rp 25rb | + tim 3 orang, 50 kredit AI |
| Mitra 100 | Rp 1,99jt | 100 | Rp 19,9rb | + white-label penuh, domain sendiri |

Harga Mitra per undangan sengaja di bawah paket Hemat (Rp49rb) agar jadi mitra jelas lebih untung (Nov 2026). Kode promo MITRABARU: diskon 20% paket Mitra pertama.

Opsi langganan bulanan untuk agency besar (mis. Rp 499rb/bulan = 15 undangan/bulan).

## Fitur agency
1. Dashboard klien: semua undangan klien + status, tanggal acara, tamu, RSVP; cari & filter. (Dibangun di atas multi-undangan `/undangan` yang sudah ada.)
2. Undang klien ikut mengisi: link untuk pasangan mengisi data mempelai, foto, daftar tamu; agency memegang desain & publikasi.
3. Tim dengan peran (admin, desainer).
4. White-label: logo/nama agency; paket tinggi bisa subdomain/domain sendiri.
5. Template pribadi agency (dibuat dengan AI/editor), bisa dipakai ulang dan dijual di marketplace.
6. Laporan agency: undangan per bulan, sisa kuota, riwayat pembelian.

## Kredit AI (top-up)
- 1 kredit = 1 generate; generate dengan screenshot referensi = 2 kredit.
- Biaya model saat ini (Claude Opus 5.5) ≈ Rp 1.800 per generate → harga per kredit harus di atasnya.
- Paket: 10 kredit Rp 29rb · 30 kredit Rp 75rb · 100 kredit Rp 229rb (min ≈ Rp 2.290/kredit). Kredit tidak hangus, tidak bisa diuangkan.
- Referral tidak berlaku untuk top-up kredit AI: diskon + komisi membuat paket besar rugi terhadap biaya model.

## Referral & komisi
- Setiap user/agency punya kode. Pembeli: diskon 10% (maks Rp 15rb). Pemilik kode: komisi 15% dari nominal dibayar, maks Rp 100rb per transaksi (`REFERRAL_MAX_COMMISSION`). Tidak berlaku untuk kredit AI & marketplace.
- Komisi ditahan 7 hari (masa refund) sebelum bisa ditarik. Withdraw min Rp 50rb ke rekening/e-wallet, diproses admin dengan bukti.
- Anti-curang: tidak boleh pakai kode sendiri (akun/email/HP), batas komisi per bulan.
- Pajak komisi perorangan (PPh) → konsultasikan ke konsultan pajak sebelum rilis.

## Marketplace template
- Kreator (user/agency) kirim template → review admin (kualitas & orisinalitas, bukan salinan desain orang lain) → tayang dengan harga kreator (mis. Rp 15–49rb di luar paket).
- Fee platform 30% (kreator 70%); kreator top bisa 20%.
- Lisensi: satu pembelian = satu undangan, tidak boleh dijual ulang. Admin bisa takedown.

## Editor template tanpa AI (bertahap)
1. Editor section: urutan section, variasi layout, warna, font (di atas mesin tema `components/templates/ai-design`).
2. Lapisan ornamen drag & drop per section dari perpustakaan ornamen (aset diunggah admin), posisi relatif terhadap section agar rapi di HP.
3. Kanvas bebas penuh hanya bila nanti benar-benar dibutuhkan.

## Laporan keuangan admin
Satu buku besar (ledger) untuk semua uang: pendapatan per sumber (paket, add-on, perpanjangan, top-up AI, kuota agency, fee marketplace), kewajiban (komisi & saldo kreator belum ditarik), pengeluaran (withdraw dibayar, biaya payment gateway), bersih harian/bulanan, grafik, ekspor CSV.

## Urutan pengerjaan
0. Rapikan migration Prisma + jalankan saat deploy (sekarang deploy tidak menerapkan schema; migration tertinggal).
1. Fondasi dompet & ledger (saldo, entri ledger, withdraw).
2. Top-up kredit AI (pakai checkout Midtrans/manual yang ada).
3. Akun agency: jenis akun, kuota undangan, dashboard klien, undang klien ikut mengisi.
4. Referral & komisi.
5. Laporan keuangan admin.
6. Editor section + perpustakaan ornamen.
7. Template pribadi agency → marketplace.
