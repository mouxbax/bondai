import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/db/prisma";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

if (providers.length === 0 && process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      id: "dev-email",
      name: "Dev sign-in",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@bondai.app" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim() : "";
        if (!email || !email.includes("@")) return null;
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0] ?? "Friend",
              connectionScore: 10,
            },
          });
        }
        return user;
      },
    })
  );
}

// Credentials provider requires JWT strategy; OAuth providers use database strategy
const hasOnlyCredentials = providers.length > 0 && providers.every((p) => (p as { type?: string }).type === "credentials");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: hasOnlyCredentials ? "jwt" : "database" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
      }
      return token;
    },
    session({ session, user, token }) {
      if (session.user) {
        if (user) {
          // Database strategy
          session.user.id = user.id;
          session.user.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
        } else if (token) {
          // JWT strategy (credentials)
          session.user.id = token.id as string;
          session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
        }
      }
      return session;
    },
  },
  trustHost: true,
});
