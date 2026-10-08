import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";

const dischargeMedicationSchema = z.object({
  drugId: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

const dischargeSchema = z.object({
  diagnosisSummary: z.string().optional(),
  courseInHospital: z.string().optional(),
  proceduresDone: z.string().optional(),
  conditionAtDischarge: z.string().optional(),
  instructions: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
  followUpInstructions: z.string().optional(),
  dischargeMedications: z.array(dischargeMedicationSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("discharge", "read");
  if (error) return error;

  const { id } = await params;

  try {
    const encounter = await prisma.encounter.findUnique({ where: { id } });
    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    const summary = await prisma.dischargeSummary.findUnique({
      where: { encounterId: id },
      include: {
        dischargeMedications: {
          include: {
            drug: {
              select: {
                id: true,
                genericName: true,
                brandName: true,
                strength: true,
                form: true,
              },
            },
          },
        },
      },
    });

    if (!summary) {
      return NextResponse.json(
        { error: "Discharge summary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch discharge summary" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("discharge", "create");
  if (error) return error;

  const { id } = await params;

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const existing = await prisma.dischargeSummary.findUnique({
    where: { encounterId: id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Discharge summary already exists for this encounter" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const validation = dischargeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid discharge data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { dischargeMedications, followUpDate, ...rest } = validation.data;

    const summary = await prisma.dischargeSummary.create({
      data: {
        encounterId: id,
        ...rest,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        preparedBy: session!.user.id,
        dischargeMedications: dischargeMedications
          ? {
              create: dischargeMedications.map((m) => ({
                drugId: m.drugId,
                dose: m.dose,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions,
              })),
            }
          : undefined,
      },
      include: {
        dischargeMedications: {
          include: {
            drug: {
              select: {
                id: true,
                genericName: true,
                brandName: true,
                strength: true,
                form: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(summary, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create discharge summary" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("discharge", "update");
  if (error) return error;

  const { id } = await params;

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const existing = await prisma.dischargeSummary.findUnique({
    where: { encounterId: id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Discharge summary not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const validation = dischargeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid discharge data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { dischargeMedications, followUpDate, ...rest } = validation.data;

    const summary = await prisma.$transaction(async (tx) => {
      if (dischargeMedications) {
        await tx.dischargeMedication.deleteMany({
          where: { summaryId: existing.id },
        });
      }

      const updated = await tx.dischargeSummary.update({
        where: { id: existing.id },
        data: {
          ...rest,
          followUpDate: followUpDate ? new Date(followUpDate) : undefined,
          approvedBy: session!.user.id,
          approvedAt: new Date(),
          dischargeMedications: dischargeMedications
            ? {
                create: dischargeMedications.map((m) => ({
                  drugId: m.drugId,
                  dose: m.dose,
                  frequency: m.frequency,
                  duration: m.duration,
                  instructions: m.instructions,
                })),
              }
            : undefined,
        },
        include: {
          dischargeMedications: {
            include: {
              drug: {
                select: {
                  id: true,
                  genericName: true,
                  brandName: true,
                  strength: true,
                  form: true,
                },
              },
            },
          },
        },
      });

      await tx.encounter.update({
        where: { id },
        data: {
          status: "discharged",
          dischargeDate: new Date(),
        },
      });

      if (encounter.bedId) {
        await tx.bed.update({
          where: { id: encounter.bedId },
          data: { status: "available" },
        });
      }

      return updated;
    });

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Failed to update discharge summary" },
      { status: 500 }
    );
  }
}
