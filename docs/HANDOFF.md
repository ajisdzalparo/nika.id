# SatuMoment — konteks proyek untuk AI berikutnya

Salin seluruh file ini ke AI lain sebagai konteks awal. **Diperbarui 27 Nov 2026.**
Model bisnis, harga, dan keputusan pemilik produk: [`docs/ROADMAP-BISNIS.md`](ROADMAP-BISNIS.md) (sumber kebenaran untuk bisnis).

---

## ▶ STATUS TERBARU (27 Nov 2026) — baca ini dulu

- Branch `dev`, main branch `prod`. Commit terakhir: `a0350f8` (feature status, canvas flip, numeric inputs).
- **Semua pekerjaan di bagian "Selesai sejak `a0350f8`" BELUM di-commit** (±90 file berubah/baru + 6 migration baru). Jangan commit/push tanpa izin user.
- Typecheck (`node_modules/.bin/tsc.exe --noEmit -p .`) dan eslint pada file yang diubah: **bersih**.
- Dev server lokal untuk uji: **localhost:3001** (`.claude/launch.json` → `web-3001`, `npx next dev -p 3001`).
  **localhost:3000** = container Docker `satumoment-app` (image `ghcr.io/ajisdzalparo/satumoment:latest` dibuild dari kode lokal); terakhir dibuild sebelum perubahan sidebar Mitra & tab Template Kreator → **perlu `docker compose up -d --build app` lagi** agar sama dengan :3001.
- Marketplace di DB lokal sekarang **Aktif** (diaktifkan user lewat admin).

### Aturan kerja dari user (wajib)
- **Pakai komponen yang sudah ada** (lihat `CLAUDE.md` + skill `.claude/skills/invitation-design`): `components/ui/*` (`SelectField`, bukan `<select>` mentah), `components/common/*` (`PhoneInput`, `NumberInput`, `DatePickerField`, `studio-ui`, `qr-code`), `components/landing/primitives.tsx`. Ubah tampilan komponen bersama di file-nya sendiri.
- **Jangan sentuh `.env` / `.env.prod` / `.mcp.json`** (kecuali user minta eksplisit). Docker lokal DB/Redis/S3 via `.env` boleh dipakai.
- **Commit tanpa** `Co-Authored-By: Claude` / "Generated with Claude Code".
- Jangan tulis kredensial uji di chat. Akun uji lokal: `qa-admin@satumoment.test` (password di scratchpad sesi; status sekarang PERSONAL + admin). Hapus kalau sudah tidak dipakai.
- Bahasa ke user: Indonesia santai. Brand: champagne `#FCF8F1`, espresso `#1F1A14`, emas `#8A6424`, Bodoni Moda (judul) + Plus Jakarta Sans (teks).
- Di Server Component jangan `<Button asChild><Link/></Button>`; pakai `<Link className={buttonVariants({ variant: "gold" })}>`.

### Setelah pull / sebelum tes
1. Matikan dev server dulu (engine Prisma terkunci di Windows → `prisma generate` EPERM), lalu `npx prisma generate`.
2. `npx prisma migrate deploy` (container juga menjalankannya otomatis saat start). Migration baru (belum di-commit):
   `20261126160000_marketplace_interest`, `20261126161000_marketplace_coming_soon` (set MARKETPLACE = COMING_SOON di `feature_flags`),
   `20261126170000_mitra_applications` (+ tandai mitra lama `agencyVerified = true`), `20261126180000_invitation_members`,
   `20261126190000_promo_for_user`, `20261126200000_mitra_sales_fields`.
3. Nyalakan lagi dev server (`web-3001`).

---

## Selesai sejak `a0350f8` (belum di-commit)

### Bisnis & harga
- **Harga paket**: Hemat Rp49rb · Premium Rp129rb · Eksklusif Rp159rb. **Semua template katalog terbuka di semua paket berbayar** (`lib/limits.ts`). Badge "Gratis/Premium" di kartu template dihapus.
- **Harga paket diatur dari admin**: `/admin/pengaturan-admin` → kartu Harga Paket (`components/admin/plan-price-manager.tsx`), setting `plan_prices` (`getPlanPrices`/`setPlanPrices` di `lib/system-settings.ts`), harus naik Hemat < Premium < Eksklusif. Dipakai checkout (`lib/payment.ts`, `upgrade-checkout.tsx` prop `planPrices`), landing `Pricing`, dan chat bantuan (`lib/support-chat.ts`). `PLAN_LIMITS.*.price` = default saja.
- **Perpanjangan masa aktif** Rp25rb / 1 tahun (`RENEWAL_PRICE`, `RENEWAL_DAYS`): order kind `RENEWAL` di `resolveCheckoutOrder` + `activateTransaction`; kartu di `/upgrade` hanya untuk undangan berbayar.
- **Kode promo 100%** → pesanan gratis tanpa gateway: `POST /api/payment/free` (server hitung ulang, harus Rp0 + pakai promo), tombol "Aktifkan gratis" di checkout. `PromoCode.forUserId` = kode khusus satu akun.

