import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: string;
    companyId: string;
    approverId?: string | null;
  }

  interface Session {
    error?: string; 
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
    id: string;
    role: string;
    companyId: string;
    approverId?: string | null;
    error?: string; 
  }
}
