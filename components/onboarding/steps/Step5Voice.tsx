"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function Step5Voice({
  voice,
  setVoice,
}: {
  voice: boolean;
  setVoice: (v: boolean) => void;
}) {
  React.useEffect(() => {
    if (voice && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      void navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
        /* user may deny - still allow toggle */
      });
    }
  }, [voice]);

  return (
    <div className="space-y-4">
      <p className="text-lg text-stone-700 dark:text-stone-200">Would you like to use voice sometimes?</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Voice mode uses your browser&apos;s speech recognition to type, and can read replies aloud. Everything stays on your device
        unless you choose to send a message.
      </p>
      <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <Label htmlFor="voice">Voice mode</Label>
          <p className="text-xs text-stone-500">You can change this anytime.</p>
        </div>
        <Switch id="voice" checked={voice} onCheckedChange={setVoice} />
      </div>
    </div>
  );
}
