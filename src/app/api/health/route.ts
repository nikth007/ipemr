import { prisma, isDemoMode } from "@/lib/db";

export async function GET() {
  const checks: Record<string, unknown> = {
    mode: isDemoMode ? "demo" : "database",
    hasDbUrl: !!process.env.DATABASE_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
  };

  if (!isDemoMode) {
    try {
      const result = await prisma.$queryRaw<{ n: bigint }[]>`SELECT 1 as n`;
      checks.dbConnection = "ok";
      checks.dbResult = Number(result[0]?.n);
    } catch (err) {
      checks.dbConnection = "failed";
      checks.dbError = err instanceof Error ? err.message : String(err);
    }

    try {
      const count = await prisma.user.count();
      checks.userCount = count;
    } catch (err) {
      checks.userQuery = "failed";
      checks.userError = err instanceof Error ? err.message : String(err);
    }
  }

  const ok = checks.dbConnection === "ok" || isDemoMode;
  return Response.json({ status: ok ? "healthy" : "unhealthy", ...checks });
}
