import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";

function escapeCsvCell(raw: string | number | null | undefined): string {
  const str = String(raw ?? "");
  // Prevent CSV formula injection when opened in Excel / Google Sheets
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);

    const [attendees, messages] = await Promise.all([
      prisma.rSVP.findMany({
        where: { invitationId: active.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.guestMessage.findMany({
        where: { invitationId: active.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const rows: string[] = [
      ["Tipe", "Nama Tamu", "Status / Kehadiran", "Jumlah Tamu", "Ucapan / Keterangan", "Waktu"].map(escapeCsvCell).join(","),
    ];

    for (const r of attendees) {
      rows.push(
        [
          "RSVP",
          r.guestName,
          r.attendance,
          r.guests,
          "",
          r.createdAt.toISOString(),
        ]
          .map(escapeCsvCell)
          .join(","),
      );
    }

    for (const m of messages) {
      rows.push(
        [
          "UCAPAN",
          m.guestName,
          m.status,
          "",
          m.message,
          m.createdAt.toISOString(),
        ]
          .map(escapeCsvCell)
          .join(","),
      );
    }

    const safeSlug = (active.slug || "undangan").replace(/[^a-z0-9-_]+/gi, "-");
    const csvWithBom = `\uFEFF${rows.join("\r\n")}`;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rsvp-ucapan-${safeSlug}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("[RSVP_EXPORT]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
