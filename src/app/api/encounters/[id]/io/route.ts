import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";

const ioSchema = z.object({
  type: z.enum(["intake", "output"]),
  category: z.string().min(1),
  volumeMl: z.number().positive(),
  route: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("vitals", "read");
  if (error) return error;

  const { id } = await params;

  try {
    const encounter = await prisma.encounter.findUnique({ where: { id } });
    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    const records = await prisma.intakeOutput.findMany({
      where: { encounterId: id },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(records);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch I/O records" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("vitals", "create");
  if (error) return error;

  const { id } = await params;

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const body = await request.json();
  const validation = ioSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid I/O data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const record = await prisma.intakeOutput.create({
      data: {
        encounterId: id,
        type: validation.data.type,
        category: validation.data.category,
        volumeMl: validation.data.volumeMl,
        route: validation.data.route,
        notes: validation.data.notes,
        recordedBy: session!.user.id,
        recordedAt: new Date(),
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create I/O record" },
      { status: 500 }
    );
  }
}
