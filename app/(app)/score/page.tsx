"use client";

import { Header } from "@/components/layout/Header";
import { ConnectionScoreRing } from "@/components/dashboard/ConnectionScoreRing";
import { ScoreTimeline } from "@/components/score/ScoreTimeline";
import { EventFeed } from "@/components/score/EventFeed";
import { useConnectionScore } from "@/hooks/useConnectionScore";
import { Badge } from "@/components/ui/badge";

const BADGE_LABELS: Record<string, string> = {
  FIRST_STEP: "First Step",
  OPENING_UP: "Opening Up",
  WEEK_WARRIOR: "Week Warrior",
  BRAVE: "Brave",
  OUT_THERE: "Out There",
  GOAL_GETTER: "Goal Getter",
  SOCIAL_BUTTERFLY: "Social Butterfly",
};

export default function ScorePage() {
  const { data, loading, error } = useConnectionScore();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Connection score" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 md:px-8">
        {loading ? <p className="text-sm text-stone-500">Loading…</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {data ? (
          <>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-10">
              <ConnectionScoreRing score={data.score} size={140} />
              <div className="flex-1 space-y-2">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {data.badges.length === 0 ? (
                    <p className="text-sm text-stone-500">Keep going — badges unlock as you connect.</p>
                  ) : (
                    data.badges.map((b) => (
                      <Badge key={b} variant="amber">
                        {BADGE_LABELS[b] ?? b}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Streak: <span className="font-semibold">{data.streak.current}</span> days (best{" "}
                  {data.streak.longest})
                </p>
              </div>
            </div>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">History</h2>
              <ScoreTimeline data={data.history ?? []} />
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Recent events</h2>
              <EventFeed events={data.events} />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
