import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

const assessmentSchema = z.object({
  assessmentType: z.string().min(1),
  data: z.record(z.string(), z.any()),
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

    const assessments = await prisma.nursingAssessment.findMany({
      where: { encounterId: id },
      orderBy: { assessedAt: "desc" },
    });

    return NextResponse.json(assessments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
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
  const validation = assessmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid assessment data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const assessment = await prisma.nursingAssessment.create({
      data: {
        encounterId: id,
        assessmentType: validation.data.assessmentType,
        data: validation.data.data as Record<string, string>,
        assessedBy: session!.user.id,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
