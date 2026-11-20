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
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      if (!mailer) {
        console.log("\n" + "=".repeat(80));
        console.log("📧 EMAIL VERIFICATION LINK (Gmail SMTP not configured)");
        console.log("=".repeat(80));
        console.log(`User: ${user.name} (${user.email})`);
        console.log(`Verification URL: ${url}`);
        console.log("=".repeat(80) + "\n");
        return;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header with gradient -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">💝 Verifikasi Email Anda</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                          Halo <strong>${user.name || "Pengguna"}</strong>,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                          Terima kasih telah mendaftar di <strong>UNDANGIN YUK</strong>! Klik tombol di bawah untuk memverifikasi alamat email Anda dan mulai membuat undangan pernikahan digital yang indah.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);">
                                Verifikasi Email Saya
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                          Atau copy link berikut ke browser Anda:
                        </p>
                        <p style="color: #9ca3af; font-size: 13px; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 8px; margin: 8px 0 0 0;">
                          ${url}
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                          Email ini dikirim oleh <strong style="color: #ec4899;">UNDANGIN YUK</strong>
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                          Jika Anda tidak mendaftar di UNDANGIN YUK, abaikan email ini.
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
        to: user.email,
        subject: "Verifikasi Email Anda - UNDANGIN YUK",
        html: emailHtml,
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
