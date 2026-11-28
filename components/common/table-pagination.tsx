"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { SelectField } from "@/components/ui/select";
import type { SortState } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

/** Page numbers to render, with "…" gaps once there are more than 7 pages. */
function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const NAV_BTN =
  "inline-flex size-9 items-center justify-center rounded-lg border border-[#1F1A14]/10 bg-white text-[#1F1A14]/70 transition-colors hover:border-[#8A6424]/40 hover:text-[#1F1A14] disabled:pointer-events-none disabled:opacity-40";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  disabled?: boolean;
  className?: string;
}

/**
 * Table footer: "Showing 1 to [10 ▾] of N entries" on the left, first/prev/numbered/next/last on the right.
 * Shared by every paginated admin and dashboard table.
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  disabled,
  className,
}: TablePaginationProps) {
  const pages = Math.max(totalPages, 1);
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);
  // Past the last page (e.g. its last row was just deleted, or a stale ?page= link): step back to the real last page
  useEffect(() => {
    if (totalCount > 0 && currentPage > pages) onPageChange(pages);
  }, [totalCount, currentPage, pages, onPageChange]);

  const go = (p: number) => {
    if (p < 1 || p > pages || p === currentPage) return;
    onPageChange(p);
  };

  return (
    <div className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Menampilkan <span className="font-semibold text-[#1F1A14]">{from}</span> sampai
        </span>
        {onPageSizeChange ? (
          <SelectField
            size="sm"
            aria-label="Jumlah baris per halaman"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className="w-[68px]"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
        ) : (
          <span className="font-semibold text-[#1F1A14]">{to}</span>
        )}
        <span>
          dari <span className="font-semibold text-[#1F1A14]">{totalCount}</span> data
        </span>
      </div>

      <nav aria-label="Navigasi halaman" className="flex items-center gap-1.5">
        <button type="button" className={NAV_BTN} onClick={() => go(1)} disabled={disabled || currentPage <= 1} aria-label="Halaman pertama">
          <ChevronsLeft className="size-4" />
        </button>
        <button type="button" className={NAV_BTN} onClick={() => go(currentPage - 1)} disabled={disabled || currentPage <= 1} aria-label="Halaman sebelumnya">
          <ChevronLeft className="size-4" />
        </button>
        {pageItems(currentPage, pages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              disabled={disabled}
              aria-current={p === currentPage ? "page" : undefined}
              className={cn(
                NAV_BTN,
                "text-sm font-medium",
                p === currentPage && "border-[#1F1A14] bg-[#1F1A14] text-[#F6EEDD] hover:border-[#1F1A14] hover:text-[#F6EEDD]",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={NAV_BTN} onClick={() => go(currentPage + 1)} disabled={disabled || currentPage >= pages} aria-label="Halaman berikutnya">
          <ChevronRight className="size-4" />
        </button>
        <button type="button" className={NAV_BTN} onClick={() => go(pages)} disabled={disabled || currentPage >= pages} aria-label="Halaman terakhir">
          <ChevronsRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}

/**
 * Client-side paging for a list already in memory (filtered rows, guests, …).
 * Spread `pagination` into <TablePagination>; render `pageRows`. The page clamps when filters shrink the list.
 */
export function useClientPagination<T>(rows: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [rows, currentPage, pageSize]);
  return {
    pageRows,
    setPage,
    pagination: {
      currentPage,
      totalPages,
      totalCount: rows.length,
      pageSize,
      onPageChange: setPage,
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
  };
}

/**
 * Server-side paging driven by `?page=` and `?limit=` in the URL (the server page reads them with parsePageSize).
 * Returns the handlers for <TablePagination> plus `setParams` for search/filter inputs, which resets to page 1.
 */
