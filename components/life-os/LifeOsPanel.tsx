"use client";

import * as React from "react";
import { Wand2, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifeOsForm } from "@/components/life-os/LifeOsForm";
import type { LifeOsData, WeeklyPlanData } from "@/lib/life-os/types";

/**
 * Profile editor + a small "Generate week" action.
 * The full generated week is rendered in the separate "This week" tab.
 */
export function LifeOsPanel({
  onGenerated,
  onSwitchToWeek,
}: {
  onGenerated?: (plan: WeeklyPlanData) => void;
  onSwitchToWeek?: () => void;
}) {
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<LifeOsData | null>(null);
  const [hasPlan, setHasPlan] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/life-os", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as {
        profile: LifeOsData;
        latestPlan: { data: WeeklyPlanData } | null;
      };
      setProfile(j.profile ?? {});
      setHasPlan(!!j.latestPlan);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/life-os/generate", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        plan?: WeeklyPlanData;
        error?: string;
      };
      if (!res.ok || !j.plan) {
        throw new Error(j.error ?? "Generation failed. Try again in a minute.");
      }
      setHasPlan(true);
      onGenerated?.(j.plan);
      onSwitchToWeek?.();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading your Life OS…</p>;
  }

  const hasProfile = profile && Object.keys(profile).length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">Your weekly plan</h3>
            <p className="text-sm text-stone-500 mt-1">
              Fill in your Life OS below (once — 10 minutes). Then generate a week — AIAH builds a
              day-by-day schedule, workouts, grocery list, finances, and outreach plan tailored to
              your goals. A new week is auto-generated every Sunday evening.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Button
              onClick={() => void generate()}
              disabled={generating || !hasProfile}
              className="rounded-xl"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasPlan ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span className="ml-2">{hasPlan ? "Regenerate week" : "Generate week"}</span>
            </Button>
            {hasPlan && onSwitchToWeek && (
              <button
                type="button"
                onClick={onSwitchToWeek}
                className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
              >
                View this week <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {genError && (
          <p className="mt-3 text-sm text-rose-600 rounded-md bg-rose-50 dark:bg-rose-950/30 p-2">
            {genError}
          </p>
        )}
        {!hasProfile && (
          <p className="mt-2 text-xs text-stone-500">
            Save your profile once before generating — the more detail you give, the sharper the week.
          </p>
        )}
      </div>

      <section>
        <h3 className="font-medium mb-3">Life OS profile</h3>
        <LifeOsForm initial={profile ?? {}} onSaved={(d) => setProfile(d)} />
      </section>
    </div>
  );
}
