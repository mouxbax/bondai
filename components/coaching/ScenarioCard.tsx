"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CoachingScenarioMeta } from "@/types";

export function ScenarioCard({ scenario, onStart }: { scenario: CoachingScenarioMeta; onStart: () => void }) {
  return (
    <Card className="flex flex-col border-stone-100 shadow-sm dark:border-stone-800">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{scenario.title}</CardTitle>
          <div className="flex shrink-0 gap-0.5 text-amber-500">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-4 w-4", i < scenario.difficulty ? "fill-current" : "opacity-25")}
              />
            ))}
          </div>
        </div>
        <CardDescription>{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between">
        <p className="text-xs text-stone-500">~{scenario.minutes} min</p>
        <Button size="sm" className="rounded-xl" onClick={onStart}>
          Practice
        </Button>
      </CardContent>
    </Card>
  );
}