### Referral & Mitra
- **Referral user biasa = diskon saja** (10%, maks Rp15rb, transaksi pertama). Komisi uang dihapus; komisi lama tetap bisa ditarik (min Rp50rb).
- **Kode mitra**: klien bayar harga normal (tanpa diskon), hanya untuk pembelian PLAN; tiap `MITRA_BONUS_EVERY` (3) klien bayar → mitra +1 kuota (`activateTransaction`), notifikasi progres. Promo/validate mengembalikan `type: "MITRA"`.
- **Status Mitra hanya dari admin** (`accountType = "AGENCY"`):
  - Form pengajuan (`components/common/mitra-application-form.tsx`) di landing (`#gabung-mitra`, `MitraJoin` di `sections.tsx`) dan di `/mitra` untuk non-mitra → `POST /api/public/mitra-application` (rate limit, honeypot) → model `MitraApplication`.
  - Admin `/admin/mitra` (`components/admin/mitra-applications-client.tsx`): setujui (butuh akun dengan email itu) + opsi **kode uji coba** (N undangan gratis, X hari → `createMitraTrialCode` di `lib/mitra.ts`, promo 100% PLAN khusus akun) atau tolak (+catatan).
  - Jalur WhatsApp: `/admin/users` tombol "+ Jadikan Mitra" / cabut (`app/api/users/[id]`).
  - User tidak bisa aktivasi sendiri (`PATCH /api/user/agency` hanya edit profil mitra), tidak bisa beli/ pakai kuota grosir kalau bukan mitra.
- **Akun klien per undangan** (`InvitationMember`): mitra membuat login klien dari tombol "Akun Klien" di kartu undangan, atau isi **Email Klien** saat "Undangan Klien Baru" (`lib/client-account.ts`, `app/api/user/invitations/[id]/client-account`). Akun baru `accountType = "CLIENT"` + password sementara (tampil sekali, kirim via WA). Akses bersama lewat `invitationAccessWhere()` di `lib/active-invitation.ts` (dipakai active invitation, select, guests, rsvp, checkin). Klien tidak dapat undangan starter kosong.
- **Laporan penjualan mitra** di `/mitra#laporan` (`components/user/mitra-sales-report.tsx`): per bulan klien aktif, omzet (`Invitation.clientPrice`, diisi mitra), modal (`mitraCost`: harga paket dibayar / rata-rata harga kuota / Rp0 kode uji coba), untung. `activatedAt` dicatat saat aktivasi.
- **Sidebar per peran** (`components/user-sidebar.tsx`):
  - User biasa: Undangan, Tamu, Akun (+ "Gabung jadi Mitra").
  - Mitra: **Bisnis Mitra** (Klien & Undangan, Laporan Penjualan, Kuota & Paket, Dompet) → **Klien · {judul undangan aktif}** (Editor, Desain AI, Kanvas, Koleksi, Tamu, WA Blast, RSVP, Check-in) → Akun. Kartu bawah = sisa Kuota Mitra. Switcher & Editor mengarah ke `/mitra` ("Ganti klien").
  - Klien: Undangan Kami (Beranda, Tamu, WA Blast, RSVP, Check-in) + Akun.
  - Gaya item menu dibagi di `components/common/sidebar-styles.ts` (user & admin).

### Marketplace template
- Fitur jual/beli/review sudah ada sejak 23 Nov. Status fitur `MARKETPLACE` (default COMING_SOON). Saat **Segera hadir**: template berbayar disembunyikan, kartu survei minat (`MarketplaceInterest`, `components/user/marketplace-interest-card.tsx`, hasil di baris fitur admin), checkout MARKETPLACE ditolak.
- Saat **Aktif**: Koleksi Template punya tab **"Termasuk paket"** dan **"Template Kreator"** (selalu tampil, empty state + tombol "Jual desain saya" bila kosong) di `components/user/template-picker.tsx`.

