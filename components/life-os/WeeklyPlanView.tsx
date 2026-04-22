"use client";

import * as React from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeeklyPlanData, PlanBlock } from "@/lib/life-os/types";
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

const CAT_DOT: Record<PlanBlock["category"], string> = {
  work: "bg-blue-500",
  fitness: "bg-rose-500",
  fuel: "bg-amber-500",
  project: "bg-emerald-500",
  money: "bg-yellow-500",
  rest: "bg-indigo-400",
  personal: "bg-stone-400",
  admin: "bg-stone-500",
};

export function WeeklyPlanView({ plan }: { plan: WeeklyPlanData }) {
  const weekRange = React.useMemo(() => {
    const start = new Date(plan.weekStart);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [plan.weekStart]);

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200/60 dark:border-emerald-900/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {plan.weekTheme}
              </CardTitle>
              <p className="mt-1 text-xs text-stone-500">{weekRange}</p>
            </div>
          </div>
        </CardHeader>
        {(plan.topPriorities.length > 0 || (plan.warnings && plan.warnings.length > 0)) && (
          <CardContent className="pt-0">
            {plan.topPriorities.length > 0 && (
              <>
                <div className="text-xs uppercase tracking-wide text-stone-500 mb-2">
                  Top priorities
                </div>
                <ol className="space-y-1 text-sm list-decimal list-inside">
                  {plan.topPriorities.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </>
            )}
            {plan.warnings && plan.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {plan.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DAY_KEYS.map((dk) => {
          const day = plan.days.find((d) => d.key === dk);
          return (
            <Card key={dk} className="border-stone-100 dark:border-stone-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{DAY_LABEL[dk]}</CardTitle>
                  {day?.theme && (
                    <Badge variant="secondary" className="text-[10px]">{day.theme}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {!day || day.blocks.length === 0 ? (
                  <p className="text-xs text-stone-400">No blocks scheduled.</p>
                ) : (
                  <ul className="space-y-2">
                    {day.blocks.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${CAT_DOT[b.category]}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-xs text-stone-500 shrink-0">
                              {b.start}–{b.end}
                            </span>
                            {b.priority === 1 && (
                              <Badge variant="amber" className="text-[10px]">P1</Badge>
                            )}
                          </div>
                          <div className="text-stone-800 dark:text-stone-200">{b.label}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
