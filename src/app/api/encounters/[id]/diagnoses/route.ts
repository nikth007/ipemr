import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

const diagnosisSchema = z.object({
  icdCode: z.string().optional(),
  description: z.string().min(1),
  type: z.enum(["primary", "secondary", "comorbidity"]),
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

    const diagnoses = await prisma.diagnosis.findMany({
      where: { encounterId: id },
      orderBy: [
        { type: "asc" },
        { diagnosedAt: "asc" },
      ],
    });

    return NextResponse.json(diagnoses);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch diagnoses" },
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
  const validation = diagnosisSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid diagnosis data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const diagnosis = await prisma.diagnosis.create({
      data: {
        encounterId: id,
        icdCode: validation.data.icdCode,
        description: validation.data.description,
        type: validation.data.type,
        diagnosedBy: session!.user.id,
      },
    });

    return NextResponse.json(diagnosis, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create diagnosis" },
      { status: 500 }
    );
  }
}
