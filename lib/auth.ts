import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL, "http://nikayuk.ajisdzalparo.com", "https://nikayuk.ajisdzalparo.com", "http://localhost:3000"].filter(Boolean) as string[],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      // If Resend is not configured, log the verification URL for development
      if (!resend) {
        console.log("\n" + "=".repeat(80));
        console.log("📧 EMAIL VERIFICATION LINK (Resend not configured)");
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
                          Terima kasih telah mendaftar di <strong>nika.id</strong>! Klik tombol di bawah untuk memverifikasi alamat email Anda dan mulai membuat undangan pernikahan digital yang indah.
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
                          Email ini dikirim oleh <strong style="color: #ec4899;">nika.id</strong>
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                          Jika Anda tidak mendaftar di nika.id, abaikan email ini.
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

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@nika.id",
        to: user.email,
        subject: "Verifikasi Email Anda - nika.id",
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
          },
        },
      }
    : {}),
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
