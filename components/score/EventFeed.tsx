"use client";

import { formatRelativeTime } from "@/lib/utils";
import type { ConnectionEventType } from "@prisma/client";

const label: Record<ConnectionEventType, string> = {
  ONBOARDING_COMPLETE: "Onboarding",
  DAILY_CHECKIN: "Check-in",
  GOAL_COMPLETED: "Goal done",
  REAL_WORLD_INTERACTION: "Real-world win",
  COACHING_COMPLETED: "Coaching",
  STREAK_MILESTONE: "Streak",
  STREAK_7_BONUS: "Week bonus",
  CHECKIN_STREAK: "Streak",
  BADGE_UNLOCKED: "Badge",
  SCORE_ADJUSTMENT: "Adjustment",
};

export function EventFeed({
  events,
}: {
  events: Array<{
    id: string;
    type: ConnectionEventType;
    note: string | null;
    pointsAwarded: number;
    createdAt: string;
  }>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-stone-500 dark:text-stone-400">No events yet — your wins will show up here.</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-50">{label[e.type]}</p>
            {e.note ? <p className="text-xs text-stone-500 dark:text-stone-400">{e.note}</p> : null}
            <p className="text-[10px] text-stone-400">{formatRelativeTime(new Date(e.createdAt))}</p>
          </div>
          {e.pointsAwarded !== 0 ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              +{e.pointsAwarded}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
