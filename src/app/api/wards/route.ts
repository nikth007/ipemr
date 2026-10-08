import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        department: {
          select: { name: true },
        },
        beds: {
          where: { status: "available" },
          select: { id: true },
        },
      },
    });

    const result = wards.map((w) => ({
      id: w.id,
      name: w.name,
      wardType: w.wardType,
      floor: w.floor,
      departmentName: w.department.name,
      availableBeds: w.beds.length,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch wards" },
      { status: 500 }
    );
  }
}
