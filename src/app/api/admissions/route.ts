import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { admissionSchema } from "@/lib/validators/patient";
import { logAudit } from "@/lib/utils/audit";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission("encounters", "read");
  if (error) return error;

  const status = request.nextUrl.searchParams.get("status") ?? "admitted";
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20");

  const encounters = await prisma.encounter.findMany({
    where: { status },
    take: limit,
    orderBy: { admissionDate: "desc" },
    include: {
      patient: {
        select: { uhid: true, name: true, gender: true, dateOfBirth: true },
      },
      bed: {
        select: { bedNumber: true, ward: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(encounters);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission("encounters", "create");
  if (error) return error;

  const body = await request.json();
  const validation = admissionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid admission data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { patientId, bedId, attendingDoctorId, admissionType, chiefComplaint, provisionalDiagnosis } =
    validation.data;

  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed || bed.status !== "available") {
    return NextResponse.json({ error: "Bed is not available" }, { status: 400 });
  }

  const existingAdmission = await prisma.encounter.findFirst({
    where: { patientId, status: "admitted" },
  });
  if (existingAdmission) {
    return NextResponse.json(
      { error: "Patient already has an active admission" },
      { status: 400 }
    );
  }

  const lastEncounter = await prisma.encounter.findFirst({
    orderBy: { createdAt: "desc" },
    select: { visNo: true },
  });
  const nextNum = lastEncounter
    ? parseInt(lastEncounter.visNo.split("/").pop() ?? "0") + 1
    : 1;
  const ipNo = `IP/${new Date().getFullYear()}/${String(nextNum).padStart(6, "0")}`;

  const encounter = await prisma.$transaction(async (tx) => {
    await tx.bed.update({
      where: { id: bedId },
      data: { status: "occupied" },
    });

    return tx.encounter.create({
      data: {
        visNo: ipNo,
        patientId,
        bedId,
        attendingDoctorId,
        admissionType,
        chiefComplaint,
        provisionalDiagnosis,
      },
      include: {
        patient: { select: { uhid: true, name: true } },
        bed: { select: { bedNumber: true, ward: { select: { name: true } } } },
      },
    });
  });

  await logAudit({
    userId: session!.user.id,
    action: "create",
    resourceType: "encounter",
    resourceId: encounter.id,
    newValue: { ipNo, patientId, bedId },
  });

  return NextResponse.json(encounter, { status: 201 });
}
