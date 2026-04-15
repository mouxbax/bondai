import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, hashPassword, verifyPassword } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/password - change the signed-in user's password.
 * Body: { currentPassword: string, newPassword: string }
 *
 * Only works for accounts that were created with the email-password provider.
 * Google / magic-link users will get a clear error.
 */

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "email-password" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      {
        error:
          "This account signs in without a password (Google or magic link). Nothing to change here.",
      },
      { status: 400 },
    );
  }

  if (!verifyPassword(parsed.data.currentPassword, account.access_token)) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const newHash = hashPassword(parsed.data.newPassword);
  await prisma.account.update({
    where: { id: account.id },
    data: { access_token: newHash },
  });

  return NextResponse.json({ ok: true });
}
