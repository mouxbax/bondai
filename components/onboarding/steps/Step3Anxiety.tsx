"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const AREAS = [
  "Schedule & time",
  "Finances & budget",
  "Fitness & health",
  "Habits & discipline",
  "Focus & productivity",
  "Social & networking",
];

export function Step3Anxiety({
  level,
  setLevel,
  note,
  setNote,
}: {
  level: number;
  setLevel: (n: number) => void;
  note: string;
  setNote: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-lg text-stone-700 dark:text-stone-200">Where do you want the most improvement?</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">Pick the area you want AIAH to focus on first.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {AREAS.map((area, i) => {
          const on = level === i + 1;
          return (
            <button
              key={area}
              type="button"
              onClick={() => setLevel(i + 1)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                on
                  ? "border-[#1D9E75] bg-[#1D9E75]/10 text-[#0f6b4f] dark:text-emerald-100"
                  : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
              )}
            >
              {area}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <Label htmlFor="anx">Optional: tell me more about your situation</Label>
        <Textarea id="anx" value={note} onChange={(e) => setNote(e.target.value)} placeholder="A sentence is enough." />
      </div>
    </div>
  );
}