export function useUrlPagination() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Stable handlers (they change only with the URL), so effects that depend on them don't re-run every render
  const push = useCallback(
    (mutate: (p: URLSearchParams) => void, replace = false) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      startTransition(() => {
        const url = `${pathname}?${params.toString()}`;
        if (replace) router.replace(url, { scroll: false });
        else router.push(url, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const onPageChange = useCallback((page: number) => push((p) => p.set("page", String(page))), [push]);
  const onPageSizeChange = useCallback(
    (size: number) =>
      push((p) => {
        p.set("limit", String(size));
        p.set("page", "1");
      }),
    [push],
  );
  /** Set (or clear, with "") filter params and go back to page 1. Replaces history so typing doesn't stack entries. */
  const setParams = useCallback(
    (values: Record<string, string>) =>
      push((p) => {
        for (const [k, v] of Object.entries(values)) {
          if (v) p.set(k, v);
          else p.delete(k);
        }
        p.set("page", "1");
      }, true),
    [push],
  );

  return { isPending, searchParams, onPageChange, onPageSizeChange, setParams };
}

/**
 * A search box bound to a URL param (default `?q=`), debounced. Typing writes to the URL after `delay` ms;
 * when the URL changes from outside (back/forward, a link) the box follows it. Spread into <Input value onChange>.
 */
export function useUrlSearch(setParams: (values: Record<string, string>) => void, searchParams: URLSearchParams, param = "q", delay = 400) {
  const urlValue = searchParams.get(param) || "";
  const [value, setValue] = useState(urlValue);
  // Follow outside URL changes by adjusting state during render (no effect, no extra render loop)
  const [seenUrlValue, setSeenUrlValue] = useState(urlValue);
  if (urlValue !== seenUrlValue) {
    setSeenUrlValue(urlValue);
    // Our own debounced write lands here too; keep what's typed (e.g. a trailing space) when it already matches
    if (value.trim() !== urlValue) setValue(urlValue);
  }

  useEffect(() => {
    const next = value.trim();
    if (next === urlValue) return;
    const t = setTimeout(() => setParams({ [param]: next }), delay);
    return () => clearTimeout(t);
  }, [value, urlValue, setParams, param, delay]);

  return { value, onChange: (e: { target: { value: string } }) => setValue(e.target.value) };
}

type SortValue = string | number | Date | null | undefined;

function compareValues(a: SortValue, b: SortValue) {
  // Empty values always sink to the bottom, whichever direction
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  if (a instanceof Date || b instanceof Date) return new Date(a as Date).getTime() - new Date(b as Date).getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "id", { numeric: true, sensitivity: "base" });
}

/** Next state when a header is clicked: ascending → descending → off (back to the default order). */
function nextSort(prev: SortState, key: string): SortState {
  if (prev?.key !== key) return { key, dir: "asc" };
  return prev.dir === "asc" ? { key, dir: "desc" } : null;
}

/**
 * Sorts rows already in memory. `accessors` maps each sortable column key to the value to compare.
 * Use with <SortableTableHead sort={sort} onSort={onSort} sortKey="…">, then paginate `sortedRows`.
 */
export function useClientSort<T>(rows: T[], accessors: Record<string, (row: T) => SortValue>, initial: SortState = null) {
  const [sort, setSort] = useState<SortState>(initial);
  const accessor = sort ? accessors[sort.key] : undefined;
  const sortedRows = useMemo(() => {
    if (!sort || !accessor) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    // Stable: equal values keep their original (default) order
    return rows
      .map((row, i) => ({ row, i }))
      .sort((x, y) => {
        const va = accessor(x.row);
        const vb = accessor(y.row);
        const aEmpty = va === null || va === undefined || va === "";
        const bEmpty = vb === null || vb === undefined || vb === "";
        const c = aEmpty || bEmpty ? compareValues(va, vb) : compareValues(va, vb) * factor;
        return c || x.i - y.i;
      })
      .map((x) => x.row);
  }, [rows, sort, accessor]);
  return { sortedRows, sort, onSort: (key: string) => setSort((prev) => nextSort(prev, key)) };
}

/**
 * Server-side sort through `?sort=` and `?dir=` (the server page reads them with readSort), back to page 1.
 * Pass the setParams from useUrlPagination.
 */
export function useUrlSort(setParams: (values: Record<string, string>) => void, searchParams: URLSearchParams) {
  const key = searchParams.get("sort");
  const sort: SortState = key ? { key, dir: searchParams.get("dir") === "asc" ? "asc" : "desc" } : null;
  // Server defaults put the newest first, so the first click on a column sorts ascending
  const onSort = (k: string) => {
    const next = nextSort(sort, k);
    setParams(next ? { sort: next.key, dir: next.dir } : { sort: "", dir: "" });
  };
  return { sort, onSort };
}
