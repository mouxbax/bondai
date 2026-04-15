"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SocialGoal } from "@prisma/client";

export function GoalsPreview({ goals }: { goals: SocialGoal[] }) {
  const top = goals.slice(0, 3);
  return (
    <Card className="border-stone-100 shadow-sm dark:border-stone-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Social goals</CardTitle>
        <Link href="/goals" className="text-sm font-medium text-[#1D9E75] hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No goals yet - add one from the Goals tab.</p>
        ) : (
          top.map((g) => (
            <div key={g.id} className="flex items-start justify-between gap-2 rounded-xl bg-stone-50/80 p-3 dark:bg-stone-800/60">
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-50">{g.title}</p>
                <p className="line-clamp-2 text-xs text-stone-500 dark:text-stone-400">{g.description}</p>
              </div>
              <Badge variant={g.status === "COMPLETED" ? "amber" : "secondary"}>{g.status.toLowerCase()}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
