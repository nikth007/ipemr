import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

const administrationSchema = z.object({
  scheduleId: z.string().min(1),
  doseGiven: z.string().min(1),
  site: z.string().optional(),
  notes: z.string().optional(),
});

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

    const schedules = await prisma.marSchedule.findMany({
      where: { encounterId: id },
      orderBy: { scheduledTime: "asc" },
      include: {
        medicationOrder: {
          include: {
            drug: {
              select: { id: true, genericName: true, brandName: true },
            },
          },
        },
        administration: true,
      },
    });

    const result = schedules.map((s) => ({
      id: s.id,
      scheduledTime: s.scheduledTime,
      status: s.status,
      drugName: s.medicationOrder.drug.genericName,
      brandName: s.medicationOrder.drug.brandName,
      dose: s.medicationOrder.dose,
      route: s.medicationOrder.route,
      frequency: s.medicationOrder.frequency,
      administration: s.administration,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch MAR data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const body = await request.json();
  const validation = administrationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid administration data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const schedule = await prisma.marSchedule.findUnique({
      where: { id: validation.data.scheduleId },
    });

    if (!schedule || schedule.encounterId !== id) {
      return NextResponse.json(
        { error: "Schedule not found for this encounter" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const administration = await tx.marAdministration.create({
        data: {
          scheduleId: validation.data.scheduleId,
          administeredBy: session!.user.id,
          administeredAt: new Date(),
          doseGiven: validation.data.doseGiven,
          site: validation.data.site,
          notes: validation.data.notes,
        },
      });

      await tx.marSchedule.update({
        where: { id: validation.data.scheduleId },
        data: { status: "administered" },
      });

      return administration;
    });

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to record administration" },
      { status: 500 }
    );
  }
}
