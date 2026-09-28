import { NextResponse } from "next/server";
import { prisma, isDemoMode } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  if (isDemoMode) {
    return NextResponse.json({
      totalBeds: 120,
      occupied: 87,
      available: 28,
      todayAdmissions: 6,
      recentAdmissions: [],
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalBeds, occupied, available, todayAdmissions, recentAdmissions] =
    await Promise.all([
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "occupied" } }),
      prisma.bed.count({ where: { status: "available" } }),
      prisma.encounter.count({
        where: { admissionDate: { gte: today } },
      }),
      prisma.encounter.findMany({
        take: 10,
        orderBy: { admissionDate: "desc" },
        include: {
          patient: { select: { uhid: true, name: true } },
          bed: {
            select: { bedNumber: true, ward: { select: { name: true } } },
          },
        },
      }),
    ]);

  return NextResponse.json({
    totalBeds,
    occupied,
    available,
    todayAdmissions,
    recentAdmissions,
  });
}
