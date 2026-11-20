# undangin yuk — konteks proyek untuk AI berikutnya

Salin seluruh file ini ke AI lain sebagai konteks awal. Ditulis 20 Nov 2026. Semua perubahan di bawah **belum di-commit** (branch `dev`, main branch `prod`).

## Produk
SaaS undangan pernikahan digital (Indonesia) dengan nama brand **UNDANGIN YUK**. User mendaftar (email/password atau Google), membuat undangan dengan **Desain AI** atau **memakai template katalog**, mengisi data, lalu membagikan link `/<invitationSlug>?to=<nama tamu>` lewat WhatsApp. Ada RSVP + ucapan tamu, amplop digital, musik (YouTube atau upload audio ke S3/MinIO), galeri, countdown. Monetisasi: paket per acara (`HEMAT` Rp49rb / `PREMIUM` Rp79rb / `EKSKLUSIF` Rp99rb + add-on `+100 tamu` Rp15rb di `lib/limits.ts`, `FREE` hanya untuk mode pratinjau sebelum bayar).

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
Google login · Gmail SMTP · Postgres lokal · Desain AI (mesin tema, studio, kuota, preset, base prompt + konteks gaya) · redesign landing, dashboard, semua halaman user/auth/admin · rebrand ke **UNDANGIN YUK** · karosel desain & animasi landing + template (reveal kiri/kanan/scale + gerak ornamen lembut + layout desktop split responsif) · editor undangan redesign + musik latar YouTube/upload S3 + musik default per template & di pengaturan superadmin (show/hide) · fix `next/image` unoptimized untuk MinIO lokal · toast Sonner tema studio · pricing baru (`HEMAT` Rp49rb / `PREMIUM` Rp79rb / `EKSKLUSIF` Rp99rb, bayar selisih upgrade, add-on +100 tamu Rp15rb, pratinjau pemilik `?preview=1` sebelum bayar) · **multi-undangan per akun** (`/undangan`, buat/edit/hapus undangan, pilih undangan aktif, toggle `isPublic` untuk memilih yang dibagikan, tamu/RSVP/ucapan/pembayaran per undangan) · upload aset gambar tema di admin + tombol "Jadikan admin" di `/admin/users` · hapus route berisiko `app/api/templates/upload` · verifikasi email asli · pemilih lokasi peta di editor acara · login admin terpisah di `/admin/login` · fallback thumbnail rusak (`components/common/safe-img.tsx`) · upgrade paket via transfer manual + Midtrans · metode bayar diatur super admin di `/admin/pengaturan-admin` (`components/admin/system-settings-manager.tsx`): switch Transfer bank / QRIS manual / Midtrans, rekening, gambar QRIS statis (`manual_qris_image`), WhatsApp; disimpan di tabel `SystemSetting` (`lib/system-settings.ts`). `lib/midtrans.ts` membedakan `enabled` (kunci ada → webhook & status tetap jalan) dan `checkoutEnabled` (boleh membuat pembayaran baru).

## Belum dikerjakan / keputusan tertunda
1. Catatan peta: tile `tile.openstreetmap.org` dan Nominatim punya batas pemakaian; untuk trafik besar pakai penyedia tile/geocoding berbayar (mis. MapTiler) lewat env.
2. Migration Prisma tertinggal dari schema (`prisma/migrations` belum memuat perubahan `Plan`, `Invitation` multi-undangan, `Transaction`, `AiDesign`, `CatalogTemplate`, `DefaultMusic`) — buat migration baseline/baru sebelum deploy produksi.
3. Production env (Coolify): isi `GOOGLE_*`, `GMAIL_*`, `MINIO_*` (SSL, port 443), `ANTHROPIC_API_KEY`.
4. Gambar `public/templates/*.png` masih berisi foto placeholder, bukan screenshot template — ganti. (Catatan: `components/home/testimonials.tsx` sudah tidak dipakai di landing baru.)

## Konvensi
- Bahasa UI: Indonesia yang hangat dan sopan. Mobile-first (375px), tap target ≥44px.
- Jangan menyalin desain/aset/kode situs lain; referensi hanya untuk inspirasi gaya.
- Verifikasi tiap perubahan UI di browser (lebar 375px dan desktop) + `tsc --noEmit` + eslint.
