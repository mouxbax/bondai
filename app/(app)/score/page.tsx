"use client";

import { motion } from "framer-motion";
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export default function ScorePage() {
  const { data, loading, error } = useConnectionScore();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Connection score" />
      <motion.main
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 md:px-8"
      >
        {loading ? (
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-sm text-stone-500"
          >
            Loading…
          </motion.p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {data ? (
          <>
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-10">
              <ConnectionScoreRing score={data.score} size={140} />
              <div className="flex-1 space-y-2">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {data.badges.length === 0 ? (
                    <p className="text-sm text-stone-500">Keep going — badges unlock as you connect.</p>
                  ) : (
                    data.badges.map((b, i) => (
                      <motion.div
                        key={b}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
                      >
                        <Badge variant="amber">
                          {BADGE_LABELS[b] ?? b}
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Streak: <span className="font-semibold">{data.streak.current}</span> days (best{" "}
                  {data.streak.longest})
                </p>
              </div>
            </motion.div>
            <motion.section variants={fadeUp} className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">History</h2>
              <ScoreTimeline data={data.history ?? []} />
            </motion.section>
            <motion.section variants={fadeUp} className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Recent events</h2>
              <EventFeed events={data.events} />
            </motion.section>
          </>
        ) : null}
      </motion.main>
    </div>
  );
}
