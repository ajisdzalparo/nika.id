import type { WeddingData } from "@/types/wedding";

export const MAX_CUSTOM_HTML_LENGTH = 150_000;

export const STANDARD_HTML_SECTIONS = [
  { id: "cover", label: "Sampul" },
  { id: "opening", label: "Pembukaan" },
  { id: "couple", label: "Mempelai" },
  { id: "countdown", label: "Hitung Mundur" },
  { id: "events", label: "Jadwal Acara" },
  { id: "story", label: "Kisah Cinta" },
  { id: "gallery", label: "Galeri Foto" },
  { id: "video", label: "Video" },
  { id: "gift", label: "Amplop / Kado" },
  { id: "rsvp", label: "RSVP & Ucapan" },
  { id: "closing", label: "Penutup" },
] as const;

export type StandardHtmlSectionId = (typeof STANDARD_HTML_SECTIONS)[number]["id"];

export interface HtmlStructureValidation {
  presentSections: StandardHtmlSectionId[];
  missingSections: StandardHtmlSectionId[];
  extraSections: string[];
  duplicateSections: StandardHtmlSectionId[];
  isValid: boolean;
}

/** Markup only: drops <style>/<script> bodies and comments, where selectors like [data-section="cover"] must not count. */
function markupOnly(rawHtml: string): string {
  return String(rawHtml ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
}

/**
 * Validates that custom HTML follows the canonical 11-section wedding structure:
 * every required `data-section="<id>"` must exist once on an element, without additions or omissions.
 * CSS selectors such as `[data-section="cover"]` inside <style> are ignored.
 */
export function validateStandardHtmlStructure(rawHtml: string): HtmlStructureValidation {
  const validIds = new Set<string>(STANDARD_HTML_SECTIONS.map((s) => s.id));
  const counts = new Map<StandardHtmlSectionId, number>();
  const extras = new Set<string>();
  // The attribute must sit inside an opening tag: <tag ... data-section="id" ...>
  const attrRe = /<[a-z][a-z0-9-]*\b[^>]*?\sdata-section\s*=\s*(?:"([a-z0-9_-]+)"|'([a-z0-9_-]+)'|([a-z0-9_-]+))/gi;
  const markup = markupOnly(rawHtml);

  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(markup)) !== null) {
    const val = (match[1] ?? match[2] ?? match[3] ?? "").trim().toLowerCase();
    if (!val) continue;
    if (validIds.has(val)) {
      const id = val as StandardHtmlSectionId;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    } else {
      extras.add(val);
    }
  }

  const presentSections: StandardHtmlSectionId[] = [];
  const missingSections: StandardHtmlSectionId[] = [];
  const duplicateSections: StandardHtmlSectionId[] = [];

  for (const item of STANDARD_HTML_SECTIONS) {
    const c = counts.get(item.id) ?? 0;
    if (c === 0) missingSections.push(item.id);
    else {
      presentSections.push(item.id);
      if (c > 1) duplicateSections.push(item.id);
    }
  }

  const extraSections = Array.from(extras);
  return {
    presentSections,
    missingSections,
    extraSections,
    duplicateSections,
    isValid: missingSections.length === 0 && extraSections.length === 0 && duplicateSections.length === 0,
  };
}

export const CUSTOM_HTML_PLACEHOLDERS: ReadonlyArray<{ token: string; label: string }> = [
  { token: "{{groomName}}", label: "Panggilan Pria" },
  { token: "{{brideName}}", label: "Panggilan Wanita" },
  { token: "{{groomFullName}}", label: "Nama Lengkap Pria" },
  { token: "{{brideFullName}}", label: "Nama Lengkap Wanita" },
  { token: "{{guestName}}", label: "Nama Tamu" },
  { token: "{{weddingDate}}", label: "Tanggal Acara" },
  { token: "{{eventTitle}}", label: "Judul Acara" },
  { token: "{{eventTime}}", label: "Waktu Acara" },
  { token: "{{eventVenue}}", label: "Nama Tempat" },
  { token: "{{eventAddress}}", label: "Alamat Acara" },
  { token: "{{openingText}}", label: "Teks Pembuka" },
  { token: "{{closingText}}", label: "Teks Penutup" },
  { token: "{{coverPhoto}}", label: "URL Foto Sampul" },
  { token: "{{groomPhoto}}", label: "URL Foto Pria" },
  { token: "{{bridePhoto}}", label: "URL Foto Wanita" },
];

