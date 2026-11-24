# undangin yuk — konteks proyek untuk AI berikutnya

Salin seluruh file ini ke AI lain sebagai konteks awal. Ditulis 20 Nov 2026. Semua perubahan di bawah **belum di-commit** (branch `dev`, main branch `prod`).


> **Model bisnis & roadmap yang disepakati** (dua jalur jualan: perorangan B2C dan agency B2B, pricing, kredit AI, referral, marketplace, urutan pengerjaan): lihat [`docs/ROADMAP-BISNIS.md`](ROADMAP-BISNIS.md).

## ▶ STATUS TERBARU (25 Nov 2026) — baca ini dulu

Commit terakhir: `195fac4` (branch `dev`). **Semua yang di bawah ini BELUM di-commit** (~130 file berubah/baru). Jangan commit/push tanpa izin user.

### Aturan kerja dari user (wajib)
- **Pakai komponen yang sudah ada, jangan bikin ulang.** Lihat `CLAUDE.md` (root) dan skill `.claude/skills/invitation-design`. Ringkas: `components/ui/*` (Select → pakai `SelectField`, tidak boleh `<select>` mentah), `components/common/*` (`PhoneInput`, `qr-code`, `studio-ui`), `components/landing/primitives.tsx`.
- **Di Server Component jangan `<Button asChild><Link/></Button>`** (Radix Slot bikin hydration mismatch useId). Pakai `<Link className={buttonVariants({ variant: "gold" })}>`.
- Bahasa ke user: Indonesia santai ("gw/lu"). Kredensial tes localhost ada di sesi sebelumnya — jangan ditulis ulang di chat.
- Desain: champagne + espresso + emas `#8A6424`, judul **Bodoni Moda**, teks **Plus Jakarta Sans** (dipasang di `lib/studio.ts`, variabel di `<body>` lewat `app/layout.tsx`). Tombol utama = `Button variant="gold"` (foil + kilau `.uy-sheen`).

### Setelah pull / sebelum tes
Dev server mengunci engine Prisma → `bunx prisma generate` bisa `EPERM`. **Matikan dev server → `bunx prisma generate` → nyalakan lagi.** Migrasi baru sudah diterapkan di DB lokal: `20261124120000_customer_survey`, `20261124130000_rsvp_details`, `20261124140000_rsvp_checkin`, `20261124143637_guest_details`, `20261124172013_guest_tracking`. Dependensi baru: `qrcode`, `jsqr`, `@types/qrcode` (sudah di `package.json` & `bun.lock`).

### Yang sudah selesai sejak `195fac4`
1. **Landing & brand**: palet gold, font Bodoni/Jakarta, hero kipas 3 HP berputar, animasi (`app/globals.css`: `uy-sheen`, `uy-word`, `uy-lattice`, `uy-kenburns`, partikel, kupu-kupu). Menu "Koleksi" → **Template** (`/desain`): grid semua template + filter/cari/urut (chip membungkus di ≥sm).
2. **Template engine premium** (`lib/ai-design/`):
   - `art-kits.ts`: 7 kit ilustrasi original (`taman-kayon`, `kebun-sage`, `mawar-vintage`, `kamboja-tropis` = SVG di `public/templates/art/<kit>/`; `deco-emas`, `arabesque`, `garis-halus` = garis `currentColor` tertint aksen). `composeArtKit()` menata bingkai/buket/sulur/lambang per section, `withArtKit()` dipanggil saat render (`components/templates/ai-design/index.tsx`) bila tema belum punya layer. Field `artKit` & `particles` di skema.
   - `presets-catalog.ts`: 17 tema baru + Taman Kayon; `PRESET_ART_KITS` (kit per template). Seeding sekali pakai flag `catalog_presets_batch2_v1` / `batch3_v1` (`lib/catalog.ts`).
   - **Bug Zod 4 diperbaiki**: `sectionStyles` pakai `z.partialRecord` (sebelumnya semua layer Kanvas terbuang diam-diam).
   - Animasi: nama reveal/foil bergerak, judul reveal saat scroll, Ken Burns, partikel kelopak/debu emas/daun + kupu-kupu (`AmbientParticles` di `ornaments.tsx`), panel kiri desktop = slideshow foto + layer sampul (`DesktopStage`, `StaticSectionLayers`), tinggi panel ikut `--uy-stage-h`.
   - AI generate (user & admin Mesin Tema) wajib pilih kit (`generate.ts` + `prompt.ts`); prompt HTML admin (`ADMIN_AI_HTML_CONTEXT_PROMPT` di `html-sanitize.ts`) berisi daftar ilustrasi + aturan komposisi & animasi premium. HTML template: hanya `html` yang scroll (`body overflow-x: clip`).
