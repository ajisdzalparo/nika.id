/** Page sizes offered by TablePagination; shared by server pages that read `?limit=`. */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

/** Clamp a page-size query param to one of the allowed options. */
export function parsePageSize(raw: string | undefined, fallback = 10): number {
  const n = Number(raw);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : fallback;
}

const MAX_PAGE = 10_000;

/** Search text from `?q=`: trimmed and capped so a pasted wall of text can't become a heavy LIKE query. */
export function readSearch(q: string | undefined, max = 100) {
  return (q || "").trim().slice(0, max);
}

/** Reads `?page=` and `?limit=`; returns Prisma skip/take plus the values for TablePagination. */
export function readPagination(params: { page?: string; limit?: string }, fallbackSize = 10) {
  const pageSize = parsePageSize(params.limit, fallbackSize);
  // Clamp: a huge ?page= would become a huge OFFSET (or overflow Prisma's Int)
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(params.page || "1", 10) || 1));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Reads `?sort=` and `?dir=` against an allow-list of sortable keys (anything else falls back to the default),
 * so a URL can never sort by an arbitrary column.
 */
export function readSort<K extends string>(params: { sort?: string; dir?: string }, allowed: readonly K[]): { key: K; dir: "asc" | "desc" } | null {
  const key = allowed.find((k) => k === params.sort);
  if (!key) return null;
  return { key, dir: params.dir === "asc" ? "asc" : "desc" };
}