export const ADMIN_AI_HTML_CONTEXT_PROMPT = `Kamu adalah desainer undangan pernikahan digital. Buat SATU template undangan HTML + CSS (tanpa JavaScript) untuk platform SatuMoment. Ikuti SEMUA aturan berikut, karena kode yang melanggar akan dibersihkan otomatis dan tampilannya rusak.

FORMAT JAWABAN
- Balas HANYA dengan kode, tanpa penjelasan dan tanpa \`\`\`.
- Kode dimulai dengan <link> Google Fonts (maksimal 1 baris), lalu satu <style>, lalu tepat 11 <section>.
- JANGAN menulis <!doctype>, <html>, <head>, <meta> atau <body>. Platform sudah menyediakannya (termasuk viewport HP).

STRUKTUR WAJIB (tepat 11 section, urutan ini, masing-masing satu kali)
<section data-section="cover">      sampul: nama pasangan, tanggal, "Kepada Yth." + {{guestName}}
<section data-section="opening">    salam pembuka + {{openingText}}
<section data-section="couple">     foto & nama lengkap kedua mempelai
<section data-section="countdown">  "Menuju hari bahagia" + {{weddingDate}} (tanpa hitung mundur berjalan, karena tidak ada JavaScript)
<section data-section="events">     {{eventTitle}}, {{weddingDate}}, {{eventTime}}, {{eventVenue}}, {{eventAddress}}
<section data-section="story">      kisah singkat pasangan
<section data-section="gallery">    galeri memakai {{coverPhoto}}, {{groomPhoto}}, {{bridePhoto}}
<section data-section="video">      judul + teks singkat (video disisipkan platform)
<section data-section="gift">       judul + teks tanda kasih (nomor rekening disisipkan platform)
<section data-section="rsvp">       judul + teks ajakan konfirmasi (form disisipkan platform)
<section data-section="closing">    {{closingText}} + nama pasangan
Atribut data-section HANYA di 11 <section> itu, tidak di elemen lain. Untuk styling, boleh memakai class atau selector [data-section="..."] di CSS.

PLACEHOLDER (tulis persis, termasuk kurung kurawal ganda)
{{groomName}} {{brideName}} {{groomFullName}} {{brideFullName}} {{guestName}} {{weddingDate}} {{eventTitle}} {{eventTime}} {{eventVenue}} {{eventAddress}} {{openingText}} {{closingText}} {{coverPhoto}} {{groomPhoto}} {{bridePhoto}}
Foto hanya dari placeholder foto (contoh: <img src="{{groomPhoto}}" alt="{{groomName}}">). Untuk hiasan pakai ILUSTRASI PLATFORM di bawah, SVG inline, atau gradien CSS. Jangan memakai URL gambar dari situs lain.

ILUSTRASI PLATFORM (boleh dipakai sebagai <img src="..."> atau background-image, latar transparan)
Pilih SATU set yang cocok dengan suasana, jangan dicampur:
- Taman Kayon (adat Jawa/Sunda, taman): /templates/art/taman-kayon/gebyok.svg (gapura atas, lebar penuh), rangkaian-bunga.svg (buket sudut kiri bawah; untuk kanan pakai transform: scaleX(-1)), sulur-gantung.svg (sulur tepi), kayon.svg (lambang gunungan), taman-kabut.svg (latar penuh)
- Kebun Sage (garden, rustic): /templates/art/kebun-sage/garland.svg, buket.svg, sulur.svg, lingkar.svg, latar.svg
- Mawar Vintage (romantis, blush, burgundy): /templates/art/mawar-vintage/garland.svg, buket.svg, sulur.svg, pita.svg, latar.svg
- Kamboja Tropis (pantai, Bali, boho): /templates/art/kamboja-tropis/garland.svg, buket.svg, sulur.svg, matahari.svg, latar.svg
Untuk tema gelap/mewah atau minimalis, buat ornamen garis sendiri dengan SVG inline berwarna aksen (emas, perak).

DILARANG (pasti dihapus)
<script>, <iframe>, <video>, <form>, <input>, <button>, <select>, <textarea>, <object>, <embed>, atribut on* (onclick, onload, …), URL javascript:, @import di CSS, dan <link> selain fonts.googleapis.com. Tombol dibuat dengan <a href="#events" class="...">.

DESAIN
- Mobile-first: rapi di lebar 360px tanpa scroll ke samping (gunakan max-width:100%, clamp(), flex-wrap), lalu elegan di 768px ke atas.
- Satu suasana yang konsisten: maksimal 2 jenis huruf (huruf script hanya untuk nama pasangan), palet tenang (latar, permukaan, teks, 1 warna aksen).
- Teks isi minimal 16px dengan line-height 1.6; kontras teks terhadap latar cukup tinggi.
- Bahasa Indonesia yang sopan dan hangat.

KOMPOSISI PREMIUM (wajib, standar platform)
- Undangan harus terasa berlapis, bukan halaman polos: di sampul ada bingkai/gapura di atas, buket bunga di kedua sudut bawah, sulur di tepi kiri-kanan, foto {{coverPhoto}} dalam bingkai (lengkung, oval, atau penuh layar dengan gradasi gelap), lalu nama besar di tengah.
- Hiasan diletakkan dengan position:absolute di dalam section yang position:relative; overflow:hidden pada section supaya tidak keluar layar; hiasan TIDAK BOLEH menutupi teks (beri z-index lebih rendah dari teks, letakkan di tepi dan sudut).
- Ulangi motif yang sama (lebih kecil) di section Mempelai, Acara dan Penutup supaya seluruh undangan satu keluarga desain.
- Teks di atas foto atau latar ramai wajib diberi panel kaca/gelap tipis (background semi-transparan + backdrop-filter: blur) agar tetap terbaca.

ANIMASI (wajib, hanya CSS)
- Sampul: nama pasangan, tanggal dan tombol muncul bergantian saat halaman dibuka (@keyframes fade + naik 12px, 500–700ms, animation-delay bertahap 0.1s, animation-fill-mode: both).
- Bagian lain muncul saat di-scroll, HANYA di dalam:
  @supports (animation-timeline: view()) { .reveal { animation: muncul linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; } }
  Di luar @supports itu, jangan pernah memberi opacity:0, supaya isi tetap terlihat di browser lama.
- Hiasan wajib hidup pelan terus-menerus: buket dan sulur berayun 2–4 derajat (transform-origin di pangkal), lambang melayang 6–10px, durasi 6–11 detik, delay berbeda tiap hiasan.
- Foto sampul dan latar bergerak sangat pelan (Ken Burns): scale 1.02 → 1.1 dalam 20–26 detik, alternate.
- Nama pasangan muncul dengan blur yang hilang perlahan (filter: blur(8px) → none, letter-spacing menyempit), 1.2–1.6 detik.
- Partikel suasana di sampul dan penutup: 6–10 kelopak (SVG inline kecil) atau bintik emas yang jatuh pelan dari atas ke bawah (14–20 detik, delay berbeda, rotate), di belakang teks dan pointer-events:none.
- Gerakan tenang: translate 8–16px, tanpa memantul, tanpa berkedip, tanpa parallax berlebihan.
- Wajib: @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }

CEK SEBELUM MENJAWAB
1) Ada tepat 11 <section data-section> dengan id di atas. 2) Tidak ada tag/atribut dari daftar DILARANG. 3) Semua 15 placeholder dipakai minimal sekali. 4) Tidak ada <html>/<head>/<body>/<meta>. 5) Ada animasi sampul, reveal saat scroll di dalam @supports, dan aturan prefers-reduced-motion. 6) Sampul berlapis (bingkai atas, buket sudut, sulur, partikel) dan motifnya diulang di Mempelai, Acara dan Penutup tanpa menutupi teks.`;