3. **Kanvas Desain**: tab **Ilustrasi** (pasang paket ke semua section, partikel, pustaka elemen seret/klik, latar per section). Desain dari preset/katalog **tidak bisa dijual** (blok di UI + cek kemiripan server `lib/ai-design/originality.ts` di `app/api/user/marketplace` + maks 3 pengajuan pending).
4. **Select**: `components/ui/select.tsx` digayakan ulang + `SelectField` (drop-in `<option>`, render interaktif setelah hydrate). Semua `<select>` mentah sudah diganti.
5. **Admin**: editor template — pratinjau mockup HP + mini-desktop klik → layar penuh; Kategori pakai Select.
6. **Dashboard** (`components/common/studio-ui.tsx`: `PageHeader`, `Panel`, `PanelTitle`, `StatTile`; `Button` varian `gold`/`ink`; `Card` digayakan): Beranda user (hero foto + hitung mundur live `LiveCountdown`, kartu RSVP, strip statistik), Ringkasan admin, sidebar user/admin bergaya emas.
7. **Survei pelanggan** (`SurveyResponse`, `lib/survey.ts`, `app/api/user/survey`, `components/user/customer-survey.tsx` dipasang di Beranda; ringkasan NPS di `/admin/masukan`). Aturan tidak mengganggu: umur akun ≥3 hari atau sudah pakai produk, muncul setelah 12 detik, sekali per sesi, "Nanti saja" = 14 hari, berhenti setelah 3x ditunda, ulang tiap 120 hari.
8. **RSVP lengkap**: kolom `phone`, `companions`, `customAnswer` (+ `note`, `checkInToken`, `checkedInAt`). Form tamu (`Rsvp` di `sections.tsx`): nomor WA (`PhoneInput`), Hadir/Mungkin/Berhalangan, jumlah tamu −/+, nama pendamping, pertanyaan tambahan. Pengaturan di Editor → Fitur → **Formulir RSVP** (`data.rsvp`: `maxGuests`, `askPhone`, `question`, `qrCheckIn`). API `app/api/public/submit` memvalidasi & mengembalikan `{ id, checkInToken }`.

9. **RSVP management + Check-in Tamu (Self Check-in QR Cetak + Mode Panitia)** — selesai & teruji:
   - **QR Cetak Meja Tamu (tab utama `/check-in`)**: `UrlQr`, `downloadVenueQrPoster` (1200×1800 siap cetak), `downloadPlainUrlQr` di `components/common/qr-code.tsx`; halaman publik `app/hadir/[slug]/page.tsx` + `components/public/guest-self-checkin.tsx` + `POST /api/public/checkin`. Tamu undangan personal (`?to=...`) diingat lewat `GuestIdentityMemory` sehingga saat scan QR meja cukup **1 ketuk konfirmasi** tanpa tulis nama lagi; tamu grup (`&grup=1` / `GROUP`) tetap menulis nama pribadinya.
   - **Mode Panitia (tab kedua `/check-in`)**: kamera `getUserMedia` + `jsQR` tiap 250ms, jeda 2,5 detik, input kode manual, riwayat scan sesi.
   - **Ekspor CSV** `app/api/user/rsvp/export/route.ts`: ditambah kolom `No. WA`, `Pendamping`, `Jawaban Tambahan`, `Catatan`, `Check-in`.
   - Proteksi rute `/check-in` & `/wa-blast` di `middleware.ts`.
