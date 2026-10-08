import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/utils/audit";

const transferSchema = z.object({
  toBedId: z.string().min(1),
  reason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("encounters", "read");
  if (error) return error;

  const { id } = await params;

  const transfers = await prisma.transfer.findMany({
    where: { encounterId: id },
    orderBy: { transferTime: "desc" },
    include: {
      fromBed: {
        select: { bedNumber: true, ward: { select: { name: true } } },
      },
      toBed: {
        select: { bedNumber: true, ward: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(transfers);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("encounters", "update");
  if (error) return error;

  const { id } = await params;

  const encounter = await prisma.encounter.findUnique({
    where: { id },
    select: { id: true, bedId: true, status: true },
  });

  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }
  if (encounter.status !== "admitted") {
    return NextResponse.json(
      { error: "Can only transfer admitted patients" },
      { status: 400 }
    );
  }
  if (!encounter.bedId) {
    return NextResponse.json(
      { error: "Patient has no current bed assignment" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const validation = transferSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid transfer data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { toBedId, reason } = validation.data;

  if (toBedId === encounter.bedId) {
    return NextResponse.json(
      { error: "Destination bed is the same as current bed" },
      { status: 400 }
    );
  }

  const newBed = await prisma.bed.findUnique({ where: { id: toBedId } });
  if (!newBed || newBed.status !== "available") {
    return NextResponse.json(
      { error: "Destination bed is not available" },
      { status: 400 }
    );
  }

  const transfer = await prisma.$transaction(async (tx) => {
    await tx.bed.update({
      where: { id: encounter.bedId! },
      data: { status: "available" },
    });

    await tx.bed.update({
      where: { id: toBedId },
      data: { status: "occupied" },
    });

    await tx.encounter.update({
      where: { id },
      data: { bedId: toBedId },
    });

    return tx.transfer.create({
      data: {
        encounterId: id,
        fromBedId: encounter.bedId!,
        toBedId,
        reason,
        transferredBy: session!.user.id,
      },
      include: {
        fromBed: {
          select: { bedNumber: true, ward: { select: { name: true } } },
        },
        toBed: {
          select: { bedNumber: true, ward: { select: { name: true } } },
        },
      },
    });
  });

  await logAudit({
    userId: session!.user.id,
    action: "create",
    resourceType: "transfer",
    resourceId: transfer.id,
    newValue: { fromBedId: encounter.bedId, toBedId, reason },
  });

  return NextResponse.json(transfer, { status: 201 });
}
