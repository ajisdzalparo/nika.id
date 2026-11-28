/**
 * Plain-language messages for the `?error=` code better-auth (or Google) puts on the URL when "Masuk dengan Google"
 * fails. Client-safe. Unknown codes fall back to a generic message; the raw code is never shown to the user.
 */
const MESSAGES: Record<string, string> = {
  // The user closed or declined the Google consent screen
  access_denied: "Masuk dengan Google dibatalkan.",
  account_not_linked: "Email ini sudah terdaftar dengan password. Masuk dengan email dan password, atau cek email verifikasi dari kami.",
  unable_to_link_account: "Akun Google tidak bisa ditautkan ke akun ini. Masuk dengan email dan password Anda.",
  account_already_linked_to_different_user: "Akun Google ini sudah dipakai oleh akun SatuMoment lain.",
  email_does_not_match: "Email akun Google berbeda dengan email akun SatuMoment Anda.",
  email_not_found: "Akun Google ini tidak membagikan alamat email. Coba akun Google lain.",
  email_not_verified: "Email akun Google ini belum terverifikasi oleh Google.",
  state_mismatch: "Sesi masuk sudah kedaluwarsa. Silakan coba lagi.",
  please_restart_the_process: "Sesi masuk sudah kedaluwarsa. Silakan coba lagi.",
  invalid_code: "Sesi masuk sudah kedaluwarsa. Silakan coba lagi.",
  no_code: "Sesi masuk sudah kedaluwarsa. Silakan coba lagi.",
};

export function googleSignInErrorMessage(code: string | null | undefined) {
  if (!code) return null;
  return MESSAGES[code] ?? "Gagal masuk dengan Google. Silakan coba lagi, atau masuk dengan email dan password.";
}
