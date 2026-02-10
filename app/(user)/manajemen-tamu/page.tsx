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

  if (!session) {
    redirect("/login");
  }

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
      <div className="flex flex-1 flex-col bg-gray-50/50">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Manajemen Tamu</h1>
            <p className="text-muted-foreground">Kelola daftar tamu dan sebar undangan secara personal.</p>
          </div>

          <GuestList initialGuests={initialGuests} invitationSlug={user.invitationSlug || "undangan"} />
        </div>
      </div>
    </>
  );
}

