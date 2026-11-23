export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    const net = await import("node:net");
    // Prefer IPv4 in Docker bridge networks where IPv6 egress is disabled/unroutable.
    dns.setDefaultResultOrder("ipv4first");
    if (typeof net.setDefaultAutoSelectFamily === "function") {
      net.setDefaultAutoSelectFamily(false);
    }

    const { ensureAdminSeeded } = await import("@/lib/seed-admin");
    await ensureAdminSeeded();
  }
}
