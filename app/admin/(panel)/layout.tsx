import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { shellTokens, studioClass } from "@/lib/studio";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Admins sign in through their own page; signed-in non-admins see why they were stopped.
  if (!session) redirect("/admin/login");
  if (session.user.role?.toLowerCase() !== "admin") redirect("/admin/login?ditolak=1");

  return (
    <SidebarProvider style={shellTokens} className={`${studioClass} bg-[#F1ECE3]`}>
      <AdminSidebar variant="inset" />
      <SidebarInset className="bg-[#F7F3EC]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
