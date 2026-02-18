import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { EditorForm } from "@/components/user/editor-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditorPage() {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      invitation: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen">
        <div className="w-full px-4 lg:px-8 py-8">
          <EditorForm initialData={user.invitation} templateConfig={null} />
        </div>
      </div>
    </>
  );
}
