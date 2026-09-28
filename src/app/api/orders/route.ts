import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";
import { logAudit } from "@/lib/utils/audit";

const medicationOrderSchema = z.object({
  drugId: z.string().min(1),
  dose: z.string().min(1),
  unit: z.string().min(1),
  route: z.enum(["oral", "iv", "im", "sc", "topical", "inhalation"]),
  frequency: z.enum(["od", "bd", "tid", "qid", "sos", "stat", "prn"]),
  duration: z.string().optional(),
  isPrn: z.boolean().default(false),
  prnReason: z.string().optional(),
  instructions: z.string().optional(),
});

const investigationOrderSchema = z.object({
  investigationId: z.string().min(1),
  specimenType: z.string().optional(),
  clinicalIndication: z.string().optional(),
});

const dietOrderSchema = z.object({
  dietType: z.string().min(1),
  restrictions: z.string().optional(),
  specialInstructions: z.string().optional(),
});

const nursingOrderSchema = z.object({
  instruction: z.string().min(1),
  frequency: z.string().optional(),
  category: z.string().optional(),
});

const orderSchema = z.object({
  encounterId: z.string().min(1),
  orderType: z.enum(["medication", "investigation", "diet", "nursing", "procedure"]),
  priority: z.enum(["stat", "urgent", "routine"]).default("routine"),
  notes: z.string().optional(),
  medicationOrder: medicationOrderSchema.optional(),
  investigationOrder: investigationOrderSchema.optional(),
  dietOrder: dietOrderSchema.optional(),
  nursingOrder: nursingOrderSchema.optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requirePermission("orders", "read");
  if (error) return error;

  const encounterId = request.nextUrl.searchParams.get("encounterId");
  const orderType = request.nextUrl.searchParams.get("orderType");
  const status = request.nextUrl.searchParams.get("status");

  if (!encounterId) {
    return NextResponse.json({ error: "encounterId required" }, { status: 400 });
  }

  const where: Record<string, unknown> = { encounterId };
  if (orderType) where.orderType = orderType;
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderedAt: "desc" },
    include: {
      orderedBy: { select: { name: true, designation: true } },
      medicationOrder: {
        include: { drug: { select: { genericName: true, brandName: true, strength: true, form: true } } },
      },
      investigationOrder: {
        include: { investigation: { select: { name: true, category: true } } },
      },
      dietOrder: true,
      nursingOrder: true,
    },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission("orders", "create");
  if (error) return error;

  const body = await request.json();
  const validation = orderSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid order data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { encounterId, orderType, priority, notes, medicationOrder, investigationOrder, dietOrder, nursingOrder } = validation.data;

  const subOrderCreate: Record<string, unknown> = {};

  if (orderType === "medication" && medicationOrder) {
    subOrderCreate.medicationOrder = { create: medicationOrder };
  } else if (orderType === "investigation" && investigationOrder) {
    subOrderCreate.investigationOrder = { create: investigationOrder };
  } else if (orderType === "diet" && dietOrder) {
    subOrderCreate.dietOrder = { create: dietOrder };
  } else if (orderType === "nursing" && nursingOrder) {
    subOrderCreate.nursingOrder = { create: nursingOrder };
  }

  const order = await prisma.order.create({
    data: {
      encounterId,
      orderType,
      priority,
      notes,
      orderedById: session!.user.id,
      status: "signed",
      signedAt: new Date(),
      ...subOrderCreate,
    },
    include: {
      orderedBy: { select: { name: true, designation: true } },
      medicationOrder: orderType === "medication" ? { include: { drug: true } } : false,
      investigationOrder: orderType === "investigation" ? { include: { investigation: true } } : false,
      dietOrder: orderType === "diet",
      nursingOrder: orderType === "nursing",
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "create",
    resourceType: "order",
    resourceId: order.id,
    newValue: { orderType, priority },
  });

  return NextResponse.json(order, { status: 201 });
}
