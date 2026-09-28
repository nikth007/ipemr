import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const encounter = await prisma.encounter.findUnique({ where: { id } });
    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { encounterId: id, orderType: "investigation" },
      orderBy: { orderedAt: "desc" },
      include: {
        investigationOrder: {
          include: {
            investigation: {
              select: { id: true, name: true, category: true },
            },
            results: {
              orderBy: { reportedAt: "desc" },
              select: {
                id: true,
                resultData: true,
                resultStatus: true,
                isAbnormal: true,
                isCritical: true,
                reportedAt: true,
              },
            },
          },
        },
      },
    });

    const result = orders
      .filter((o) => o.investigationOrder)
      .map((o) => ({
        orderId: o.id,
        orderStatus: o.status,
        orderedAt: o.orderedAt,
        investigationName: o.investigationOrder!.investigation.name,
        category: o.investigationOrder!.investigation.category,
        results: o.investigationOrder!.results,
      }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch investigations" },
      { status: 500 }
    );
  }
}
