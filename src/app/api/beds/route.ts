import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const wardId = request.nextUrl.searchParams.get("wardId");

  const where = wardId ? { wardId } : {};

  const beds = await prisma.bed.findMany({
    where,
    include: {
      ward: { select: { name: true } },
      encounters: {
        where: { status: "admitted" },
        take: 1,
        include: {
          patient: { select: { uhid: true, name: true, gender: true } },
        },
      },
    },
    orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }],
  });

  const formatted = beds.map((bed) => {
    const activeEncounter = bed.encounters[0];
    return {
      id: bed.id,
      bedNumber: bed.bedNumber,
      wardName: bed.ward.name,
      wardId: bed.wardId,
      status: bed.status,
      bedType: bed.bedType,
      patient: activeEncounter
        ? {
            uhid: activeEncounter.patient.uhid,
            name: activeEncounter.patient.name,
            gender: activeEncounter.patient.gender,
          }
        : null,
    };
  });

  return NextResponse.json(formatted);
}
