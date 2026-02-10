import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

export async function getSession(request?: Request): Promise<Session | null> {
  try {
    const session = await auth.api.getSession({
      headers: request?.headers,
    });

    return session;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request?: Request) {
  const session = await getSession(request);

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdmin(request?: Request) {
  const session = await requireAuth(request);

  // @ts-ignore - additional fields from better-auth
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return session;
}
