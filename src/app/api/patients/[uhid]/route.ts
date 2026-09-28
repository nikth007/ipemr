import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uhid: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { uhid } = await params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { uhid },
      include: {
        encounters: {
          orderBy: { admissionDate: "desc" },
          include: {
            bed: {
              select: {
                id: true,
                bedNumber: true,
                ward: { select: { id: true, name: true, wardType: true } },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const activeEncounter = patient.encounters.find(
      (e) => e.status === "admitted"
    );

    let activeEncounterWithDetails = null;
    if (activeEncounter) {
      const attendingDoctor = await prisma.user.findUnique({
        where: { id: activeEncounter.attendingDoctorId },
        select: { id: true, name: true, designation: true },
      });
      activeEncounterWithDetails = {
        ...activeEncounter,
        attendingDoctor,
      };
    }

    return NextResponse.json({
      ...patient,
      activeEncounter: activeEncounterWithDetails,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}
