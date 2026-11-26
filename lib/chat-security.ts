const RATE_BUCKET = new Map<string, number[]>();

/** Strip control chars and neutralize user-supplied markdown image tags so only verified uploads render as images. */
export function sanitizeChatText(raw: string, maxLen = 1500): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "[$1]($2)")
    .trim()
    .slice(0, maxLen);
}

/** Detect real raster image MIME type by inspecting file header magic bytes (blocks SVG/HTML/JS spoofing). */
export function detectRasterImageMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF87a / GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return "image/gif";
  }

  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/** Detect real audio MIME type by inspecting container/frame header magic bytes. */
export function detectAudioMime(bytes: Uint8Array): "audio/mpeg" | "audio/wav" | "audio/ogg" | "audio/mp4" | "audio/webm" | null {
  if (bytes.length < 12) return null;

  // MP3 with ID3 tag or MPEG ADTS/MP3 frame sync
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  ) {
    return "audio/mpeg";
  }

  // WAV: RIFF....WAVE
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return "audio/wav";
  }

  // OGG: OggS
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return "audio/ogg";
  }

  // MP4 / M4A: ....ftyp
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "audio/mp4";
  }

  // WebM / EBML: 1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "audio/webm";
  }

  return null;
}

/** Validate that an attachment URL strictly points to our own MinIO/S3 bucket and is a safe raster image. */
export function isOwnSafeChatImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  const trimmed = url.trim();
  const base = (process.env.MINIO_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  const bucket = (process.env.MINIO_BUCKET || "uploads").trim();
  if (!base) return false;

  try {
    const parsed = new URL(trimmed);
    const expectedBase = new URL(base);
    if (parsed.protocol !== expectedBase.protocol || parsed.host !== expectedBase.host) return false;
    if (!parsed.pathname.startsWith(`/${bucket}/`)) return false;
    if (parsed.pathname.includes("..")) return false;
    return /\.(jpe?g|png|webp|gif)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Client IP behind the reverse proxy, for rate-limit keys on public endpoints.
 * With the Cloudflare proxy on, X-Forwarded-For only carries Cloudflare's edge IP (shared by many guests),
 * so the visitor's address from CF-Connecting-IP comes first.
 */
export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

const RATE_BUCKET_MAX_KEYS = 5_000;
const RATE_BUCKET_IDLE_MS = 60 * 60_000;

/** Simple sliding-window rate limiter per user key to prevent chat/upload spam. */
export function checkChatRateLimit(key: string, maxRequests = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  // Public endpoints key by IP + slug/guest, so drop idle keys before the map grows without bound
  if (RATE_BUCKET.size > RATE_BUCKET_MAX_KEYS) {
    for (const [k, stamps] of RATE_BUCKET) {
      if (!stamps.length || now - stamps[stamps.length - 1] > RATE_BUCKET_IDLE_MS) RATE_BUCKET.delete(k);
    }
  }
  const prev = RATE_BUCKET.get(key) ?? [];
  const recent = prev.filter((ts) => now - ts < windowMs);
  if (recent.length >= maxRequests) {
    RATE_BUCKET.set(key, recent);
    return false;
  }
  recent.push(now);
  RATE_BUCKET.set(key, recent);
  return true;
}
