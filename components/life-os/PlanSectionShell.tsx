"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Wand2, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useEnergy } from "@/hooks/useEnergy";
import type { WeeklyPlanData } from "@/lib/life-os/types";
import * as React from "react";

interface PlanSectionShellProps {
  title: string;
  icon: React.ReactNode;
  /** Returns null when the section has no data in the plan */
  children: (plan: WeeklyPlanData) => React.ReactNode | null;
}

function formatCooldown(nextAvailable: string): string {
  const diff = new Date(nextAvailable).getTime() - Date.now();
  if (diff <= 0) return "now";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const min = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${min}m`;
}

export function PlanSectionShell({ title, icon, children }: PlanSectionShellProps) {
  const { plan, loading, error: planError, refetch } = useWeeklyPlan();
  const { energy, planCooldown } = useEnergy();
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/life-os/generate", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        throw new Error(j.error ?? "Generation failed.");
      }
      refetch();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const weekRange = React.useMemo(() => {
    if (!plan) return "";
    const start = new Date(plan.weekStart);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} - ${fmt(end)}`;
  }, [plan]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
        <p className="text-sm text-stone-500">Loading your plan...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 px-4 py-4 md:px-8">
        <Link
          href="/home"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Home
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {icon}
              {title}
            </h1>
            {weekRange && (
              <p className="mt-0.5 text-xs text-stone-500">{weekRange}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Energy indicator */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              {energy}%
            </div>
            {/* Generate button */}
            {!planCooldown.canGenerate && planCooldown.nextAvailableAt ? (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Lock className="h-3 w-3" />
                Next plan in {formatCooldown(planCooldown.nextAvailableAt)}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={generating || energy < 50}
                className="rounded-xl text-xs"
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">
                  {generating ? "Generating..." : "Generate plan (-50%)"}
                </span>
              </Button>
            )}
          </div>
        </div>
        {genError && (
          <p className="mt-2 text-xs text-rose-500">{genError}</p>
        )}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {planError && (
          <p className="mb-4 text-sm text-rose-500">{planError}</p>
        )}
        {!plan ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-800 dark:bg-stone-900/40 text-center">
            <h3 className="font-medium mb-2">No plan generated yet</h3>
            <p className="text-sm text-stone-500 mb-4 max-w-md mx-auto">
              Fill in your Life OS profile, then generate your first plan. It costs 50% energy and can be done once every 7 days.
            </p>
          </div>
        ) : (
          children(plan) ?? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-800 dark:bg-stone-900/40 text-center">
              <p className="text-sm text-stone-500">
                This section is empty for the current week. Generate a new plan to populate it.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
