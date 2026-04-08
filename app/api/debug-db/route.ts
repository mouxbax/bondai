import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Temporary diagnostic endpoint — tests the exact Prisma operations
// that PrismaAdapter performs during Google OAuth sign-in.
// DELETE THIS FILE after debugging.
export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test basic connection
  try {
    const count = await prisma.user.count();
    results.connection = { ok: true, userCount: count };
  } catch (e: unknown) {
    const err = e as Error;
    results.connection = { ok: false, error: err.message, stack: err.stack };
  }

  // 2. Test user creation (what PrismaAdapter.createUser does)
  const testEmail = `debug-test-${Date.now()}@bondai-test.dev`;
  try {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Debug Test",
        emailVerified: new Date(),
        image: "https://example.com/photo.jpg",
      },
    });
    results.createUser = { ok: true, userId: user.id };

    // 3. Test account linkage (what PrismaAdapter.linkAccount does)
    try {
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: `debug-test-${Date.now()}`,
          access_token: "test-token",
          token_type: "bearer",
          scope: "openid email profile",
          id_token: "test-id-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      });
      results.linkAccount = { ok: true, accountId: account.id };
    } catch (e: unknown) {
      const err = e as Error;
      results.linkAccount = { ok: false, error: err.message, stack: err.stack };
    }

    // 4. Test session creation (what PrismaAdapter.createSession does)
    try {
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: `debug-session-${Date.now()}`,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      results.createSession = { ok: true, sessionId: session.id };

      // Cleanup session
      await prisma.session.delete({ where: { id: session.id } });
    } catch (e: unknown) {
      const err = e as Error;
      results.createSession = { ok: false, error: err.message, stack: err.stack };
    }

    // 5. Test getUserByAccount (what PrismaAdapter does on subsequent sign-ins)
    try {
      const found = await prisma.user.findFirst({
        where: {
          accounts: {
            some: {
              provider: "google",
              providerAccountId: (results.linkAccount as { ok: boolean; accountId?: string }).accountId ?? "",
            },
          },
        },
      });
      results.getUserByAccount = { ok: true, found: !!found };
    } catch (e: unknown) {
      const err = e as Error;
      results.getUserByAccount = { ok: false, error: err.message, stack: err.stack };
    }

    // Cleanup
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    results.cleanup = { ok: true };
  } catch (e: unknown) {
    const err = e as Error;
    results.createUser = { ok: false, error: err.message, stack: err.stack };
  }

  return NextResponse.json(results, { status: 200 });
}
