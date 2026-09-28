import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const investigations = await prisma.investigationMaster.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        specimenType: true,
        normalRange: true,
        unit: true,
      },
    });

    return NextResponse.json(investigations);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch investigations" },
      { status: 500 }
    );
  }
}
