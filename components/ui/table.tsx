"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

/** Rounded card around a table (and its pagination footer, when placed inside). */
function TableCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-card"
      className={cn("overflow-hidden rounded-2xl border border-[#E9DDC6] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)]", className)}
      {...props}
    />
  )
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-[#FBF7EF] [&_tr]:border-b [&_tr]:border-[#EFE6D4] [&_tr:hover]:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-[#EFE6D4] bg-[#FBF7EF] font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-[#F3EBDB] transition-colors hover:bg-[#FCF8F1] data-[state=selected]:bg-[#F6EEDF]",
        className
      )}
      {...props}
    />
  )
}

const HEAD_CLASS =
  "h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap text-[#6B5F50] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th data-slot="table-head" className={cn(HEAD_CLASS, className)} {...props} />
}

export type SortDir = "asc" | "desc"
export type SortState = { key: string; dir: SortDir } | null

/**
 * A column header that sorts its table. Click cycles: ascending → descending → back to the default order.
 * Works with useClientSort (rows in memory) and useUrlSort (server-side, via ?sort=&dir=).
 */
function SortableTableHead({
  sortKey,
  sort,
  onSort,
  align = "left",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"th">, "onClick"> & {
  sortKey: string
  sort: SortState
  onSort: (key: string) => void
  align?: "left" | "right"
}) {
  const active = sort?.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <th
      data-slot="table-head"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(HEAD_CLASS, "p-0", className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex h-11 w-full items-center gap-1.5 px-4 uppercase tracking-[inherit] transition-colors hover:text-[#1F1A14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6424]/30",
          align === "right" && "justify-end",
          active && "text-[#1F1A14]"
        )}
      >
        {children}
        <Icon className={cn("size-3.5 shrink-0", active ? "text-[#8A6424]" : "opacity-45")} aria-hidden="true" />
      </button>
    </th>
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3.5 align-middle whitespace-nowrap text-[#1F1A14] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  TableCard,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  SortableTableHead,
  TableRow,
  TableCell,
  TableCaption,
}
