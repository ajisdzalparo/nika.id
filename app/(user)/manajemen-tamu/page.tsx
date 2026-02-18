import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { GuestList } from "@/components/user/guest-list";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ManajemenTamuPage() {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) redirect("/login");

  const [user, initialGuests] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.guest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">Daftar Tamu</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola siapa saja yang akan menerima undangan spesialmu.</p>
            </div>
          </div>

          <GuestList initialGuests={initialGuests} invitationSlug={user.invitationSlug || "undangan"} />
        </div>
      </div>
    </>
  );
}
