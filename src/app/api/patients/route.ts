import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";
import { patientSearchSchema } from "@/lib/validators/patient";

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "name";

  const validation = patientSearchSchema.safeParse({ query, type });
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid search parameters" },
      { status: 400 }
    );
  }

  const { query: q, type: searchType } = validation.data;

  let where = {};
  if (searchType === "uhid") {
    where = { uhid: { contains: q } };
  } else if (searchType === "phone") {
    where = { phone: { contains: q } };
  } else {
    where = {
      OR: [
        { name: { contains: q } },
        { uhid: { contains: q } },
        { phone: { contains: q } },
      ],
    };
  }

  const patients = await prisma.patient.findMany({
    where,
    take: 20,
    orderBy: { name: "asc" },
    select: {
      id: true,
      uhid: true,
      name: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      bloodGroup: true,
      encounters: {
        where: { status: "admitted" },
        take: 1,
        select: {
          id: true,
          visNo: true,
          status: true,
          bed: { select: { bedNumber: true, ward: { select: { name: true } } } },
        },
      },
    },
  });

  return NextResponse.json(patients);
}
