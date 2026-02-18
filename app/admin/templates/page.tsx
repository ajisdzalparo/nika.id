import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { TemplateCard } from "@/components/admin/template-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function TemplatesPage() {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "admin") {
    redirect("/login");
  }

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Template Forge</h1>
              <p className="text-muted-foreground">Manajemen desain undangan pernikahan</p>
            </div>
            <Link href="/admin/templates/tambah">
              <Button>Tambah Template</Button>
            </Link>
          </div>

          {/* Template Grid - data dari database */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
