import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushToUser, isPushConfigured } from "@/lib/push/server";

/**
 * Dev/debug — signed-in users can fire a test push to their own devices.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY." },
      { status: 503 },
    );
  }

  const result = await sendPushToUser(session.user.id, {
    title: "AIAH",
    body: "Pings like this will land throughout your day. You can turn them off anytime.",
    url: "/home",
    tag: "aiah-test",
  });

  return NextResponse.json(result);
}
