import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { EditTemplateForm } from "@/components/admin/edit-template-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  // @ts-expect-error - Template model is available at runtime
  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
            <p className="text-muted-foreground">Perbarui detail template {template.name}</p>
          </div>

          <EditTemplateForm template={template} />
        </div>
      </div>
    </>
  );
}
