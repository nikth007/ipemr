import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
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
