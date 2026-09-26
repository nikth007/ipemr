import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function logAudit({
  userId,
  action,
  resourceType,
  resourceId,
  oldValue,
  newValue,
}: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0] ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? undefined;

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      ipAddress,
      userAgent,
    },
  });
}
