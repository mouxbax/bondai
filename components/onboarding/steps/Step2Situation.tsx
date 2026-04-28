"use client";

import { cn } from "@/lib/utils";

const OPTIONS = [
  "I want to optimize my schedule",
  "I need help managing my money",
  "I want to build better habits",
  "I'm chasing a big goal",
  "I want a complete life system",
  "Going through a life change",
];

export function Step2Situation({
  selected,
  toggle,
}: {
  selected: string[];
  toggle: (label: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg text-stone-700 dark:text-stone-200">What brought you here?</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">Pick all that feel true.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                on
                  ? "border-[#1D9E75] bg-[#1D9E75]/10 text-[#0f6b4f] dark:text-emerald-100"
                  : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
