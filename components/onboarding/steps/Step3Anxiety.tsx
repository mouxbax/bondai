"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const LABELS = ["Very anxious", "", "", "", "Pretty confident"];

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
      <p className="text-lg text-stone-700 dark:text-stone-200">How comfortable are you in social situations?</p>
      <div className="space-y-3">
        <Slider value={[level]} min={1} max={5} step={1} onValueChange={(v) => setLevel(v[0] ?? 3)} />
        <div className="flex justify-between text-xs text-stone-500">
          <span>{LABELS[0]}</span>
          <span>{LABELS[4]}</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="anx">Optional: tell me a bit about that</Label>
        <Textarea id="anx" value={note} onChange={(e) => setNote(e.target.value)} placeholder="No pressure — a sentence is enough." />
      </div>
    </div>
  );
}
