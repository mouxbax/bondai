"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CoachingScenarioMeta } from "@/types";

export function CoachingSession({ scenario }: { scenario: CoachingScenarioMeta }) {
  const router = useRouter();
  const [done, setDone] = React.useState(false);

  const complete = async () => {
    await fetch("/api/score/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "COACHING_COMPLETED", note: scenario.title }),
    });
    setDone(true);
  };

  return (
    <Card className="border-stone-100 dark:border-stone-800">
      <CardHeader>
        <CardTitle className="text-base">You&apos;re practicing: {scenario.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Use the chat to rehearse. When you wrap up, mark the session complete to log your progress.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="rounded-xl" onClick={() => router.push("/coaching")}>
            Back
          </Button>
          <Button type="button" className="rounded-xl" disabled={done} onClick={() => void complete()}>
            {done ? "Logged" : "Mark complete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
