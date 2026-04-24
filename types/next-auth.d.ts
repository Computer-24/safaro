import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role: string;
    companyId: string;
    approverId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      companyId: string;
      approverId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    companyId: string;
    approverId?: string | null;
  }
}
