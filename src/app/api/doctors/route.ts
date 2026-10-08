import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const doctors = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: "physician" },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        employeeId: true,
        designation: true,
        departmentId: true,
        department: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(doctors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
