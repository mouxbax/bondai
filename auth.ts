import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

// Simple password hashing (Node.js built-in, no bcrypt dependency needed)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === verify;
}

export { hashPassword, verifyPassword };

const providers = [];

// Google OAuth (when configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Magic-link email (when configured)
if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

// Email + Password sign-in (always available)
providers.push(
  Credentials({
    id: "email-password",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !email.includes("@") || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;

      // Check password stored in Account table
      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: "email-password" },
      });
      if (!account?.access_token) return null;
      if (!verifyPassword(password, account.access_token)) return null;

      return user;
    },
  })
);

// Credentials provider requires JWT; mixed providers also use JWT for simplicity
export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
      }
      return session;
    },
  },
  trustHost: true,
});
