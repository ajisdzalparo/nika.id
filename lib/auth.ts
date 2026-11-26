import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Outgoing mail. Preferred: any SMTP server (domain mailbox from the hosting provider, Zoho,
// Resend, Brevo, ...) via SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS. Fallback: Gmail with a Google
// App Password. When neither is configured, links are logged to the console instead.
const smtpPort = Number(process.env.SMTP_PORT) || 465;

const mailer = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      // 465 = implicit TLS; 587/25 start plain and upgrade with STARTTLS
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
        },
      })
    : null;

/** Sender address: must be a mailbox (or verified alias) of the account that authenticates. */
const mailFromAddress = process.env.EMAIL_FROM || (process.env.SMTP_HOST ? process.env.SMTP_USER : process.env.GMAIL_USER);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendAuthEmail({
  to,
  subject,
  heading,
  greetingName,
  message,
  ctaLabel,
  ctaUrl,
  footerNote,
  consoleLabel,
}: {
  to: string;
  subject: string;
  heading: string;
  greetingName: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
  consoleLabel: string;
}) {
  if (!mailer) {
    console.log("\n" + "=".repeat(80));
    console.log(`📧 ${consoleLabel} (Gmail SMTP not configured)`);
    console.log("=".repeat(80));
    console.log(`User: ${greetingName} (${to})`);
    console.log(`URL: ${ctaUrl}`);
    console.log("=".repeat(80) + "\n");
    return;
  }

  const safeName = escapeHtml(greetingName || "Pengguna");
  const safeUrl = escapeHtml(ctaUrl);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f3ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f3ec; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #fffdf9; border: 1px solid #e1d8c9; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="background-color: #1e1b17; padding: 36px 40px; text-align: center;">
                    <p style="color: #c8b08a; margin: 0 0 8px 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">SatuMoment</p>
                    <h1 style="color: #f7f3ec; margin: 0; font-size: 24px; font-weight: 600;">${escapeHtml(heading)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 40px;">
                    <p style="color: #1e1b17; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                      Halo <strong>${safeName}</strong>,
                    </p>
                    <p style="color: #5d554b; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                      ${escapeHtml(message)}
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 16px 0;">
                          <a href="${safeUrl}" style="display: inline-block; background-color: #1e1b17; color: #f7f3ec; text-decoration: none; padding: 14px 36px; border-radius: 999px; font-weight: 600; font-size: 14px;">
                            ${escapeHtml(ctaLabel)}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #7b7165; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
                      Atau salin link berikut ke browser Anda:
                    </p>
                    <p style="color: #6b6257; font-size: 12px; word-break: break-all; background-color: #f7f3ec; border: 1px solid #e5dccf; padding: 12px; border-radius: 8px; margin: 8px 0 0 0;">
                      ${safeUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f7f3ec; padding: 20px 24px; text-align: center; border-top: 1px solid #e1d8c9;">
                    <p style="color: #6b6257; font-size: 12px; margin: 0;">
                      ${escapeHtml(footerNote)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await mailer.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "SatuMoment"}" <${mailFromAddress}>`,
    to,
    subject,
    html: emailHtml,
  });
}

const IS_LOCAL_AUTH_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(process.env.BETTER_AUTH_URL ?? "");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "https://undanginyuk.ajisdzalparo.com",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "https://undanginyuk.ajisdzalparo.com",
    // Local development is always allowed, even if .env carries production URLs
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
    // A local `next start` (any port) is trusted too; never applies when BETTER_AUTH_URL is a real domain
    ...(IS_LOCAL_AUTH_URL ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
  ].filter(Boolean) as string[],
  advanced: {
    crossSubDomainCookies: {
      // A Domain=localhost cookie is dropped by browsers reaching the app through any other host
      // (LAN IP on a phone, test tunnels), which silently breaks login. Keep host-only cookies locally.
      enabled: !IS_LOCAL_AUTH_URL,
    },
    trustProxy: true,
  },
  // Local runs: automated test browsers all sign in from one IP and would trip the limiter.
  // Real deployments (BETTER_AUTH_URL is a domain) keep Better Auth's default rate limiting.
  ...(IS_LOCAL_AUTH_URL ? { rateLimit: { enabled: false } } : {}),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset Password Akun - SatuMoment",
        heading: "Reset Password Akun",
        greetingName: user.name || "Pengguna",
        message: "Kami menerima permintaan untuk mereset password akun SatuMoment Anda. Klik tombol di bawah untuk membuat password baru.",
        ctaLabel: "Buat Password Baru",
        ctaUrl: url,
        footerNote: "Link berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.",
        consoleLabel: "PASSWORD RESET LINK",
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      // Send people to the app's /verify-email page instead of the raw API link: that page verifies the
      // token, then opens the user portal (cookie) so the auto sign-in actually lands on the dashboard.
      const verifyPageUrl = `${new URL(url).origin}/verify-email?token=${encodeURIComponent(token)}`;
      await sendAuthEmail({
        to: user.email,
        subject: "Verifikasi Email Anda - SatuMoment",
        heading: "Verifikasi Email Anda",
        greetingName: user.name || "Pengguna",
        message: "Terima kasih telah mendaftar di SatuMoment. Klik tombol di bawah untuk memverifikasi alamat email Anda dan mulai membuat undangan pernikahan digital.",
        ctaLabel: "Verifikasi Email Saya",
        ctaUrl: verifyPageUrl,
        footerNote: "Email ini dikirim oleh SatuMoment. Jika Anda tidak mendaftar, abaikan email ini.",
        consoleLabel: "EMAIL VERIFICATION LINK",
      });
    },
    sendOnSignUp: true,
    // Signing in with an unverified account sends a fresh activation link (the old one may have expired)
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Always let the user pick which Google account to use
            prompt: "select_account",
          },
        },
      }
    : {}),
  databaseHooks: {
    user: {
      create: {
        // Social sign-ups (Google) don't send invitationSlug, so generate one
        before: async (user) => {
          const data = user as typeof user & { invitationSlug?: string | null };
          if (data.invitationSlug) return { data };
          const base =
            (data.name || data.email.split("@")[0])
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "") || "undangan";
          return { data: { ...data, invitationSlug: `${base}-${Date.now().toString().slice(-4)}` } };
        },
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // Google verifies emails, so an existing email/password account with the
      // same address is linked instead of failing with "account not linked".
      trustedProviders: ["google"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      },
      invitationSlug: {
        type: "string",
        required: false,
      },
      plan: {
        type: "string",
        required: false,
        defaultValue: "FREE",
      },
      planExpiresAt: {
        type: "date",
        required: false,
      },
    },
  },
  plugins: [admin()],
});

export type Session = typeof auth.$Infer.Session;
