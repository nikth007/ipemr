import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/utils/audit";

const registerSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().datetime().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  abhaId: z.string().optional(),
  allergies: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const validation = registerSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid patient data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const lastPatient = await prisma.patient.findFirst({
      orderBy: { createdAt: "desc" },
      select: { uhid: true },
    });
    const nextNum = lastPatient
      ? parseInt(lastPatient.uhid.replace("SMF", "")) + 1
      : 1;
    const uhid = `SMF${String(nextNum).padStart(6, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        uhid,
        name: validation.data.name,
        gender: validation.data.gender,
        dateOfBirth: validation.data.dateOfBirth
          ? new Date(validation.data.dateOfBirth)
          : undefined,
        phone: validation.data.phone,
        email: validation.data.email,
        address: validation.data.address,
        bloodGroup: validation.data.bloodGroup,
        abhaId: validation.data.abhaId,
        allergies: validation.data.allergies,
      },
    });

    await logAudit({
      userId: session!.user.id,
      action: "create",
      resourceType: "patient",
      resourceId: patient.id,
      newValue: { uhid, name: validation.data.name },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to register patient" },
      { status: 500 }
    );
  }
}
