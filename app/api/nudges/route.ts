import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateNudges } from "@/lib/nudges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nudges = await generateNudges(session.user.id);
  return NextResponse.json({ nudges });
}
