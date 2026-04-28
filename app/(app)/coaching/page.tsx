"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { ScenarioCard } from "@/components/coaching/ScenarioCard";
import { COACHING_SCENARIOS } from "@/lib/coaching-scenarios";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function CoachingPage() {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const start = async (scenarioId: string) => {
    setBusyId(scenarioId);

    // Consume 10% energy for practice
    const energyRes = await fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "practice" }),
    });
    if (!energyRes.ok) {
      const data = await energyRes.json();
      if (data.error?.includes("Not enough energy")) {
        alert(`Not enough energy for practice. You need 10% but have ${data.current}%. Try breathing to recharge.`);
        setBusyId(null);
        return;
      }
    }

    const scenario = COACHING_SCENARIOS.find((s) => s.id === scenarioId);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SOCIAL_COACHING",
        scenarioId,
        title: scenario?.title ?? "Practice session",
      }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const data = (await res.json()) as { conversationId: string };
    router.push(`/chat/${data.conversationId}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Practice" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-6 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-sm text-stone-600 dark:text-stone-300"
        >
          Pick a scenario. AIAH plays the other person while you rehearse. Coaching notes guide you along the way.
        </motion.p>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2"
        >
          {COACHING_SCENARIOS.map((s) => (
            <motion.div key={s.id} variants={fadeUp}>
              <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                <ScenarioCard
                  scenario={s}
                  onStart={() => void start(s.id)}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        {busyId ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-xs text-stone-500"
          >
            Starting…
          </motion.p>
        ) : null}
      </main>
    </div>
  );
}
