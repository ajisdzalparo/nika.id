import { UserSidebar } from "@/components/user-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { shellTokens, studioClass } from "@/lib/studio";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={shellTokens} className={`${studioClass} bg-[#F1ECE3]`}>
      <UserSidebar variant="inset" />
      <SidebarInset className="bg-[#F7F3EC]">{children}</SidebarInset>
    </SidebarProvider>
  );
}
