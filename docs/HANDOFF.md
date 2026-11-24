# undangin yuk — konteks proyek untuk AI berikutnya

Salin seluruh file ini ke AI lain sebagai konteks awal. Ditulis 20 Nov 2026. Semua perubahan di bawah **belum di-commit** (branch `dev`, main branch `prod`).


> **Model bisnis & roadmap yang disepakati** (dua jalur jualan: perorangan B2C dan agency B2B, pricing, kredit AI, referral, marketplace, urutan pengerjaan): lihat [`docs/ROADMAP-BISNIS.md`](ROADMAP-BISNIS.md).

## Produk
SaaS undangan pernikahan digital (Indonesia) dengan nama brand **UNDANGIN YUK**. User mendaftar (email/password atau Google), membuat undangan dengan **Desain AI** atau **memakai template katalog**, mengisi data, lalu membagikan link `/<invitationSlug>?to=<nama tamu>` lewat WhatsApp. Ada RSVP + ucapan tamu, amplop digital, musik (YouTube atau upload audio ke S3/MinIO), galeri, countdown. Monetisasi: paket per acara (`HEMAT` Rp49rb / `PREMIUM` Rp79rb / `EKSKLUSIF` Rp99rb + add-on `+100 tamu` Rp15rb di `lib/limits.ts`, `FREE` hanya untuk mode pratinjau sebelum bayar).

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · Prisma 6 + PostgreSQL · better-auth (email + Google OAuth, plugin admin) · MinIO (S3) untuk upload · Midtrans (pembayaran) · nodemailer + Gmail SMTP (email verifikasi) · `@anthropic-ai/sdk` (Claude Opus 5.5, structured output) · Bun sebagai package manager.

