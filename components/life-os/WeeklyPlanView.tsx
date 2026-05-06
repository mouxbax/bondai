"use client";

import * as React from "react";
import { Sparkles, AlertTriangle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
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

function getTodayKey(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

/**
 * @param compact — when true, skips the hero header card (used inside WeekCommandCenter
 *   which already renders its own hero). Only shows expand/collapse bar + day cards.
 */
export function WeeklyPlanView({ plan, compact }: { plan: WeeklyPlanData; compact?: boolean }) {
  const todayKey = getTodayKey();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set([todayKey]));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(DAY_KEYS));
  const collapseAll = () => setExpanded(new Set());

  const weekRange = React.useMemo(() => {
    const start = new Date(plan.weekStart);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [plan.weekStart]);

  return (
    <div className="space-y-3">
      {/* Full hero header — only on standalone page */}
      {!compact && (
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
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={expandAll}
                  className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Expand all
                </button>
                <span className="text-stone-300 dark:text-stone-600">|</span>
                <button
                  onClick={collapseAll}
                  className="text-[10px] font-medium text-stone-500 hover:underline"
                >
                  Collapse
                </button>
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
      )}

      {/* Compact expand/collapse bar — when inside command center */}
      {compact && (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={expandAll}
            className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Expand all
          </button>
          <span className="text-stone-300 dark:text-stone-600">|</span>
          <button
            onClick={collapseAll}
            className="text-[10px] font-medium text-stone-500 hover:underline"
          >
            Collapse
          </button>
        </div>
      )}

      {/* Day cards — collapsible */}
      <div className="grid grid-cols-1 gap-3">
        {DAY_KEYS.map((dk) => {
          const day = plan.days.find((d) => d.key === dk);
          const isOpen = expanded.has(dk);
          const isToday = dk === todayKey;
          const blockCount = day?.blocks.length ?? 0;

          return (
            <Card
              key={dk}
              className={`border-stone-100 dark:border-stone-800 overflow-hidden transition-colors ${
                isToday ? "ring-1 ring-emerald-500/30" : ""
              }`}
            >
              {/* Clickable header */}
              <button
                onClick={() => toggle(dk)}
                className="w-full text-left"
              >
                <CardHeader className="!flex-row !space-y-0 items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm leading-none">{DAY_LABEL[dk]}</CardTitle>
                    {isToday && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] border-0">
                        Today
                      </Badge>
                    )}
                    {day?.theme && !isOpen && (
                      <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                        {day.theme}
                      </span>
                    )}
                    {!isOpen && blockCount > 0 && (
                      <span className="text-[10px] text-stone-400">
                        {blockCount} blocks
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {day?.theme && isOpen && (
                      <Badge variant="secondary" className="text-[10px]">{day.theme}</Badge>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-stone-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
              </button>

              {/* Collapsible content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
