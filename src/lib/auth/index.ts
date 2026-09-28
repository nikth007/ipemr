import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, isDemoMode } from "@/lib/db";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      employeeId: string;
      name: string;
      email?: string | null;
      roleId: string;
      roleName: string;
      departmentId?: string | null;
      departmentName?: string | null;
      designation?: string | null;
    };
  }

  interface User {
    employeeId: string;
    roleData: { id: string; name: string };
    departmentId?: string | null;
    departmentName?: string | null;
    designation?: string | null;
  }
}

const DEMO_USER = {
  id: "usr-priya",
  name: "Dr. Priya Sharma",
  email: "priya.sharma@smf.org.in",
  employeeId: "DOC001",
  roleData: { id: "role-physician", name: "physician" },
  departmentId: "dept-med",
  departmentName: "General Medicine",
  designation: "Consultant Physician",
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: isDemoMode ? undefined : PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || "demo-secret-change-in-production",
  session: {
    strategy: "jwt",
    maxAge: isDemoMode ? 24 * 60 * 60 : 15 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        employeeId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.password) return null;

        if (isDemoMode) {
          return DEMO_USER;
        }

        const user = await prisma.user.findUnique({
          where: { employeeId: credentials.employeeId as string },
          include: { role: true, department: true },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          roleData: { id: user.role.id, name: user.role.name },
          departmentId: user.departmentId,
          departmentName: user.department?.name ?? null,
          designation: user.designation,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.roleName = user.roleData.name;
        token.roleId = user.roleData.id;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.designation = user.designation;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.employeeId = token.employeeId as string;
      session.user.roleId = token.roleId as string;
      session.user.roleName = token.roleName as string;
      session.user.departmentId = token.departmentId as string | null;
      session.user.departmentName = token.departmentName as string | null;
      session.user.designation = token.designation as string | null;
      return session;
    },
  },
});
