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
      maintenance: 5,
      todayAdmissions: 6,
      todayDischarges: 3,
      pendingOrders: 12,
      criticalAlerts: 2,
      censusByWard: [],
      recentAdmissions: [],
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBeds,
    occupied,
    available,
    maintenance,
    todayAdmissions,
    todayDischarges,
    pendingOrders,
    criticalAlerts,
    censusByWard,
    recentAdmissions,
  ] = await Promise.all([
    prisma.bed.count(),
    prisma.bed.count({ where: { status: "occupied" } }),
    prisma.bed.count({ where: { status: "available" } }),
    prisma.bed.count({ where: { status: "maintenance" } }),
    prisma.encounter.count({
      where: { admissionDate: { gte: today } },
    }),
    prisma.encounter.count({
      where: { dischargeDate: { gte: today } },
    }),
    prisma.order.count({
      where: { status: { in: ["signed", "active"] } },
    }),
    prisma.criticalAlert.count({
      where: { acknowledgedAt: null },
    }),
    prisma.ward.findMany({
      select: {
        id: true,
        name: true,
        wardType: true,
        beds: {
          select: { status: true },
        },
      },
      where: { isActive: true },
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

  const wardCensus = censusByWard.map((w) => ({
    id: w.id,
    name: w.name,
    wardType: w.wardType,
    total: w.beds.length,
    occupied: w.beds.filter((b) => b.status === "occupied").length,
    available: w.beds.filter((b) => b.status === "available").length,
  }));

  return NextResponse.json({
    totalBeds,
    occupied,
    available,
    maintenance,
    todayAdmissions,
    todayDischarges,
    pendingOrders,
    criticalAlerts,
    censusByWard: wardCensus,
    recentAdmissions,
  });
}
