import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const drugs = await prisma.drugMaster.findMany({
      where: { isActive: true },
      orderBy: { genericName: "asc" },
      select: {
        id: true,
        genericName: true,
        brandName: true,
        strength: true,
        form: true,
        route: true,
        category: true,
      },
    });

    return NextResponse.json(drugs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch drugs" },
      { status: 500 }
    );
  }
}
