import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/auth";
import { sendEmail, passwordChangedEmail } from "@/lib/email";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token." }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) {
    return NextResponse.json({ valid: false, error: "This reset link is invalid." }, { status: 400 });
  }
  if (record.usedAt) {
    return NextResponse.json({ valid: false, error: "This reset link has already been used." }, { status: 400 });
  }
  if (record.expires < new Date()) {
    return NextResponse.json({ valid: false, error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  return NextResponse.json({ valid: true, email: record.email });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: string; password?: string };
    const token = (body.token ?? "").trim();
    const password = body.password ?? "";

    if (!token) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) {
      return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
    }
    if (record.usedAt) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
    }
    if (record.expires < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Find (or create) the user's email-password account and update its hashed password
    const account = await prisma.account.findFirst({
      where: { userId: record.userId, provider: "email-password" },
    });

    if (!account) {
      // Shouldn't happen because forgot-password only issues tokens for users with an email-password account.
      // But if it does, create one so they can sign in going forward.
      await prisma.account.create({
        data: {
          userId: record.userId,
          type: "credentials",
          provider: "email-password",
          providerAccountId: record.email,
          access_token: hashPassword(password),
        },
      });
    } else {
      await prisma.account.update({
        where: { id: account.id },
        data: { access_token: hashPassword(password) },
      });
    }

    // Burn the token
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Security notification — fire-and-forget.
    void (async () => {
      try {
        const u = await prisma.user.findUnique({
          where: { id: record.userId },
          select: { email: true, name: true },
        });
        if (u?.email) {
          const tpl = passwordChangedEmail(u.name);
          await sendEmail({ to: u.email, ...tpl });
        }
      } catch (e) {
        console.error("[reset-password] notify email failed:", e);
      }
    })();

    return NextResponse.json({ ok: true, email: record.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
