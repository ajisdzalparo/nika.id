import { SiteHeader } from "@/components/site-header";
import { PageHeader, StatTile } from "@/components/common/studio-ui";
import { MitraApplicationsClient, type AdminMitraApplication } from "@/components/admin/mitra-applications-client";
import { prisma } from "@/lib/prisma";
import { IconBuildingStore, IconClockHour4, IconUserCheck } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function AdminMitraPage() {
  const [rows, mitraCount] = await Promise.all([
    prisma.mitraApplication.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 300 }),
    prisma.user.count({ where: { accountType: "AGENCY" } }),
  ]);

  // Which applicants already have an account (needed before approval)
  const emails = [...new Set(rows.filter((r) => !r.userId).map((r) => r.email))];
  const accounts = emails.length
    ? await prisma.user.findMany({ where: { email: { in: emails, mode: "insensitive" } }, select: { email: true } })
    : [];
  const hasAccount = new Set(accounts.map((a) => a.email.toLowerCase()));

  const applications: AdminMitraApplication[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    whatsapp: r.whatsapp,
    applicantType: r.applicantType,
    businessName: r.businessName,
    businessKind: r.businessKind,
    instagram: r.instagram,
    city: r.city,
    note: r.note,
    status: r.status,
    adminNote: r.adminNote,
    hasAccount: Boolean(r.userId) || hasAccount.has(r.email.toLowerCase()),
    createdAt: r.createdAt.toISOString(),
  }));
  const pending = applications.filter((a) => a.status === "PENDING").length;

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="w-full space-y-8">
          <PageHeader
            eyebrow="Program Mitra"
            title="Pengajuan Mitra"
            description="Akun hanya menjadi Mitra lewat persetujuan admin: dari form di landing page atau halaman Mitra di sini, atau dari obrolan WhatsApp lewat menu Pengguna (tombol Jadikan Mitra)."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Menunggu ditinjau" value={pending} icon={IconClockHour4} />
            <StatTile label="Mitra aktif" value={mitraCount} icon={IconBuildingStore} href="/admin/users?tipe=agency" />
            <StatTile label="Total pengajuan" value={applications.length} icon={IconUserCheck} />
          </div>
          <MitraApplicationsClient initial={applications} />
        </div>
      </div>
    </>
  );
}