10. **Daftar Tamu lengkap + Lacak Status Buka Web + WA Blast (Segera Hadir)**:
   - Migrasi `20261124143637_guest_details` & `20261124172013_guest_tracking` (`sentAt`, `openedAt`, `lastOpenedAt`, `openCount`).
   - Endpoint `POST /api/public/guest-open` dipicu dari browser nyata (anti-bot link preview WA) untuk mencatat otomatis status **Sudah dibuka** (+ jumlah buka & waktu) di `/manajemen-tamu` & `/buku-tamu`; klik Kirim WA / Salin Link menandai **Terkirim**.
   - Halaman **WA Blast** (`app/(user)/wa-blast/page.tsx`, `components/user/wa-blast-studio.tsx`, badge `Segera` di sidebar): daftar tunggu, template pesan, dan alur 2 langkah kirim manual.
11. **Polish UI menyeluruh**:
    - Semua halaman dashboard admin & dashboard user full-width (`w-full`); landing page & `/desain` tetap `max-w-6xl`.
    - `CoverThumb` (`components/templates/ai-design/cover-thumb.tsx`) auto-scale penuh via `ResizeObserver` + `transform: scale`, kartu template `/pilih-template`, `/desain`, & `/admin/templates` diperbarui.
    - Komponen kustom `DatePickerField` & `TimePickerField` (`components/common/date-time-picker.tsx`) menggantikan semua `<input type="date">` & `<input type="time">`.
    - Pratinjau desktop Kanvas Studio layar penuh, tab "Upload Sendiri" bergaya galeri Canva, layout Formulir RSVP di Editor, dan `buttonVariants` otomatis merge via `cn(...)`.
12. **Anti-Duplikat Katalog + Cek Plagiasi AI (Pre-Sell Kreator & Kurasi Manual Admin)**:
    - **10 paket ilustrasi original (`lib/ai-design/art-kits.ts` & `schema.ts`)**: ditambah 3 kit SVG tertint baru (`batik-parang`, `boho-pampas`, `editorial-monogram`) agar 27 template bawaan benar-benar unik (menghilangkan duplikasi `sekar-arum` vs `classic-premium`, `kamboja-bali` vs `terakota-boho` vs `senja-tropis`, `kawung-sogan` vs `siger-sunda`, `taman-pastel` vs `lavender-pagi` vs `kayu-rustic`, `standard` vs `kabar-lama` vs `sage-linen`). Sinkronisasi sekali jalan lewat flag `catalog_dedupe_distinct_v2` (`lib/catalog.ts`, khusus `creatorId: null`).
    - **Mesin deteksi orisinalitas visual + AI (`lib/ai-design/originality.ts` & `lib/ai-design/plagiarism-ai.ts`)**: pembobotan dominan pada identitas visual (`artKit` efektif, layout sampul, warna latar dengan penalti beda hue HSL, ornamen/bingkai, serta layer kustom non-kit) sehingga **mengganti font saja atau menggeser warna aksen tipis tetap terdeteksi `PLAGIAT` (≥86%)**. Integrasi `openRouterChat` (`OPENROUTER_API_KEY` / `OPENROUTER_CHAT_MODEL`) dengan fallback otomatis ke analisis visual struktural bila API key masih placeholder/belum diisi.
    - **Cek orisinalitas sebelum jual di Marketplace**: endpoint `POST /api/user/marketplace/check-originality` + proteksi keras di `POST /api/user/marketplace` (membandingkan terhadap seluruh template non-ditolak termasuk milik kreator sendiri). Komponen bersama `components/user/marketplace-sell-dialog.tsx` (dipakai di `canvas-studio.tsx` & `kanvas-projects-hub.tsx`) menjalankan cek AI otomatis sebelum submit, menampilkan pratinjau berdampingan jika `MIRIP`/`PLAGIAT`, dan memblokir pengajuan plagiasi.
    - **Perbandingan plagiasi manual di Admin (`/admin/templates`)**: badge peringatan kemiripan langsung pada kartu, tab filter **Indikasi Mirip**, tombol **Cek Plagiasi AI & Bandingkan**, endpoint `POST /api/admin/catalog/[id]/similarity`, serta dialog perbandingan **side-by-side** (mockup HP + tabel spesifikasi yang menyorot atribut identik + switcher top-3 pembanding + tombol langsung **Tolak sebagai Plagiasi** atau **Tetap Setujui**).
    - **Typecheck + lint** (`tsc --noEmit`, `eslint app components lib`): bersih per 25 Nov 2026.

