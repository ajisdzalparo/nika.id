import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { EditorForm } from "@/components/user/editor-form";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";

export default async function EditorPage() {
  const session = await getSession(undefined, "user");

  if (!session) {
    redirect("/login");
  }

  const invitation = await getActiveInvitation(session.user.id);

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col min-h-screen">
        <div className="w-full px-4 lg:px-8 py-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] px-4 py-2.5 text-sm">
            <span className="text-[#6B5F50]">
              Mengedit undangan: <strong className="font-medium text-[#1F1A14]">{invitation.title}</strong>{" "}
              {invitation.slug && <span className="text-xs">(/{invitation.slug})</span>}
            </span>
            <Link href="/undangan" className="inline-flex min-h-10 items-center text-xs font-medium text-[#8A6424] hover:underline">
              Ganti / kelola daftar undangan →
            </Link>
          </div>
          <EditorForm key={invitation.id} initialData={invitation} templateConfig={null} />
        </div>
      </div>
    </>
  );
}
