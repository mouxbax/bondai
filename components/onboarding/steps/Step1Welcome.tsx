"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Step1Welcome({
  name,
  setName,
}: {
  name: string;
  setName: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-lg text-stone-700 dark:text-stone-200">
        Hey, I&apos;m <span className="font-semibold text-[#1D9E75]">BondAI</span>. What should I call you?
      </p>
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" autoFocus />
      </div>
    </div>
  );
}