export const SAMPLE_WEDDING_HTML_STARTER = `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cormorant Garamond', Georgia, serif;
    background: #FAF8F4;
    color: #15130F;
    line-height: 1.65;
  }
  .hero {
    min-height: 88vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 56px 24px;
    background: linear-gradient(180deg, #FBF6EB 0%, #FAF8F4 100%);
    border-bottom: 1px solid #E6DFD3;
  }
  .eyebrow {
    font-family: system-ui, sans-serif;
    font-size: 11px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #8A6A2F;
    margin-bottom: 14px;
  }
  .names {
    font-size: clamp(2.4rem, 7vw, 4.2rem);
    font-weight: 500;
    color: #15130F;
    line-height: 1.1;
  }
  .amp { color: #8A6A2F; font-style: italic; margin: 0 8px; }
  .guest-pill {
    margin-top: 24px;
    padding: 10px 22px;
    border-radius: 999px;
    border: 1px solid #DFD2BC;
    background: #FFFDF9;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    color: #5C4620;
  }
  .section {
    max-width: 720px;
    margin: 0 auto;
    padding: 56px 24px;
    text-align: center;
    border-bottom: 1px solid #EFEAE1;
  }
  .section-title { font-size: 30px; font-weight: 500; color: #15130F; }
  .card {
    background: #FFFDF9;
    border: 1px solid #E6DFD3;
    border-radius: 18px;
    padding: 28px 22px;
    margin-top: 20px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }
  .avatar {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid #DFD2BC;
    margin: 0 auto 12px;
    display: block;
  }
  .btn {
    display: inline-block;
    margin-top: 22px;
    padding: 11px 26px;
    border-radius: 999px;
    background: #15130F;
    color: #FAF8F4;
    text-decoration: none;
    font-family: system-ui, sans-serif;
    font-size: 12px;
    letter-spacing: 0.08em;
  }
  .muted { color: #5E574D; font-family: system-ui, sans-serif; font-size: 14px; }
  @media (min-width: 768px) {
    .hero { padding: 80px 48px; }
  }
</style>

<section data-section="cover" class="hero">
  <p class="eyebrow">The Wedding Of</p>
  <h1 class="names">{{groomName}} <span class="amp">&amp;</span> {{brideName}}</h1>
  <p style="margin-top:12px;color:#5E574D;font-size:18px;">{{weddingDate}}</p>
  <div class="guest-pill">Kepada Yth: <strong>{{guestName}}</strong></div>
  <a href="#acara" class="btn">Buka Undangan</a>
</section>

<section data-section="opening" class="section">
  <p class="eyebrow">Pembukaan</p>
  <p class="muted">{{openingText}}</p>
</section>

<section data-section="couple" class="section">
  <p class="eyebrow">Mempelai</p>
  <h2 class="section-title">Pasangan Berbahagia</h2>
  <div class="grid-2">
    <div class="card">
      <img src="{{groomPhoto}}" alt="{{groomName}}" class="avatar">
      <h3 style="font-size:24px;">{{groomFullName}}</h3>
      <p class="muted">Mempelai Pria</p>
    </div>
    <div class="card">
      <img src="{{bridePhoto}}" alt="{{brideName}}" class="avatar">
      <h3 style="font-size:24px;">{{brideFullName}}</h3>
      <p class="muted">Mempelai Wanita</p>
    </div>
  </div>
</section>

<section data-section="countdown" class="section">
  <p class="eyebrow">Hitung Mundur</p>
  <h2 class="section-title">Menuju Hari Bahagia</h2>
  <p class="muted" style="margin-top:8px;">{{weddingDate}}</p>
</section>

<section id="acara" data-section="events" class="section">
  <p class="eyebrow">Jadwal Acara</p>
  <div class="card">
    <h3 style="font-size:24px;color:#8A6A2F;">{{eventTitle}}</h3>
    <p class="muted" style="margin-top:8px;">{{eventTime}}</p>
    <p style="margin-top:6px;font-weight:600;">{{eventVenue}}</p>
    <p class="muted" style="margin-top:4px;">{{eventAddress}}</p>
  </div>
</section>

<section data-section="story" class="section">
  <p class="eyebrow">Kisah Cinta</p>
  <h2 class="section-title">Perjalanan Kami</h2>
  <div class="card">
    <p class="muted">Dari pertemuan sederhana hingga melangkah bersama menuju ikatan suci pernikahan.</p>
  </div>
</section>

<section data-section="gallery" class="section">
  <p class="eyebrow">Galeri Foto</p>
  <h2 class="section-title">Momen Bersama</h2>
  <div class="card">
    <img src="{{coverPhoto}}" alt="Galeri" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;">
  </div>
</section>

<section data-section="video" class="section">
  <p class="eyebrow">Video</p>
  <h2 class="section-title">Cuplikan Momen</h2>
  <p class="muted" style="margin-top:8px;">Tautan video prewedding tampil otomatis pada undangan aktif.</p>
</section>

<section data-section="gift" class="section">
  <p class="eyebrow">Amplop Digital</p>
  <h2 class="section-title">Tanda Kasih</h2>
  <div class="card">
    <p class="muted">Doa restu Anda merupakan karunia terindah bagi kami.</p>
  </div>
</section>

<section data-section="rsvp" class="section">
  <p class="eyebrow">RSVP &amp; Ucapan</p>
  <h2 class="section-title">Konfirmasi Kehadiran</h2>
  <p class="muted" style="margin-top:8px;">Mohon konfirmasi kehadiran dan tuliskan doa terbaik Anda.</p>
</section>

<section data-section="closing" class="section" style="border-bottom:none;">
  <p class="eyebrow">Penutup</p>
  <p class="muted">{{closingText}}</p>
  <p style="margin-top:18px;font-size:24px;color:#8A6A2F;">{{groomName}} &amp; {{brideName}}</p>
</section>`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

