"use client";

import { usePlanProgress } from "@/hooks/usePlanProgress";
import { CheckCircle2, Circle } from "lucide-react";

/**
 * Weekly completion progress bar for the Life OS hub.
 * Shows overall % + per-day breakdown.
 */
export function WeekProgress() {
  const { stats, loading } = usePlanProgress();

  if (loading || !stats || stats.total === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Weekly Progress
        </h3>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {stats.percent}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${stats.percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-stone-500">
        {stats.completed} of {stats.total} tasks completed this week
      </p>
    </div>
  );
}

/**
 * Inline task checkbox for schedule blocks.
 * Used in the weekly schedule day view.
 */
export function TaskCheckbox({
  day,
  taskIndex,
  checked,
  onToggle,
}: {
  day: string;
  taskIndex: number;
  checked: boolean;
  onToggle: (day: string, taskIndex: number, completed: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(day, taskIndex, !checked);
      }}
      className="shrink-0 p-0.5"
    >
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <Circle className="h-4 w-4 text-stone-400 dark:text-stone-600" />
      )}
    </button>
  );
}
