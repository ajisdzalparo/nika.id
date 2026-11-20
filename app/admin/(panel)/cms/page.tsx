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
      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CMS Tulisan Landing Page</h1>
          <p className="text-muted-foreground">
            Ubah teks halaman depan (Hero, Cara Kerja, Fitur, FAQ, CTA, dan Footer) tanpa perlu menyentuh kode.
          </p>
        </div>
        <LandingCmsEditor initialContent={initialContent} />
      </div>
    </>
  );
}
