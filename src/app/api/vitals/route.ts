import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";
import { logAudit } from "@/lib/utils/audit";

const vitalsSchema = z.object({
  encounterId: z.string().min(1),
  temperature: z.number().min(90).max(110).optional(),
  pulse: z.number().int().min(20).max(250).optional(),
  bpSystolic: z.number().int().min(40).max(300).optional(),
  bpDiastolic: z.number().int().min(20).max(200).optional(),
  spo2: z.number().int().min(0).max(100).optional(),
  respiratoryRate: z.number().int().min(4).max(60).optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  gcs: z.number().int().min(3).max(15).optional(),
  weight: z.number().min(0.5).max(300).optional(),
  bloodSugar: z.number().min(10).max(600).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requirePermission("vitals", "read");
  if (error) return error;

  const encounterId = request.nextUrl.searchParams.get("encounterId");
  if (!encounterId) {
    return NextResponse.json({ error: "encounterId required" }, { status: 400 });
  }

  const vitals = await prisma.vitals.findMany({
    where: { encounterId },
    orderBy: { recordedAt: "desc" },
    include: {
      recordedBy: { select: { name: true } },
    },
  });

  return NextResponse.json(vitals);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission("vitals", "create");
  if (error) return error;

  const body = await request.json();
  const validation = vitalsSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid vitals data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const vitals = await prisma.vitals.create({
    data: {
      ...validation.data,
      recordedAt: new Date(),
      recordedById: session!.user.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "create",
    resourceType: "vitals",
    resourceId: vitals.id,
    newValue: validation.data,
  });

  return NextResponse.json(vitals, { status: 201 });
}
