import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { LandingCmsEditor } from "@/components/admin/landing-cms-editor";
import { getSession } from "@/lib/auth-helpers";
import { getLandingContent } from "@/lib/landing-content";

export default async function AdminCmsPage() {
  const session = await getSession(undefined, "admin");
  if (!session || session.user.role?.toLowerCase() !== "admin") {
    redirect("/admin/login");
  }

  const initialContent = await getLandingContent();

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8 w-full space-y-6">
        <div>
          <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Tulisan landing page</h1>
          <p className="text-muted-foreground">
            Ubah teks halaman depan (Hero, Cara Kerja, Fitur, FAQ, CTA, dan Footer) tanpa perlu menyentuh kode.
          </p>
        </div>
        <LandingCmsEditor initialContent={initialContent} />
      </div>
    </>
  );
}
