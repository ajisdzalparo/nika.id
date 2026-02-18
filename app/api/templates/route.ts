import { NextResponse } from "next/server";
import { getAllTemplates } from "@/lib/templates";

// GET /api/templates - list all templates (from source code)
export async function GET() {
  const templates = getAllTemplates();
  return NextResponse.json(templates);
}