### ⏳ TINGGAL UJI BROWSER (setelah login lokal)
- **Uji di browser (375px & desktop)**:
  1. `/manajemen-tamu`: tambah/ubah tamu lengkap (VIP, No. WA, label Blast/kustom, catatan) & uji kirim WA.
  2. `/wa-blast`: cek tab Template (pratinjau, tambah draf), tab Kirim WA Blast (stepper 1→2, kirim manual, modal Segera Hadir, daftar tunggu).
  3. QR check-in end-to-end: aktifkan QR check-in di editor → RSVP di undangan publik → QR muncul → di `/buku-tamu` unduh QR standar & kartu + cek ekspor CSV → pindai/ketik kode di `/check-in` → status "Sudah check-in". Hapus data uji setelahnya.
  4. Marketplace & Kurasi Admin: di `/kanvas` klik **Jual** pada desain mirip preset (pastikan dialog cek AI memblokir & menampilkan perbandingan side-by-side); di `/admin/templates` klik **Cek AI** / **Cek Plagiasi AI & Bandingkan** untuk melihat modal perbandingan berdampingan & alur tolak plagiasi.
  5. Isi `OPENROUTER_API_KEY` asli di `.env` jika ingin menguji penilaian naratif AI langsung (saat ini masih placeholder `ISI_OPENROUTER_API_KEY` sehingga otomatis memakai fallback analisis visual struktural).

### Ide yang sudah dibahas, belum dibangun
- **Integrasi WA Blast resmi (backend)** dengan status terkirim/dibaca + billing kuota add-on (WhatsApp Cloud API / gateway Fonnte/Wablas) — UI add-on Coming Soon & daftar tunggu sudah siap di `/wa-blast`.
- **Redesign Kanvas Desain** (kanvas di tengah, panel layer & properti di kanan) + fitur **"kutip lalu ubah dengan AI"** (pilih elemen/section → prompt → AI hanya mengubah bagian itu, endpoint patch baru).
- **Aset lukisan cat air** (raster) untuk kit premium: engine sudah siap, tinggal ganti file gambar (AI gambar berbayar atau paket berlisensi).
- Rombak halaman dashboard lain (Daftar Undangan, Editor, Dompet, Mitra, admin lain) memakai `PageHeader`/`Panel` (Daftar Tamu sudah selesai).
- Referensi desain dari user: viding.co (theme preview 162/167/205) — **jangan salin aset/HTML mereka**, hanya pola.

---

## Produk
SaaS undangan pernikahan digital (Indonesia) dengan nama brand **UNDANGIN YUK**. User mendaftar (email/password atau Google), membuat undangan dengan **Desain AI** atau **memakai template katalog**, mengisi data, lalu membagikan link `/<invitationSlug>?to=<nama tamu>` lewat WhatsApp. Ada RSVP + ucapan tamu, amplop digital, musik (YouTube atau upload audio ke S3/MinIO), galeri, countdown. Monetisasi: paket per acara (`HEMAT` Rp49rb / `PREMIUM` Rp79rb / `EKSKLUSIF` Rp99rb + add-on `+100 tamu` Rp15rb di `lib/limits.ts`, `FREE` hanya untuk mode pratinjau sebelum bayar).

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · Prisma 6 + PostgreSQL · better-auth (email + Google OAuth, plugin admin) · MinIO (S3) untuk upload · Midtrans (pembayaran) · nodemailer + Gmail SMTP (email verifikasi) · OpenRouter (`lib/openrouter.ts`, `OPENROUTER_API_KEY`, default Claude Sonnet/Haiku) · Bun sebagai package manager.

## Menjalankan lokal
```
docker compose up -d postgres minio      # Postgres :5433, MinIO :9000 (console :9001)
bun run db:migrate && bunx prisma generate   # JANGAN db push lagi (lihat "Database migration")
bun run dev                              # http://localhost:3000
```
`.env` wajib: `DATABASE_URL` (postgresql://nikaid:nikaid_password@localhost:5433/nikaid), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID/SECRET`, `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED="true"`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM_NAME`, `MINIO_*` (lihat `.env.example`), `OPENROUTER_API_KEY` (`OPENROUTER_DESIGN_MODEL`, `OPENROUTER_CHAT_MODEL` — saat ini lokal masih placeholder `ISI_OPENROUTER_API_KEY`; cek plagiasi otomatis fallback ke mesin struktural).

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
