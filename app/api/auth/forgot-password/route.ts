import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Always respond OK — we don't want to leak whether the email exists.
    const genericOk = { ok: true, message: "If an account with that email exists, we've sent a reset link." };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(genericOk);
    }

    // Only send resets for email-password accounts. Google users should sign in with Google.
    const hasPasswordAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: "email-password" },
    });
    if (!hasPasswordAccount) {
      return NextResponse.json(genericOk);
    }

    // Invalidate any previous unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate a fresh token (good for 60 minutes)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        email,
        expires,
      },
    });

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const resetUrl = `${origin.replace(/\/$/, "")}/reset-password?token=${token}`;

    const { subject, html, text } = passwordResetEmail(resetUrl, user.name);
    const result = await sendEmail({ to: email, subject, html, text });

    if (!result.ok) {
      // Log but still return generic OK to the client.
      console.error("[forgot-password] email send failed:", result.error);
    }

    return NextResponse.json(genericOk);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