### Fitur lain
- **Import Excel/CSV daftar tamu**: dialog "Impor Excel" di Daftar Tamu (`components/user/guest-import-dialog.tsx`), template + `POST /api/user/guests/import` (`lib/guest-import.ts`; semua baris valid baru disimpan, lewati duplikat nama+nomor, hormati batas tamu). Helper bersama `lib/excel.ts` (dipakai juga keuangan).
- **Ayat / kutipan pembuka** di Editor → Fitur (`QuoteEditor` di `components/user/editor/fitur-section.tsx`, preset `lib/quote-presets.ts`: Islam, Kristen/Katolik, umum, tulis sendiri, atau sembunyikan `quote.enabled = false`). Template classic/estetik/romantic ikut data, bukan teks Ar-Rum tetap.
- **Kirim QR check-in tamu via WhatsApp** (RSVP → QR → "Kirim via WhatsApp"): HP = Web Share gambar; desktop = unduh + buka wa.me berisi pesan (`shareQrOnWhatsapp`, `renderQrCard`, `renderStandardQr` di `components/common/qr-code.tsx`).
- **Halaman legal**: `/kebijakan-privasi`, `/syarat-layanan`, `/garansi` (`app/(legal)`, `components/landing/legal-page.tsx`), tautan footer + email `admin@satumoment.com`. Isinya draf, perlu dibaca pemilik/ahli hukum.
- **Keamanan**: `app/test/payment` (publik, membocorkan transaksi pending) **dihapus**.
- **UI**: scrollbar tipis global (`app/globals.css`), tanggal contoh tetap di `lib/constants/mock-wedding-data.ts` (memperbaiki hydration mismatch login/landing).

---

## Langkah berikutnya (urut prioritas)

1. **Minta izin user lalu commit** semua pekerjaan di atas (pesan tanpa atribusi Claude), push `dev`.
2. **Build ulang Docker lokal** (`docker compose up -d --build app`) supaya :3000 = kode terbaru, lalu cek cepat.
3. **Uji browser yang belum sempat** (pakai akun uji lokal, hapus data uji setelahnya):
   - Mitra: buat "Undangan Klien Baru" dengan Email Klien → info login muncul; login sebagai klien (lihat menu "Undangan Kami", tamu/RSVP hanya milik undangan itu).
   - RSVP → QR → "Kirim via WhatsApp" (desktop & HP).
   - Persetujuan mitra dengan kode uji coba → pakai kode di checkout (Aktifkan gratis).
   - Marketplace aktif: jual 1 desain dari Kanvas → setujui di admin → tampil di tab Template Kreator → beli.
4. **Sebelum merge `dev` → `prod`** (tugas user di VPS, jangan sentuh env sendiri): isi `SMTP_*` dan `OPENROUTER_DESIGN_MODEL=anthropic/claude-sonnet-5.5` di `.env.prod`; jika pull GHCR gagal, jadikan package `satumoment` public. 6 migration baru jalan otomatis saat container start.
5. Pastikan status fitur Marketplace di prod sesuai keinginan (migration `..161000` menyetelnya ke COMING_SOON; user bisa mengaktifkan dari admin).

## Belum dikerjakan / ditunda (keputusan user)
- **Pajak** (komisi uang mitra besar) — dibahas nanti; sekarang imbalan mitra berupa kuota.
- **Refund garansi 7 hari** — masih proses manual oleh admin (belum ada tombol/otomasi).
- **Toko publik Mitra** (`/m/nama-mitra`, katalog + "Pesan via WA") — diusulkan, belum disetujui.
- **Souvenir / barang fisik**, **akun Instagram SatuMoment**, **brosur** — ditunda, bukan pekerjaan kode.
- **WA Blast resmi** (WhatsApp Cloud API / gateway) — UI "Segera" + daftar tunggu sudah ada.
- **Domain kustom** (CNAME) untuk Eksklusif/Mitra, analitik trafik per undangan.
- Infra tertunda: ganti nama image/domain final, tutup port DB yang terbuka di VPS, container & volume prod masih bernama `nikaid-*`, folder VPS `~/projects/undangin-yuk`.

---

