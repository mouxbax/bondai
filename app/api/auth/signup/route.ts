import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; email?: string; password?: string };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Check if they already have a password account
      const existingAccount = await prisma.account.findFirst({
        where: { userId: existing.id, provider: "email-password" },
      });
      if (existingAccount) {
        return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
      }
      // User exists (e.g., from Google OAuth) - add password-based account
      await prisma.account.create({
        data: {
          userId: existing.id,
          type: "credentials",
          provider: "email-password",
          providerAccountId: email,
          access_token: hashPassword(password), // store hashed password
        },
      });
      return NextResponse.json({ ok: true, message: "Password added to your existing account." });
    }

    // Create new user + credential account
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0] || "Friend",
        connectionScore: 10,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "email-password",
        providerAccountId: email,
        access_token: hashPassword(password),
      },
    });

    return NextResponse.json({ ok: true, message: "Account created. You can now sign in." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
