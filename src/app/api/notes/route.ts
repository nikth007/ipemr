import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/rbac";
import { z } from "zod";
import { logAudit } from "@/lib/utils/audit";

const noteSchema = z.object({
  encounterId: z.string().min(1),
  noteType: z.enum(["admission", "progress", "consultation", "procedure", "nursing"]),
  content: z.record(z.string(), z.any()),
});

export async function GET(request: NextRequest) {
  const { error } = await requirePermission("clinical_notes", "read");
  if (error) return error;

  const encounterId = request.nextUrl.searchParams.get("encounterId");
  const noteType = request.nextUrl.searchParams.get("noteType");

  if (!encounterId) {
    return NextResponse.json({ error: "encounterId required" }, { status: 400 });
  }

  const where: Record<string, unknown> = { encounterId };
  if (noteType) where.noteType = noteType;

  const notes = await prisma.clinicalNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, designation: true } },
    },
  });

  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission("clinical_notes", "create");
  if (error) return error;

  const body = await request.json();
  const validation = noteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid note data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { encounterId, noteType, content } = validation.data;
  const note = await prisma.clinicalNote.create({
    data: {
      encounterId,
      noteType,
      content: content as Record<string, string>,
      authorId: session!.user.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "create",
    resourceType: "clinical_note",
    resourceId: note.id,
    newValue: { noteType: validation.data.noteType },
  });

  return NextResponse.json(note, { status: 201 });
}
