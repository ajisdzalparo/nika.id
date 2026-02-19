import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession(request?: Request): Promise<Session | null> {
  try {
    const reqHeaders = request ? Object.fromEntries(request.headers) : Object.fromEntries(await headers());

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    return session;
  } catch {
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

  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session;
}