function isSafeUrl(raw: string, allowRelative = true): boolean {
  const v = raw.trim();
  if (!v) return false;
  if (v.startsWith("#")) return true;
  if (allowRelative && v.startsWith("/") && !v.startsWith("//")) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(v)) return true;
  return false;
}

/**
 * Multi-pass defense-in-depth HTML/CSS sanitizer.
 * Removes scripts, active embeds, inline event handlers, javascript: URIs, and dangerous CSS functions.
 * Intended to pair with a zero-privilege `<iframe sandbox="">` container.
 */
export function sanitizeCustomHtml(rawInput: string): { html: string; strippedWarnings: string[] } {
  const warnings = new Set<string>();
  let html = String(rawInput ?? "");

  if (html.length > MAX_CUSTOM_HTML_LENGTH) {
    html = html.slice(0, MAX_CUSTOM_HTML_LENGTH);
    warnings.add("Ukuran HTML dipotong ke batas maksimal 150 KB.");
  }

  // Strip control chars / null bytes
  html = html.replace(/\u0000/g, "");

  // AI chat answers are often wrapped in ```html … ``` fences
  html = html.replace(/^\s*```[a-z]*\s*\n?/i, "").replace(/\n?\s*```\s*$/i, "");

  // <meta> is always removed (we add our own charset + viewport), so it is not worth a warning
  html = html.replace(/<meta\b[^>]*>/gi, "");

  // Remove active / executable tags completely
  const dangerousBlockRe =
    /<(script|noscript|iframe|frame|frameset|object|embed|applet|base|meta|form|foreignObject|template|slot)\b[\s\S]*?<\/\1\s*>/gi;
  if (dangerousBlockRe.test(html)) {
    warnings.add("Tag aktif/berisiko (script/iframe/object/form) dihapus otomatis.");
  }
  html = html.replace(dangerousBlockRe, "");

  const dangerousVoidRe =
    /<(script|iframe|frame|object|embed|applet|base|input|button|select|textarea|foreignObject)\b[^>]*\/?>/gi;
  const removedVoid = new Set<string>();
  html = html.replace(dangerousVoidRe, (_m, tag: string) => {
    removedVoid.add(tag.toLowerCase());
    return "";
  });
  html = html.replace(/<\/(button|select|textarea)\s*>/gi, "");
  if (removedVoid.size > 0) {
    warnings.add(`Tag interaktif/berisiko dihapus: <${Array.from(removedVoid).join(">, <")}>. Form RSVP & tombol disediakan oleh platform.`);
  }

  // Keep only safe Google Fonts <link> stylesheets; remove all other <link> tags
  html = html.replace(/<link\b([^>]*)>/gi, (full, attrs: string) => {
    const isStylesheet = /\brel\s*=\s*("stylesheet"|'stylesheet'|stylesheet\b)/i.test(attrs);
    const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "").trim();
    if (isStylesheet && /^https:\/\/fonts\.googleapis\.com\//i.test(href)) {
      return `<link rel="stylesheet" href="${escapeHtml(href)}">`;
    }
    warnings.add("Tag <link> eksternal non-Google Fonts dihapus.");
    return "";
  });

  // Strip inline event handlers (onclick, onerror, onload, etc.) regardless of quoting
  const eventAttrRe = /(\s+)on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s>]+)/gi;
  if (eventAttrRe.test(html)) {
    warnings.add("Atribut event inline (on*) dihapus otomatis.");
  }
  html = html.replace(eventAttrRe, "");

  // Strip bare boolean/val-less on* attributes or srcdoc / formaction
  html = html.replace(/\s+(?:srcdoc|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s+on[a-z0-9_-]+(?=\s|>|\/)/gi, "");

  // Strip unsafe URLs in href / src / poster / xlink:href / srcset
  html = html.replace(
    /\s(href|src|poster|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (full, attr: string, q1: string, q2: string, bare: string) => {
      const val = (q1 ?? q2 ?? bare ?? "").trim();
      // Keep template placeholders like {{coverPhoto}}
      if (/^\{\{[a-zA-Z0-9_]+\}\}$/.test(val)) {
        return ` ${attr}="${val}"`;
      }
      if (!isSafeUrl(val)) {
        warnings.add("Atribut URL tidak aman (javascript:/vbscript:/data:) dihapus.");
        return ` ${attr}="#"`;
      }
      return ` ${attr}="${val}"`;
    },
  );

  // Sanitize dangerous CSS inside <style> blocks
  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_m, cssBody: string) => {
    let safeCss = cssBody;
    if (/expression\s*\(|-moz-binding\s*:|behavior\s*:|@import\b|javascript:/i.test(safeCss)) {
      warnings.add("Ekspresi CSS berbahaya (@import / expression / javascript:) dihapus.");
    }
    safeCss = safeCss
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/-moz-binding\s*:[^;]+;?/gi, "")
      .replace(/behavior\s*:[^;]+;?/gi, "")
      .replace(/@import\b[^;]+;?/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]+))\s*\)/gi, (uFull, d1: string, d2: string, d3: string) => {
        const target = (d1 ?? d2 ?? d3 ?? "").trim();
        if (/^\{\{[a-zA-Z0-9_]+\}\}$/.test(target) || isSafeUrl(target, true)) {
          return uFull;
        }
        return "none";
      });
    return `<style>${safeCss}</style>`;
  });

  // Strip javascript:/expression inside inline style="..."
  html = html.replace(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (_m, s1: string, s2: string) => {
    const rawStyle = s1 ?? s2 ?? "";
    if (/expression\s*\(|-moz-binding\s*:|behavior\s*:|javascript:|vbscript:/i.test(rawStyle)) {
      warnings.add("Atribut style CSS berbahaya (expression / javascript:) dihapus otomatis.");
    }
    const safeStyle = rawStyle
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/-moz-binding\s*:[^;]+;?/gi, "")
      .replace(/behavior\s*:[^;]+;?/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "");
    return ` style="${safeStyle.replace(/"/g, "&quot;")}"`;
  });

  return { html: html.trim(), strippedWarnings: Array.from(warnings) };
}

