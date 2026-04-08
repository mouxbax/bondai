"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addConnectionEvent, hasBadge } from "@/lib/db/queries/score";
import { BADGE_KEYS } from "@/lib/score";

export async function logRealWorldInteraction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await addConnectionEvent({
    userId: session.user.id,
    type: "REAL_WORLD_INTERACTION",
    pointsAwarded: 3,
    note: "I did something!",
  });

  const has = await hasBadge(session.user.id, BADGE_KEYS.OUT_THERE);
  if (!has) {
    await addConnectionEvent({
      userId: session.user.id,
      type: "BADGE_UNLOCKED",
      pointsAwarded: 0,
      note: "Out There",
      badgeKey: BADGE_KEYS.OUT_THERE,
    });
  }

  revalidatePath("/home");
  revalidatePath("/score");
}
