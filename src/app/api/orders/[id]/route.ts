import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/utils/audit";

const discontinueSchema = z.object({
  action: z.enum(["discontinue", "cancel"]),
  reason: z.string().min(1, "Reason is required"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("orders", "read");
  if (error) return error;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderedBy: { select: { name: true, designation: true } },
      medicationOrder: {
        include: {
          drug: {
            select: {
              genericName: true,
              brandName: true,
              strength: true,
              form: true,
            },
          },
        },
      },
      investigationOrder: {
        include: { investigation: { select: { name: true, category: true } } },
      },
      dietOrder: true,
      nursingOrder: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("orders", "update");
  if (error) return error;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (["discontinued", "cancelled", "completed"].includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot modify an order that is already ${order.status}` },
      { status: 400 }
    );
  }

  const body = await request.json();
  const validation = discontinueSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { action, reason } = validation.data;
  const oldStatus = order.status;
  const newStatus = action === "discontinue" ? "discontinued" : "cancelled";

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      discontinuedAt: new Date(),
      discontinuedReason: reason,
    },
    include: {
      orderedBy: { select: { name: true, designation: true } },
      medicationOrder: {
        include: {
          drug: {
            select: {
              genericName: true,
              brandName: true,
              strength: true,
              form: true,
            },
          },
        },
      },
      investigationOrder: {
        include: { investigation: { select: { name: true, category: true } } },
      },
      dietOrder: true,
      nursingOrder: true,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "update",
    resourceType: "order",
    resourceId: id,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus, reason },
  });

  return NextResponse.json(updated);
}