function fmtDateId(d?: string | Date | null): string {
  if (!d) return "Minggu, 20 Desember 2026";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return "Minggu, 20 Desember 2026";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(parsed);
}

/**
 * Baseline added in front of every custom HTML template: no sideways scroll on phones, and a gentle
 * scroll reveal for each section when the browser supports scroll-driven animations. Everything sits
 * in :where() (zero specificity), so any animation or style the template defines itself wins.
 */
export const PLATFORM_HTML_BASE_CSS = `
html { overflow-x: hidden; overflow-y: auto; }
/* Only the document scrolls: overflow-x:hidden on <body> (ours or the template's) would turn it into a
   second scroll box and show two scrollbars. "clip" trims sideways overflow without that. */
body { margin: 0; overflow-x: clip !important; overflow-y: visible !important; }
:where(img, svg, video) { max-width: 100%; height: auto; }
@keyframes uy-section-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  :where([data-section]:not([data-section="cover"])) {
    animation: uy-section-in linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 25%;
  }
}
@media (prefers-reduced-motion: reduce) {
  :where([data-section]) { animation: none !important; }
}`;

/**
 * Turns a full document (<!doctype><html><head>…<body>…) into a fragment: keeps the head's <link>/<style>
 * and the body content. The caller wraps it in our own document so charset + mobile viewport are always set.
 */
