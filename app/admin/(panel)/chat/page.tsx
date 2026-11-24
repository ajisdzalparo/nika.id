import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AdminChatInbox } from "@/components/admin/admin-chat-inbox";
import { getSession } from "@/lib/auth-helpers";
import { getThreadMessagesForAdmin, listAllAdminThreads } from "@/lib/support-chat";

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const session = await getSession(undefined, "admin");
  if (!session || session.user.role?.toLowerCase() !== "admin") {
    redirect("/admin/login");
  }

  const { thread: requestedThread } = await searchParams;
  const threads = await listAllAdminThreads();
  const activeId =
    requestedThread && threads.some((t) => t.id === requestedThread)
      ? requestedThread
      : threads[0]?.id ?? null;

  const messages = activeId ? await getThreadMessagesForAdmin(activeId) : [];

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-5 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Chat pelanggan</h1>
            <p className="text-sm text-muted-foreground">Live chat real-time dengan indikator mengetik, handoff Asisten AI, dan manajemen sesi</p>
          </div>
        </div>

        <AdminChatInbox
          initialThreads={threads.map((t) => ({
            ...t,
            lastMessageAt: t.lastMessageAt.toISOString(),
            waitingInQueue: t.waitingInQueue,
            queuePosition: t.queuePosition,
            requestedAdminAt: t.requestedAdminAt,
          }))}
          initialActiveId={activeId}
          initialMessages={messages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