## Produk
SaaS undangan pernikahan digital Indonesia, brand **SatuMoment** (dulu UNDANGIN YUK / nika.id). User membuat undangan dengan Desain AI, Kanvas, atau template katalog, mengisi data, lalu membagikan link `/<slug>?to=<nama tamu>` lewat WhatsApp. Fitur: RSVP + ucapan, QR check-in, daftar tamu + lacak dibuka, amplop digital, musik, galeri, countdown. Monetisasi: paket per undangan (Hemat/Premium/Eksklusif), add-on +100 tamu Rp15rb, perpanjangan Rp25rb/tahun, top-up kredit AI, kuota Mitra (10/30/100), fee marketplace 30%.

## Stack
Next.js 16.4.6 (App Router, Turbopack, `middleware.ts`) · React 19 · Tailwind v4 · shadcn/ui · Prisma 6 + PostgreSQL · better-auth 1.7 (email + Google, plugin admin; portal cookie `uy_portal_user/admin`) · MinIO/S3 (pgsty/silo) · Midtrans · SMTP (nodemailer) · OpenRouter (desain `anthropic/claude-sonnet-5.5` + prompt caching, cek kemiripan `claude-haiku-5.5`) · exceljs · Bun/npm.

## Menjalankan lokal
```
docker compose up -d postgres minio   # atau seluruh stack: docker compose up -d --build
npx prisma migrate deploy && npx prisma generate
npx next dev -p 3001                  # :3000 dipakai container app
```
Env contoh: `.env.example` (lokal), `.env.staging.example`, `.env.prod.example` (`APP_ENV_FILE`). Admin: role `admin` di `User.role`; login admin di `/admin/login`.

## Peta kode penting
- **Auth**: `lib/auth.ts`, `lib/auth-helpers.ts` (`getSession(request, portal)`, `requireAuth`, `requireAdmin`, `apiErrorResponse`), `middleware.ts`.
- **Harga, paket, kuota**: `lib/limits.ts` (PLAN_LIMITS, DEFAULT_PLAN_PRICES, getUpgradePrice(…, prices), AGENCY_PACKS, MITRA_BONUS_EVERY, RENEWAL_*).
- **Checkout & aktivasi**: `lib/payment.ts` (`resolveCheckoutOrder`, `activateTransaction`), API `app/api/payment/{token,charge,manual,status,notification,free}`, UI `components/user/upgrade-checkout.tsx`.
- **Promo & referral**: `lib/promo.ts`, `lib/promo-shared.ts`, `lib/referral.ts`, admin `/admin/promo`.
- **Mitra**: `lib/mitra.ts`, `lib/client-account.ts`, `components/user/agency-hub.tsx`, `components/user/client-account-dialog.tsx`, `components/user/mitra-sales-report.tsx`, `/admin/mitra`.
- **Undangan aktif & akses**: `lib/active-invitation.ts` (`getActiveInvitation`, `listUserInvitations`, `invitationAccessWhere`), `components/user/active-invitation-context.tsx`.
- **Pengaturan sistem & status fitur**: `lib/system-settings.ts`, `lib/features.ts`, `lib/feature-guard.ts`, `components/common/feature-gate.tsx`, `components/admin/feature-status-manager.tsx`.
- **Mesin tema AI / Kanvas**: `lib/ai-design/*`, `components/templates/ai-design/*`, `components/user/canvas-studio.tsx`.
- **Katalog & marketplace**: `lib/catalog.ts`, `components/user/template-picker.tsx`, `app/api/user/marketplace/*`, `components/user/marketplace-sell-dialog.tsx`, admin `/admin/templates`.
- **Tamu/RSVP/check-in**: `components/user/guest-list.tsx`, `components/user/rsvp-manager.tsx`, `components/common/qr-code.tsx`, `app/hadir/[slug]`, `app/api/public/{submit,checkin,guest-open}`.
- **Keuangan & ledger**: `lib/ledger.ts`, `lib/finance.ts`, `lib/finance-excel.ts`, `lib/excel.ts`, `/admin/keuangan`, `/dompet`.
- **Landing & legal**: `app/page.tsx`, `components/landing/*`, `app/(legal)/*`.

## Konvensi
- UI Indonesia yang hangat dan sopan; mobile-first (375px), tap target ≥44px.
- Verifikasi tiap perubahan UI di browser (375px & desktop) + `tsc --noEmit` + eslint file terdampak.
- Schema: ubah `prisma/schema.prisma` + tulis folder migration (jangan `db push`); container menjalankan `scripts/db-migrate.mjs` saat start.
- Jangan menyalin desain/aset situs lain.