function toFragment(html: string): string {
  if (!/<html\b|<body\b|<head\b|<!doctype/i.test(html)) return html;
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const headAssets = (head.match(/<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? []).join("\n");
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  const content =
    body ??
    html
      .replace(/<!doctype[^>]*>/gi, "")
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, "")
      .replace(/<\/?(html|body)\b[^>]*>/gi, "");
  return `${headAssets}\n${content}`.trim();
}

/**
 * Compiles sanitized HTML template with HTML-escaped wedding fields and wraps inside a clean HTML5 document.
 */
export function compileSafeWeddingHtml(rawHtml: string, data: WeddingData, { hideScrollbar = false } = {}): string {
  const { html } = sanitizeCustomHtml(rawHtml);
  const ev = data.events?.[0] ?? data.event;

  const safeImgUrl = (url?: string) => (url && isSafeUrl(url, true) ? escapeHtml(url) : "/templates/minimal.png");

  const tokens: Record<string, string> = {
    groomName: escapeHtml(data.groom.nickname || data.groom.fullName || "Rama"),
    brideName: escapeHtml(data.bride.nickname || data.bride.fullName || "Sinta"),
    groomFullName: escapeHtml(data.groom.fullName || data.groom.nickname || "Rama Wijaya"),
    brideFullName: escapeHtml(data.bride.fullName || data.bride.nickname || "Sinta Dewi"),
    guestName: escapeHtml(data.guestName || "Bapak & Ibu Tamu"),
    weddingDate: escapeHtml(fmtDateId(ev?.date)),
    eventTitle: escapeHtml(ev?.title || "Akad & Resepsi Pernikahan"),
    eventTime: escapeHtml(ev?.time || "09.00 WIB - Selesai"),
    eventVenue: escapeHtml(ev?.venue || "Pendopo Agung"),
    eventAddress: escapeHtml(ev?.address || "Jakarta Selatan"),
    openingText: escapeHtml(
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri momen bahagia kami.",
    ),
    closingText: escapeHtml("Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberi doa restu."),
    coverPhoto: safeImgUrl(data.gallery?.[0] || data.bride.photo || data.groom.photo),
    groomPhoto: safeImgUrl(data.groom.photo),
    bridePhoto: safeImgUrl(data.bride.photo),
  };

  const rendered = toFragment(html.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_m, key: string) => tokens[key] ?? ""));

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap">
<style>${PLATFORM_HTML_BASE_CSS}${hideScrollbar ? " html { scrollbar-width: none; } html::-webkit-scrollbar { display: none; }" : ""}</style>
</head>
<body>
${rendered}
</body>
</html>`;
}
