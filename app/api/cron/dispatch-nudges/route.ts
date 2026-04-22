import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser, isPushConfigured } from "@/lib/push/server";
import { writeNudge, type NudgeSlot } from "@/lib/ai/push-copywriter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hourly cron: fires personalized nudges to users whose LOCAL hour
 * matches a configured slot, respecting quiet hours, per-slot prefs,
 * and their subscription tier.
 *
 * Tier gating (profit-optimized — upsell path):
 *   free      → evening only
 *   plus      → morning + evening
 *   care_plus → morning + midday + afternoon + evening + night
 *
 * Schedule: every hour (Vercel cron: `0 * * * *`).
 */

const SLOT_HOURS: Record<NudgeSlot, number> = {
  morning: 8,
  midday: 13,
  afternoon: 16,
  evening: 20,
  night: 22,
};

// Which slots each plan is allowed to receive.
const PLAN_SLOTS: Record<string, Set<NudgeSlot>> = {
  free: new Set<NudgeSlot>(["evening"]),
  plus: new Set<NudgeSlot>(["morning", "evening"]),
  care_plus: new Set<NudgeSlot>(["morning", "midday", "afternoon", "evening", "night"]),
};

interface PushPrefs {
  enabled?: boolean;
  morning?: boolean;
  midday?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  night?: boolean;
  quietStart?: number;
  quietEnd?: number;
}

function getLocalHour(timezone: string | null | undefined, now: Date): number {
  const tz = timezone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    const h = hourPart ? parseInt(hourPart.value, 10) : now.getUTCHours();
    // Intl sometimes returns 24 for midnight
    return h === 24 ? 0 : h;
  } catch {
    return now.getUTCHours();
  }
}

function isQuietHour(hour: number, quietStart?: number, quietEnd?: number): boolean {
  if (typeof quietStart !== "number" || typeof quietEnd !== "number") return false;
  if (quietStart === quietEnd) return false;
  // Quiet window can wrap midnight (e.g. 22 → 7).
  if (quietStart < quietEnd) return hour >= quietStart && hour < quietEnd;
  return hour >= quietStart || hour < quietEnd;
}

function slotForHour(hour: number): NudgeSlot | null {
  for (const [slot, h] of Object.entries(SLOT_HOURS) as [NudgeSlot, number][]) {
    if (h === hour) return slot;
  }
  return null;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ ok: false, reason: "push_not_configured" });
  }

  const now = new Date();

  // Only users who have at least one push subscription AND push enabled.
  const candidates = await prisma.user.findMany({
    where: {
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      name: true,
      timezone: true,
      city: true,
      memorySnippet: true,
      pushPrefs: true,
      subscriptionPlan: true,
      streak: { select: { currentStreak: true } },
      socialGoals: {
        where: { status: "ACTIVE" },
        select: { title: true },
        take: 3,
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const u of candidates) {
    try {
      const prefs = (u.pushPrefs ?? {}) as PushPrefs;
      if (prefs.enabled === false) {
        skipped++;
        continue;
      }

      const localHour = getLocalHour(u.timezone, now);
      const slot = slotForHour(localHour);
      if (!slot) {
        skipped++;
        continue;
      }

      // Per-slot toggle (default on).
      if (prefs[slot] === false) {
        skipped++;
        continue;
      }

      // Quiet hours override everything except the evening wind-down slot? Just respect them.
      if (isQuietHour(localHour, prefs.quietStart, prefs.quietEnd)) {
        skipped++;
        continue;
      }

      // Tier gate.
      const plan = u.subscriptionPlan || "free";
      const allowed = PLAN_SLOTS[plan] ?? PLAN_SLOTS.free;
      if (!allowed.has(slot)) {
        skipped++;
        continue;
      }

      // Pull last couple of user lines for specificity.
      const recentMsgs = await prisma.message.findMany({
        where: {
          role: "USER",
          conversation: { userId: u.id },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { content: true, emotionTag: true },
      });
      const recentLines = recentMsgs.map((m) => m.content).reverse();
      const recentMood = recentMsgs.find((m) => m.emotionTag)?.emotionTag ?? null;

      const copy = await writeNudge({
        userName: u.name,
        localHour,
        slot,
        memorySnippet: u.memorySnippet,
        recentMood,
        activeGoals: u.socialGoals.map((g) => g.title),
        streakDays: u.streak?.currentStreak ?? 0,
        city: u.city,
        recentLines,
      });

      const result = await sendPushToUser(u.id, {
        title: copy.title,
        body: copy.body,
        url: "/home",
        tag: `nudge-${slot}`,
      });

      if (result.sent > 0) sent++;
      else skipped++;
    } catch (e) {
      errors.push(`${u.id}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    candidates: candidates.length,
    sent,
    skipped,
    errors: errors.slice(0, 10),
  });
}
