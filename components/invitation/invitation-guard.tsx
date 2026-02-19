import { notFound } from "next/navigation";
import { UserWithPlan } from "@/types/user";

interface InvitationGuardProps {
  user: UserWithPlan;
  children: React.ReactNode;
}

export function InvitationGuard({ user, children }: InvitationGuardProps) {
  if (!user) {
    notFound();
  }

  // Check if invitation is active
  if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-md mx-4">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl grayscale opacity-50">⌛</div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Undangan Kedaluwarsa</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Masa aktif undangan ini telah berakhir.</p>
        </div>
      </div>
    );
  }

  // Check if user has selected a template
  if (!user.templateSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/30">
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-md mx-4">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Undangan Sedang Disiapkan</h1>
          <p className="text-gray-600">Mempelai sedang merangkai momen indah untuk Anda. Silakan cek kembali beberapa saat lagi!</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
