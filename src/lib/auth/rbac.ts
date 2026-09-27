import { auth } from "@/lib/auth";
import { prisma, isDemoMode } from "@/lib/db";
import { NextResponse } from "next/server";

export type Permission = {
  resource: string;
  action: "create" | "read" | "update" | "delete";
};

const permissionCache = new Map<string, Permission[]>();

const DEMO_PERMISSIONS: Permission[] = [
  { resource: "*", action: "*" as Permission["action"] },
];

export async function getPermissions(roleId: string): Promise<Permission[]> {
  if (isDemoMode) return DEMO_PERMISSIONS;

  const cached = permissionCache.get(roleId);
  if (cached) return cached;

  const perms = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { resource: true, action: true },
  });

  const permissions = perms.map((p) => ({
    resource: p.resource,
    action: p.action as Permission["action"],
  }));
  permissionCache.set(roleId, permissions);
  return permissions;
}

export function hasPermission(
  permissions: Permission[],
  resource: string,
  action: Permission["action"]
): boolean {
  return permissions.some(
    (p) =>
      (p.resource === resource || p.resource === "*") &&
      (p.action === action || p.action === ("*" as Permission["action"]))
  );
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requirePermission(resource: string, action: Permission["action"]) {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };

  const permissions = await getPermissions(session!.user.roleId);
  if (!hasPermission(permissions, resource, action)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session: session! };
}
