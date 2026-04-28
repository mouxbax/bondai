"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Save 500 this month",
  "Work out 4 times this week",
  "Launch my side project",
  "Build a solid morning routine",
];

export function Step4Goals({
  title,
  setTitle,
  description,
  setDescription,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg text-stone-700 dark:text-stone-200">What&apos;s one goal you want to crush first?</p>
      <div className="grid gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setTitle(s);
              setDescription("Starting small, building momentum.");
            }}
            className={cn(
              "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800",
              title === s && "border-[#1D9E75] bg-[#1D9E75]/5"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="gt">Your goal (custom OK)</Label>
        <Input id="gt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your goal in a few words" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gd">Why it matters</Label>
        <Textarea id="gd" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </div>
  );
}
