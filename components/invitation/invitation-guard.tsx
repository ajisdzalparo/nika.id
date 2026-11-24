import Link from "next/link";
import type { PlanType } from "@/lib/limits";

interface GuardedInvitation {
  plan: PlanType;
  planExpiresAt?: Date | string | null;
  templateSlug?: string | null;
  isPublic?: boolean;
}

interface InvitationGuardProps {
  invitation: GuardedInvitation;
  isOwnerPreview?: boolean;
  children: React.ReactNode;
}

export function InvitationGuard({ invitation, isOwnerPreview = false, children }: InvitationGuardProps) {
  if (invitation.isPublic === false && !isOwnerPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4">
        <div className="max-w-md rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">SatuMoment</p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-[#1E1B17]">Undangan Tidak Dibagikan</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6358]">
            Pemilik undangan menonaktifkan akses publik untuk tautan ini.
          </p>
        </div>
      </div>
    );
  }

  // Unpaid accounts can preview their own invitation before paying, while public visitors see a notice
  if (invitation.plan === "FREE" && !isOwnerPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4">
        <div className="max-w-md rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">SatuMoment</p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-[#1E1B17]">Undangan Belum Diterbitkan</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6358]">
            Pemilik undangan sedang menyusun desain undangan ini. Jika Anda pemiliknya, silakan masuk ke dashboard untuk pratinjau dan mengaktifkan paket.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1E1B17] px-6 text-sm font-medium text-[#F7F3EC] hover:bg-[#2E2A24]">
            Masuk Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if invitation is active
  if (invitation.planExpiresAt && new Date() > new Date(invitation.planExpiresAt) && !isOwnerPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4">
        <div className="max-w-md rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">SatuMoment</p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-[#1E1B17]">Undangan Kedaluwarsa</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6358]">Masa aktif undangan ini telah berakhir.</p>
        </div>
      </div>
    );
  }

  // Check if user has selected a template
  if (!invitation.templateSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4">
        <div className="max-w-md rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">SatuMoment</p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-[#1E1B17]">Undangan Sedang Disiapkan</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6358]">Mempelai sedang merangkai momen indah untuk Anda. Silakan cek kembali beberapa saat lagi.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isOwnerPreview && (invitation.plan === "FREE" || invitation.isPublic === false) && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2A23] bg-[#15130F] px-4 py-2.5 text-xs text-[#F3EBDD]">
          <span>
            Mode Pratinjau ·{" "}
            {invitation.isPublic === false
              ? "Undangan ini sedang disembunyikan dari publik."
              : "Link ini belum dapat dibuka oleh tamu sebelum paket diaktifkan."}
          </span>
          {invitation.plan === "FREE" ? (
            <Link href="/upgrade" className="rounded-full bg-[#C9A45C] px-3.5 py-1 font-medium text-[#15130F] hover:opacity-90">
              Aktifkan Paket
            </Link>
          ) : (
            <Link href="/undangan" className="rounded-full bg-[#C9A45C] px-3.5 py-1 font-medium text-[#15130F] hover:opacity-90">
              Kelola Daftar Undangan
            </Link>
          )}
        </div>
      )}
      {children}
    </>
  );
}
