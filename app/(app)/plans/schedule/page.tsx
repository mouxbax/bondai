"use client";

import { CalendarDays } from "lucide-react";
import { PlanSectionShell } from "@/components/life-os/PlanSectionShell";
import { WeeklyPlanView } from "@/components/life-os/WeeklyPlanView";

export default function SchedulePage() {
  return (
    <PlanSectionShell
      title="Weekly Schedule"
      icon={<CalendarDays className="h-5 w-5 text-emerald-500" />}
    >
      {(plan) => <WeeklyPlanView plan={plan} />}
    </PlanSectionShell>
  );
}
