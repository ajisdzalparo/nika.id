import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowLeft, IconTicket } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/common/studio-ui";
import { MitraSalesReport } from "@/components/user/mitra-sales-report";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-helpers";
import { getUsableAgencyQuota } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

export default async function MitraSalesReportPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      accountType: true,
      agencyName: true,
      agencyQuota: true,
      agencyQuotaExpiresAt: true,
    },
  });

  if (!user) redirect("/login");
  if (user.accountType !== "AGENCY") redirect("/mitra");

  const [invitations, quotaPurchases] = await Promise.all([
    prisma.invitation.findMany({
      where: { userId: session.user.id, activatedAt: { not: null } },
      orderBy: { activatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        plan: true,
        clientName: true,
        clientWhatsapp: true,
        clientPrice: true,
        mitraCost: true,
        activatedAt: true,
        weddingDate: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, kind: "AGENCY_QUOTA" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        amount: true,
        addonUnits: true,
        status: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
      },
    }),
  ]);

  const usableQuota = getUsableAgencyQuota(user);
  const todayWib = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-6">
          <PageHeader
            eyebrow={user.agencyName || "Bisnis Mitra"}
            title="Laporan Penjualan"
            description="Catat harga jual ke setiap klien, pantau omzet, modal kuota, margin keuntungan, tren bulanan, dan riwayat pembelian kuota Anda."
            actions={
              <>
                <Link
                  href="/mitra"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "h-10 rounded-full border-[#E9DDC6] bg-white px-4 text-xs text-[#1F1A14] hover:border-[#8A6424]",
                  })}
                >
                  <IconArrowLeft size={15} /> Klien &amp; Undangan
                </Link>
                <Link
                  href="/upgrade?pilih=mitra#kuota-mitra"
                  className={buttonVariants({
                    variant: "ink",
                    size: "sm",
                    className: "h-10 px-4 text-xs",
                  })}
                >
                  <IconTicket size={15} /> Beli Kuota Mitra
                </Link>
              </>
            }
          />

          <MitraSalesReport
            todayWib={todayWib}
            usableQuota={usableQuota}
            quotaExpiresAt={user.agencyQuotaExpiresAt ? user.agencyQuotaExpiresAt.toISOString() : null}
            initialRows={invitations.map((inv) => ({
              id: inv.id,
              slug: inv.slug,
              title: inv.title,
              plan: inv.plan,
              clientName: inv.clientName,
              clientWhatsapp: inv.clientWhatsapp,
              clientPrice: inv.clientPrice,
              mitraCost: inv.mitraCost,
              activatedAt: (inv.activatedAt as Date).toISOString(),
              weddingDate: inv.weddingDate ? inv.weddingDate.toISOString() : null,
            }))}
            quotaPurchases={quotaPurchases.map((tx) => ({
              id: tx.id,
              amount: tx.amount,
              quotaAdded: tx.addonUnits,
              status: tx.status,
              paymentMethod: tx.paymentMethod ?? "MANUAL_TRANSFER",
              notes: tx.notes,
              createdAt: tx.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </>
  );
}
