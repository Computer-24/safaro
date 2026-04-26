import NextAuth, { type AuthOptions, type SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt" satisfies SessionStrategy,
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // ⭐ Do NOT throw — return special object
        if (!user.isActive) {
          return { id: "InactiveAccount" } as any;
        }

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          approverId: user.approverId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ⭐ Handle inactive account
      if (user?.id === "InactiveAccount") {
        token.error = "InactiveAccount";
        return token;
      }

      // Normal login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.approverId = user.approverId;
      }

      return token;
    },

    async session({ session, token }) {
      // ⭐ Expose error to frontend
      if (token.error) {
        session.error = token.error;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.approverId = token.approverId as string | null;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
