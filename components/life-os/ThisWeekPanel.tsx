"use client";

import * as React from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekCommandCenter } from "@/components/life-os/WeekCommandCenter";
import type { WeeklyPlanData } from "@/lib/life-os/types";

export function ThisWeekPanel({
  plan,
  onPlanLoaded,
  onPlanChanged,
}: {
  plan: WeeklyPlanData | null;
  onPlanLoaded: (plan: WeeklyPlanData | null) => void;
  onPlanChanged: (plan: WeeklyPlanData) => void;
}) {
  const [loading, setLoading] = React.useState(plan === null);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (plan !== null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/life-os", { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as {
          latestPlan: { data: WeeklyPlanData } | null;
        };
        if (!cancelled) onPlanLoaded(j.latestPlan?.data ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan, onPlanLoaded]);

  const regenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/life-os/generate", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        plan?: WeeklyPlanData;
        error?: string;
      };
      if (!res.ok || !j.plan) {
        throw new Error(j.error ?? "Generation failed.");
      }
      onPlanChanged(j.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading your week…</p>;
  }

  if (!plan) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-800 dark:bg-stone-900/40 text-center">
        <h3 className="font-medium mb-2">No week generated yet</h3>
        <p className="text-sm text-stone-500 mb-4 max-w-md mx-auto">
          Head to the Life OS tab, fill in your profile, then come back and generate your first week.
          Or click below to generate now with what&apos;s already saved.
        </p>
        <Button onClick={() => void regenerate()} disabled={generating} className="rounded-xl">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          <span className="ml-2">Generate now</span>
        </Button>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-rose-600 rounded-md bg-rose-50 dark:bg-rose-950/30 p-2">
          {error}
        </p>
      )}
      <WeekCommandCenter
        plan={plan}
        onRegenerate={() => void regenerate()}
        regenerating={generating}
      />
    </div>
  );
}
