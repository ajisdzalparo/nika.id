import { auth } from "@/lib/auth";
import { ensureAdminSeeded } from "@/lib/seed-admin";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const GET = async (req: Request) => {
  try {
    return await handlers.GET(req);
  } catch (error) {
    console.error("AUTH GET ERROR:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
export const POST = async (req: Request) => {
  try {
    await ensureAdminSeeded();
    return await handlers.POST(req);
  } catch (error) {
    console.error("UNKNOWN AUTH ERROR:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
