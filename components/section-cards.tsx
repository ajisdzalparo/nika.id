import Link from "next/link";

interface SectionCardsProps {
  stats: {
    totalUsers: number;
    totalTemplates: number;
    totalMessages: number;
    totalTransactions: number;
    totalAdmins: number;
  };
}

const fmt = new Intl.NumberFormat("id-ID");

/** Admin overview stats: one quiet strip in the studio palette (same pattern as the user dashboard). */
export function SectionCards({ stats }: SectionCardsProps) {
  const items = [
    { label: "Pasangan terdaftar", value: stats.totalUsers, note: "Akun non-admin", href: "/admin/users" },
    { label: "Template aktif", value: stats.totalTemplates, note: "Tayang di katalog", href: "/admin/templates" },
    { label: "Ucapan tamu", value: stats.totalMessages, note: "Perlu dimoderasi", href: "/admin/moderasi" },
    { label: "Transaksi", value: stats.totalTransactions, note: "Semua status", href: "/admin/transaksi" },
    { label: "Admin", value: stats.totalAdmins, note: "Pengelola sistem", href: "/admin/users" },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E1D8C9] bg-[#E1D8C9] @3xl/main:grid-cols-5">
        {items.map((s, i) => (
          <Link
            key={s.label}
            href={s.href}
            className={`bg-[#FFFDF9] p-5 transition-colors hover:bg-[#FBF8F2] ${i === items.length - 1 ? "col-span-2 @3xl/main:col-span-1" : ""}`}
          >
            <p className="text-[13px] text-[#6B6358]">{s.label}</p>
            <p className="mt-2 font-serif text-4xl tabular-nums text-[#1E1B17]">{fmt.format(s.value)}</p>
            <p className="mt-1 text-xs text-[#7D7468]">{s.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
