import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * DEV-ONLY: Creates a demo user and session directly.
 * Visit /api/dev-login in browser to auto-login.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    // Test database connection first
    await prisma.$connect();

    // Create or find demo user
    let user = await prisma.user.findUnique({ where: { email: "demo@aiah.app" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@aiah.app",
          name: "Moustafa",
          connectionScore: 10,
          onboardingComplete: false,
        },
      });
    }

    // Create a session that expires in 30 days
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sessionToken = crypto.randomUUID();

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Set the session cookie and redirect
    const response = NextResponse.redirect(new URL("/home", process.env.NEXTAUTH_URL || "https://bondai-amber.vercel.app"));

    // NextAuth v5 uses __Secure- prefix in production, plain in dev
    response.cookies.set("authjs.session-token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires,
    });

    // Also set the next-auth variant
    response.cookies.set("next-auth.session-token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires,
    });

    return response;
  } catch (error) {
    // Show the actual error so we can debug
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: message,
        hint: "Check your DATABASE_URL in .env.local"
      },
      { status: 500 }
    );
  }
}
