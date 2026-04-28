"use client";

import { Dumbbell } from "lucide-react";
import { PlanSectionShell } from "@/components/life-os/PlanSectionShell";
import { Badge } from "@/components/ui/badge";
import { DAY_KEYS } from "@/lib/life-os/types";

const DAY_LABEL: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function WorkoutPage() {
  return (
    <PlanSectionShell
      title="Workout Plan"
      icon={<Dumbbell className="h-5 w-5 text-rose-500" />}
    >
      {(plan) => {
        if (!plan.workouts || plan.workouts.length === 0) return null;

        const sorted = DAY_KEYS.flatMap((dk) =>
          plan.workouts!.filter((w) => w.day === dk)
        );

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((w, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-200 dark:border-stone-800 p-5"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {DAY_LABEL[w.day]}
                    </Badge>
                    <span className="font-semibold text-sm">{w.name}</span>
                  </div>
                  {w.durationMin && (
                    <span className="text-xs text-stone-500">{w.durationMin} min</span>
                  )}
                </div>
                <div className="text-xs text-stone-500 mb-3">{w.focus}</div>
                {w.lifts.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {w.lifts.map((l, j) => (
                      <li key={j} className="font-mono text-xs flex gap-2">
                        <span className="text-rose-500">*</span>
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
                {w.cardio && (
                  <div className="mt-3 text-xs text-stone-500 border-t border-stone-200 dark:border-stone-800 pt-2">
                    <span className="font-medium">Cardio:</span> {w.cardio}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }}
    </PlanSectionShell>
  );
}
