# nika.id — konteks proyek untuk AI berikutnya

Salin seluruh file ini ke AI lain sebagai konteks awal. Ditulis 20 Nov 2026. Semua perubahan di bawah **belum di-commit** (branch `dev`, main branch `prod`).

## Produk
SaaS undangan pernikahan digital (Indonesia). User mendaftar (email/password atau Google), membuat undangan dengan **Desain AI** atau **memakai template katalog**, mengisi data, lalu membagikan link `/<invitationSlug>?to=<nama tamu>` lewat WhatsApp. Ada RSVP + ucapan tamu, amplop digital, musik, galeri, countdown. Monetisasi: paket per acara (sekarang `FREE / SILVER / GOLD` di `lib/limits.ts`).

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · Prisma 6 + PostgreSQL · better-auth (email + Google OAuth, plugin admin) · MinIO (S3) untuk upload · Midtrans (pembayaran) · nodemailer + Gmail SMTP (email verifikasi) · `@anthropic-ai/sdk` (Claude Opus 5.5, structured output) · Bun sebagai package manager.

## Menjalankan lokal
```
docker compose up -d postgres minio      # Postgres :5433, MinIO :9000 (console :9001)
bunx prisma db push && bunx prisma generate
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
Google login · Gmail SMTP · Postgres lokal · Desain AI (mesin tema, studio, kuota, preset) · redesign landing, dashboard, semua halaman user/auth/admin · verifikasi email asli (bukan simulasi) · ucapan tamu tampil di undangan · perbaikan bug RSVP (`type` hilang, case `HADIR`) · CMS template + halaman koleksi `/desain` + pilih template · MinIO lokal + upload thumbnail · AI dengan screenshot referensi (admin + user) · jadikan desain user sebagai template · pemilih lokasi peta di editor acara (`components/common/location-picker.tsx`, Leaflet + OpenStreetMap/Nominatim, menyimpan `lat/lng` + link Google Maps) dan peta OSM di kartu acara undangan · login admin terpisah di `/admin/login` (halaman admin ada di route group `app/admin/(panel)`, layout-nya mengarahkan non-admin ke `/admin/login?ditolak=1`; login user selalu ke `/dashboard`) · fallback thumbnail rusak (`components/common/safe-img.tsx`) · upgrade paket via transfer manual: `app/(user)/upgrade` + `app/api/payment/manual` (nominal + kode unik 3 digit, upload bukti), admin menyetujui di `/admin/transaksi` → `lib/payment.ts` `activateTransaction` mengaktifkan plan. Rekening dari env `MANUAL_PAYMENT_BANKS` (`Bank|Nomor|Atas nama;...`) dan `MANUAL_PAYMENT_WHATSAPP`. Midtrans (`app/api/payment/token`) masih ada tapi tidak dipakai UI.

## Belum dikerjakan / keputusan tertunda
1. Catatan peta: tile `tile.openstreetmap.org` dan Nominatim punya batas pemakaian; untuk trafik besar pakai penyedia tile/geocoding berbayar (mis. MapTiler) lewat env.
2. **Animasi template lebih hidup** (masuk dari samping, ornamen bergerak halus, layout lebih bebas) — diminta user, mengacu gaya our-wedding.link (hanya inspirasi, jangan menyalin).
3. **Pricing baru** belum diterapkan: Hemat Rp49rb / Premium Rp79rb / Eksklusif Rp99rb, tanpa paket gratis, batas tamu 100 / 300 / tanpa batas, kuota AI 1/5/10, add-on +100 tamu Rp15rb, upgrade bayar selisih, user bisa preview sebelum bayar. Ubah `lib/limits.ts`, enum `Plan`, halaman upgrade, Midtrans, migrasi user FREE.
4. **Multi-undangan per akun**: pindahkan slug/template/plan/tamu/RSVP dari `User` ke `Invitation`, pembayaran per undangan.
5. **Upload aset admin** (latar/ornamen gambar ke tema) dan tombol "Jadikan admin" di halaman Pengguna.
6. Migration Prisma tertinggal dari schema (`prisma/migrations` belum memuat Plan, Transaction, AiDesign, CatalogTemplate) — buat migration sebelum deploy.
7. Production env (Coolify): isi `GOOGLE_*`, `GMAIL_*`, `MINIO_*` (SSL, port 443), `ANTHROPIC_API_KEY`.
8. Route lama `app/api/templates/upload` (menulis file .tsx saat runtime) tidak dipakai lagi dan berisiko — hapus.
9. Testimoni landing dihapus (palsu); gambar `public/templates/*.png` berisi foto orang, bukan screenshot template — ganti.

## Konvensi
- Bahasa UI: Indonesia yang hangat dan sopan. Mobile-first (375px), tap target ≥44px.
- Jangan menyalin desain/aset/kode situs lain; referensi hanya untuk inspirasi gaya.
- Verifikasi tiap perubahan UI di browser (lebar 375px dan desktop) + `tsc --noEmit` + eslint.