## Menjalankan lokal
```
docker compose up -d postgres minio      # Postgres :5433, MinIO :9000 (console :9001)
bun run db:migrate && bunx prisma generate   # JANGAN db push lagi (lihat "Database migration")
bun run dev                              # http://localhost:3000
```
`.env` wajib: `DATABASE_URL` (postgresql://nikaid:nikaid_password@localhost:5433/nikaid), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID/SECRET`, `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED="true"`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM_NAME`, `MINIO_*` (lihat `.env.example`), `ANTHROPIC_API_KEY` (belum diisi → generate AI belum pernah dites end-to-end).

**Jebakan Windows:** `prisma generate` gagal `EPERM` saat dev server jalan (file engine terkunci). File `index.js/.d.ts` tetap tertulis; cukup restart dev server. Turbopack kadang menyimpan modul server lama di memori → kalau perubahan tidak terbaca, ubah isi file sumbernya sedikit atau restart.
**Admin:** role disimpan di `User.role` (`"admin"`). Ubah via `docker exec nikaid-postgres psql -U nikaid -d nikaid -c "UPDATE \"User\" SET role='admin' WHERE email='...';"` lalu login ulang.

## Peta kode penting
- **Auth**: `lib/auth.ts` (Google, account linking, hook auto `invitationSlug`, email verifikasi via Gmail), `lib/auth-client.ts`, `middleware.ts` (rute terproteksi).
- **Mesin tema AI** (inti produk):
  - `lib/ai-design/schema.ts` — skema Zod tema (palet, font kurasi, ornamen, layout per section, copy). AI hanya memilih opsi kurasi, **tidak menulis kode**.
  - `lib/ai-design/prompt.ts` — system prompt art director + instruksi screenshot referensi.
  - `lib/ai-design/generate.ts` — panggil Claude (`messages.parse` + `zodOutputFormat`), terima ≤3 screenshot referensi (hanya URL dari storage sendiri, anti-SSRF).
  - `lib/ai-design/color.ts` — `normalizeTheme` (validasi + perbaikan kontras). Wajib dipakai.
  - `lib/ai-design/presets.ts` — 4 tema contoh. `lib/ai-design/server.ts` — kuota (`source: "AI"` saja yang dihitung).
  - `components/templates/ai-design/` — renderer: `index.tsx`, `sections.tsx` (cover 5 varian, mempelai 4, acara 3, galeri 3, story, video, gift, RSVP + daftar ucapan, closing, bottom nav), `ornaments.tsx` (SVG + foil metalik), `theme.ts` (font Google, tekstur), `cover-thumb.tsx` (thumbnail render asli).
- **Katalog/CMS**: model `CatalogTemplate` (kind `ENGINE` = tema JSON, `CODE` = komponen di `components/templates`). `lib/catalog.ts` (seed otomatis, `getCatalog`), `lib/catalog-shared.ts` (tipe aman untuk client). Admin: `app/admin/(panel)/templates` (list, `tambah`, `[id]`, `dari-user`), API `app/api/admin/catalog/*` (CRUD, `generate`, `from-design`). Publik: `app/desain` (karosel unggulan + deretan Netflix-style), preview `app/preview/t/[slug]`. User: `app/(user)/pilih-template` + `app/api/user/catalog/[slug]/use` (salin tema ke `AiDesign` source `CATALOG`, tanpa kuota).
- **Desain AI user**: `app/(user)/desain-ai`, `components/user/ai-design-studio.tsx`, API `app/api/ai/design` (+ `[id]/apply`).
- **Undangan publik**: `app/[slug]/page.tsx` (lampirkan `aiTheme` + `wishes`), `components/template-renderer.tsx`, `components/templates/registry.ts`.
- **RSVP**: `lib/rsvp.ts` — API `/api/public/submit` butuh `type: "RSVP" | "MESSAGE"`, attendance `HADIR` / `TIDAK HADIR`.
- **Upload**: `lib/storage.ts` (MinIO), `app/api/upload/image|audio`, komponen `components/admin/image-upload-field.tsx`, `components/common/reference-uploader.tsx`.
- **UI/desain**: palet gading-tinta-emas. Lingkup `.studio` di `app/globals.css` memetakan ulang warna Tailwind (zinc/gray/pink/purple/amber) + token shadcn; `lib/studio.ts` (font Cormorant Garamond + token sidebar). Landing: `app/page.tsx` + `components/landing/*`. Dashboard: `app/(user)/dashboard`, `components/user-sidebar.tsx`, `components/site-header.tsx`. Aturan desain anti-slop: `.claude/skills/invitation-design/SKILL.md` (**baca sebelum mengubah UI**).

## Sudah selesai di sesi ini
Google login · Gmail SMTP · Postgres lokal · Desain AI (mesin tema, studio, kuota, preset, base prompt + konteks gaya) · redesign landing, dashboard, semua halaman user/auth/admin · rebrand ke **UNDANGIN YUK** · karosel desain & animasi landing + template (reveal kiri/kanan/scale + gerak ornamen lembut + layout desktop split responsif) · editor undangan redesign + musik latar YouTube/upload S3 + musik default per template & di pengaturan superadmin (show/hide) · fix `next/image` unoptimized untuk MinIO lokal · toast Sonner tema studio · pricing baru (`HEMAT` Rp49rb / `PREMIUM` Rp79rb / `EKSKLUSIF` Rp99rb, bayar selisih upgrade, add-on +100 tamu Rp15rb, pratinjau pemilik `?preview=1` sebelum bayar) · **multi-undangan per akun** (`/undangan`, buat/edit/hapus undangan, pilih undangan aktif, toggle `isPublic` untuk memilih yang dibagikan, tamu/RSVP/ucapan/pembayaran per undangan) · upload aset gambar tema di admin + tombol "Jadikan admin" di `/admin/users` · hapus route berisiko `app/api/templates/upload` · verifikasi email asli · pemilih lokasi peta di editor acara · login admin terpisah di `/admin/login` · fallback thumbnail rusak (`components/common/safe-img.tsx`) · upgrade paket via transfer manual + Midtrans · metode bayar diatur super admin di `/admin/pengaturan-admin` (`components/admin/system-settings-manager.tsx`): switch Transfer bank / QRIS manual / Midtrans, rekening, gambar QRIS statis (`manual_qris_image`), WhatsApp; disimpan di tabel `SystemSetting` (`lib/system-settings.ts`). `lib/midtrans.ts` membedakan `enabled` (kunci ada → webhook & status tetap jalan) dan `checkoutEnabled` (boleh membuat pembayaran baru).

## Belum dikerjakan / keputusan tertunda
1. Catatan peta: tile `tile.openstreetmap.org` dan Nominatim punya batas pemakaian; untuk trafik besar pakai penyedia tile/geocoding berbayar (mis. MapTiler) lewat env.
2. ~~Migration tertinggal~~ — selesai 23 Nov 2026 (baseline + migrate otomatis saat container start). Belum dites di server produksi: cek log container `[db-migrate]` saat deploy pertama.
3. Production env (Coolify): isi `GOOGLE_*`, `GMAIL_*`, `MINIO_*` (SSL, port 443), `ANTHROPIC_API_KEY`.
4. Gambar `public/templates/*.png` masih berisi foto placeholder, bukan screenshot template — ganti. (Catatan: `components/home/testimonials.tsx` sudah tidak dipakai di landing baru.)

## Konvensi
- Bahasa UI: Indonesia yang hangat dan sopan. Mobile-first (375px), tap target ≥44px.
- Jangan menyalin desain/aset/kode situs lain; referensi hanya untuk inspirasi gaya.
- Verifikasi tiap perubahan UI di browser (lebar 375px dan desktop) + `tsc --noEmit` + eslint.

## Database migration (sejak 23 Nov 2026)
- Schema diterapkan lewat **Prisma Migrate**, bukan `db push`. Migration baseline: `prisma/migrations/20261123000000_baseline` (seluruh schema per 23 Nov). Migration lama Februari diarsipkan di `prisma/migrations_legacy` (tidak dipakai).
- `scripts/db-migrate.mjs` (`bun run db:migrate`) dijalankan otomatis oleh container sebelum `server.js` (lihat `Dockerfile`, Prisma CLI dipasang di `/opt/db`; set `SKIP_DB_MIGRATE=true` untuk melewati). Database lama hasil `db push` dideteksi lewat SQL, disinkronkan sekali ke `prisma/baseline.prisma` (gagal bila ada risiko hapus data), baseline ditandai applied, lalu `migrate deploy`.
- Menambah perubahan schema: ubah `prisma/schema.prisma`, lalu `bun run db:migrate:new -- --name <nama>` (butuh DB lokal), commit folder migration-nya. Jangan pakai `db push` lagi.

## Ledger & dompet (sejak 23 Nov 2026)
- `LedgerEntry` (buku besar: `PLATFORM_REVENUE` dan `USER_EARNINGS`, jumlah bertanda, kunci idempoten `key`) dan `WithdrawalRequest`. Logika di `lib/ledger.ts`.
- Setiap pembayaran sukses dicatat sebagai pendapatan di `activateTransaction` (`lib/payment.ts`); transaksi lama di-backfill saat halaman keuangan dibuka.
- User: `/dompet` (saldo bisa ditarik vs ditahan via `availableAt`, ajukan penarikan min Rp 50rb, saldo langsung dicadangkan). API `app/api/user/wallet`.
- Admin: `/admin/keuangan` — lihat bagian "Laporan keuangan" di bawah.
- Belum ada sumber penghasilan user (komisi referral, penjualan template): fitur berikutnya menulis entri `USER_EARNINGS` dengan `availableAt` = sekarang + masa tahan.

## Laporan keuangan admin (sejak 23 Nov 2026)
- Data: `lib/finance.ts` → `getFinanceReport(from, to)` (KPI + % vs periode sebelumnya, deret waktu harian ≤45 hari / mingguan ≤190 hari / bulanan, rincian per sumber/paket/metode bayar/kategori pengeluaran, 30 transaksi terakhir). Akun ledger baru `PLATFORM_EXPENSE` (jumlah positif). Pemasukan/pengeluaran manual = `LedgerEntry.type "MANUAL"`, `source` = kategori, `key` = hash isi baris (`manualKey`) sehingga impor ulang tidak dobel.
- Excel: `lib/finance-excel.ts` (exceljs 4.4.0) — parse .xlsx/.csv (kolom Tanggal, Jenis Pemasukan/Pengeluaran, Kategori, Jumlah, Keterangan; tanggal 2026-11-23 / 23/11/2026 / sel tanggal Excel; jumlah "Rp 1.500.000" diterima), template impor, dan workbook laporan (sheet Ringkasan, Per periode, Buku besar).
- API admin (`requireAdmin`): `GET finance/export?from&to[&format=csv]` (default .xlsx), `GET finance/template`, `POST finance/import` (multipart `file`, `?dryRun=1` untuk cek; bila ada baris salah **tidak ada yang disimpan**), `POST finance/entries`, `DELETE finance/entries/[id]` (hanya baris MANUAL).
- UI: `app/admin/(panel)/keuangan/page.tsx` (periode cepat + rentang kustom `?periode=kustom&dari&sampai`), `components/admin/finance-charts.tsx` (Recharts: arus kas bar pendapatan vs pengeluaran + toggle tabel, laba kumulatif line, rincian bar horizontal), `components/admin/finance-tools.tsx` (dialog impor Excel, dialog catat manual, daftar transaksi terakhir + hapus).
- Palet grafik tervalidasi (dataviz validator, surface #FFFDF9): urutan tetap `#A8741A` (pendapatan), `#2D5FC4` (pengeluaran), `#C2502A`, `#1E8A6E`, `#8A3FA8`. Laba kumulatif pakai tinta `#1E1B17`. Satu sumbu Y saja.
- Sudah dites lokal di browser: impor template + CSV, deteksi duplikat, validasi baris salah (termasuk tanggal mustahil), catat & hapus manual, ekspor xlsx/csv, tampilan desktop & 375px.

## Top-up kredit AI (sejak 23 Nov 2026)
- Schema & migration (`prisma/migrations/20261123093142_ai_credits`): `User.aiCredits` (saldo top-up per akun, tidak hangus) dan `AiDesign.creditsUsed` + `AiDesign.planCreditsUsed`.
- Biaya & paket (`lib/limits.ts`): 1 generate standar = 1 kredit, generate dengan screenshot referensi = 2 kredit. Paket: 10 kredit Rp29rb (`AI_10`), 30 kredit Rp75rb (`AI_30`), 100 kredit Rp229rb (`AI_100`). Referral tidak berlaku untuk top-up AI. Kuota kredit paket = jumlah `aiDesignQuota` dari tiap undangan yang punya transaksi PLAN sukses (`getAiQuota`).
- Kuota & pemakaian (`lib/ai-design/server.ts`): `getAiQuota` menggabungkan sisa kuota paket (`planRemaining`) + saldo top-up (`topupCredits`). `saveGeneratedAiDesign` mengunci baris `User` (`FOR UPDATE`), memakai kuota paket lebih dulu lalu memotong `User.aiCredits` secara atomik.
- Checkout & aktivasi (`lib/payment.ts` → `resolveCheckoutOrder`, `openOrderWhere`, `activateTransaction`): mendukung `Transaction.kind = "AI_CREDIT"` (dengan `addonUnits = jumlah kredit`, `invitationId = null`) lewat Midtrans (`/api/payment/token`, `/api/payment/charge`) maupun Transfer/QRIS manual (`/api/payment/manual`), serta otomatis mencatat ledger `source: "AI_CREDIT"`.
- UI: `/desain-ai` (`components/user/ai-design-studio.tsx`) menampilkan saldo kredit, biaya 1 vs 2 kredit, dan tautan `/upgrade?pilih=kredit#kredit-ai`; `/upgrade` (`components/user/upgrade-checkout.tsx`) memuat pilihan top-up kredit AI + riwayat; `/admin/transaksi` (`components/admin/transaksi-client.tsx`) menampilkan lencana jumlah kredit.
- Sudah dites: `tsc --noEmit`, `eslint` pada semua file terdampak, uji integrasi DB (`getAiQuota`, `saveGeneratedAiDesign`, `activateTransaction`, `getFinanceReport`), serta verifikasi UI browser desktop (1280px) & mobile (375px).

## Mitra B2B & Referral (sejak 23 Nov 2026)
- Schema & migration (`prisma/migrations/20261123100000_b2b_referral`): `User.referralCode`, `User.referredById`, `User.accountType` (`PERSONAL | AGENCY`), `User.agencyName/Whatsapp/Instagram/Verified/Quota/QuotaExpiresAt`, `Invitation.clientName/Whatsapp/EditToken`, dan `Transaction.referralCodeUsed/discountAmount`.
- **Referral (`lib/referral.ts`, `middleware.ts`, `app/api/portal/enter`)**:
  - Link `?ref=KODE` otomatis disimpan ke cookie `uy_ref` (30 hari), tampil di `/register`, terikat ke `referredById` saat masuk portal, dan otomatis terpasang di `/upgrade` Ringkasan.
  - Pembeli dapat diskon 10% (maks Rp15rb) pada transaksi pertamanya; pemilik kode dapat komisi 15% ke `LedgerEntry` (`USER_EARNINGS`, `type: "COMMISSION"`, masa tahan 7 hari).
  - `/dompet` (`app/(user)/dompet/page.tsx`) menyediakan pengelolaan kode referral (bisa dikustom), tombol Salin Link & Bagikan WA, serta statistik referral.
- **Mitra B2B (`/mitra`, `/isi-data/[token]`)**:
  - Aktivasi instan 1 langkah di `/mitra` (`PATCH /api/user/agency`). Paket grosir `AGENCY_10` (Rp299rb), `AGENCY_30` (Rp749rb + 50 AI), `AGENCY_100` (Rp1,99jt + 150 AI) di `/upgrade?pilih=mitra#kuota-mitra`.
  - Aktifkan undangan klien 1 klik pakai kuota (`POST /api/user/invitations/[id]/activate-quota` → setara `PREMIUM` 365 hari).
  - Magic link pengisian data klien tanpa login (`/isi-data/[token]` + `/api/public/client-form/[token]`) agar pasangan dapat mengisi data mempelai, jadwal acara, cerita, dan amplop digital langsung ke draf.
  - Branding footer `Dibuat oleh <Nama Agency>` pada template AI & standar (`app/[slug]/page.tsx`).
  - Admin `/admin/users` mendukung filter `Mitra B2B` serta toggle verifikasi mitra.

## Kanvas Desain, Marketplace Template & Partner Vendor Landing (sejak 23 Nov 2026)
- **Partner Vendor di Landing (`/` → `components/landing/sections.tsx` `PartnerVendors`)**: mengambil otomatis akun Mitra B2B (`accountType = "AGENCY"`) dari database, menampilkan nama usaha, kota/status terverifikasi, serta `User.agencyLogo` yang diunggah lewat `/mitra` (`components/user/agency-hub.tsx` & `PATCH /api/user/agency`).
- **Kanvas Desain (`/kanvas`)**:
  - Editor kreatif bergaya Canva (`app/(user)/kanvas/page.tsx`, `components/user/canvas-studio.tsx`) dengan 4 tab alat (Warna, Teks & Font, Section/Tata Letak dengan re-ordering & sembunyikan section, serta Ornamen & Aset).
  - Ornamen mendukung 4 sumber: **Pustaka Ornamen SVG Kurasi** (`lib/ai-design/ornament-library.ts`, 16 SVG siap pakai), **Generate Ornamen AI** (`POST /api/ai/ornament`, `lib/ai-design/ornament-generate.ts`, potong 1 Kredit AI, disanitasi dengan `sanitizeGeneratedSvg`), **Upload Gambar Sendiri**, dan **Teks Dekoratif**.
  - Layer bebas digeser drag-and-drop di pratinjau ponsel interaktif (`components/templates/ai-design/ornaments.tsx` → `CanvasSectionFrame`, `CanvasEditorBridge`), lengkap dengan atur skala, rotasi, opasitas, dan warna, lalu disimpan gratis (0 kredit AI) via `/api/user/canvas` dan dipasang ke undangan aktif.
- **Template Marketplace & Komisi Owner (`prisma/migrations/20261123110000_canvas_marketplace`)**:
  - Model `CatalogTemplate` ditambah `creatorId`, `price`, `platformFeePct` (default `30%`), `reviewStatus` (`PENDING_REVIEW | APPROVED | REJECTED`), `reviewNote`, dan model `TemplatePurchase` (`@@unique([invitationId, templateId])`).
  - Kreator mengajukan template dari `/kanvas` (`POST /api/user/marketplace`, harga `Rp15.000–Rp199.000`). Admin mereview, menyesuaikan `platformFeePct`, atau menyetujui di `/admin/templates` (`Pengajuan Kreator`).
  - Pembeli di `/pilih-template` melihat harga & nama kreator; template berbayar mengarah ke `/upgrade?pilih=template&templateId=<id>` (`CheckoutKind = "MARKETPLACE"`, Midtrans & Transfer Manual).
  - Saat `activateTransaction` (`lib/payment.ts`), `platformFee` (misal 30%) masuk ke `PLATFORM_REVENUE` (`source: "MARKETPLACE"`), sisa `70%` (`creatorShare`) masuk ke `/dompet` kreator (`USER_EARNINGS`, `type: "SALE_SHARE"`, masa tahan 7 hari), dan `TemplatePurchase` otomatis dibuat serta template dipasang ke undangan pembeli.

## Lanjutan berikutnya (urutan roadmap)
1. **Domain kustom CNAME (opsional untuk paket Eksklusif / Mitra)** & halaman analitik trafik per undangan. Detail di `docs/ROADMAP-BISNIS.md`.

## Status git (23 Nov 2026)
Semua pekerjaan migration, ledger, dompet, laporan keuangan, top-up kredit AI, B2B & referral, Kanvas Desain & Template Marketplace, serta Partner Vendor Landing **belum di-commit** (branch `dev`). User yang memutuskan kapan commit/push. `.env` lokal berisi URL localhost dan tidak boleh di-commit.
