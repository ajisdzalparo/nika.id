import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Gmail SMTP (needs a Google App Password, not the normal account password).
// Only initialized when both values are set; otherwise links are logged to the console.
const mailer =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
        },
      })
    : null;

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
                    <p style="color: #c8b08a; margin: 0 0 8px 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">UNDANGIN YUK</p>
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
    // Gmail always sends from GMAIL_USER; EMAIL_FROM only sets the display name
    from: `"${process.env.EMAIL_FROM_NAME || "UNDANGIN YUK"}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: emailHtml,
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "https://nikayuk.programmer-ngonten.my.id",
  trustedOrigins: [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL, "https://nikayuk.programmer-ngonten.my.id"].filter(Boolean) as string[],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    trustProxy: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset Password Akun - UNDANGIN YUK",
        heading: "Reset Password Akun",
        greetingName: user.name || "Pengguna",
        message: "Kami menerima permintaan untuk mereset password akun UNDANGIN YUK Anda. Klik tombol di bawah untuk membuat password baru.",
        ctaLabel: "Buat Password Baru",
        ctaUrl: url,
        footerNote: "Link berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.",
        consoleLabel: "PASSWORD RESET LINK",
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verifikasi Email Anda - UNDANGIN YUK",
        heading: "Verifikasi Email Anda",
        greetingName: user.name || "Pengguna",
        message: "Terima kasih telah mendaftar di UNDANGIN YUK. Klik tombol di bawah untuk memverifikasi alamat email Anda dan mulai membuat undangan pernikahan digital.",
        ctaLabel: "Verifikasi Email Saya",
        ctaUrl: url,
        footerNote: "Email ini dikirim oleh UNDANGIN YUK. Jika Anda tidak mendaftar, abaikan email ini.",
        consoleLabel: "EMAIL VERIFICATION LINK",
      });
    },
    sendOnSignUp: true,
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
