"use client";

import { Send, Lightbulb } from "lucide-react";
import { PlanSectionShell } from "@/components/life-os/PlanSectionShell";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 text-center">
      <div className="text-2xl font-bold text-stone-800 dark:text-stone-200">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-stone-500 mt-1">{label}</div>
    </div>
  );
}

export default function OutreachPage() {
  return (
    <PlanSectionShell
      title="Outreach & Income"
      icon={<Send className="h-5 w-5 text-blue-500" />}
    >
      {(plan) => {
        if (!plan.outreach) return null;
        const o = plan.outreach;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Stat label="DMs" value={o.dms ?? "—"} />
              <Stat label="Posts" value={o.posts ?? "—"} />
              <Stat label="Follow-ups" value={o.followUps ?? "—"} />
            </div>
            {o.focus && (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">Weekly focus</div>
                <p className="text-sm">{o.focus}</p>
              </div>
            )}
            {o.contentIdeas && o.contentIdeas.length > 0 && (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                <div className="text-xs uppercase tracking-wide text-stone-500 mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Content ideas
                </div>
                <ul className="space-y-2 text-sm">
                  {o.contentIdeas.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500 shrink-0">{i + 1}.</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }}
    </PlanSectionShell>
  );
}
