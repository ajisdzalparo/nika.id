import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { shellTokens, studioClass } from "@/lib/studio";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(undefined, "admin");

  if (!session) redirect("/api/portal/exit?portal=admin");
  if (session.user.role?.toLowerCase() !== "admin") redirect("/admin/login?ditolak=1");

  return (
    <SidebarProvider style={shellTokens} className={`${studioClass} bg-[#F1ECE3]`}>
      <AdminSidebar
        variant="inset"
        adminUser={{
          name: session.user.name || "Admin",
          email: session.user.email || "",
          avatar: session.user.image || "",
        }}
      />
      <SidebarInset className="bg-[#F7F3EC]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
