import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Old admin preview URL: forward to the public catalog preview.
export default async function AdminTemplatePreviewRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.catalogTemplate.findUnique({ where: { id }, select: { slug: true } });
  if (!row) notFound();
  redirect(`/preview/t/${row.slug}`);
}
