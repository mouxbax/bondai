"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ScenarioCard } from "@/components/coaching/ScenarioCard";
import { COACHING_SCENARIOS } from "@/lib/coaching-scenarios";

export default function CoachingPage() {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const start = async (scenarioId: string) => {
    setBusyId(scenarioId);
    const scenario = COACHING_SCENARIOS.find((s) => s.id === scenarioId);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SOCIAL_COACHING",
        scenarioId,
        title: scenario?.title ?? "Social coaching",
      }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const data = (await res.json()) as { conversationId: string };
    router.push(`/chat/${data.conversationId}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Social coaching" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-6 md:px-8">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Pick a scenario. BondAI plays the other person — you practice the messy, human parts with coaching notes along the way.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {COACHING_SCENARIOS.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onStart={() => void start(s.id)}
            />
          ))}
        </div>
        {busyId ? <p className="text-xs text-stone-500">Starting…</p> : null}
      </main>
    </div>
  );
}
