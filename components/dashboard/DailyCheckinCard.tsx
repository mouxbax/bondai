"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DailyCheckinCard({
  needsCheckin,
  loading,
}: {
  needsCheckin: boolean;
  loading?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkin", { method: "POST" });
      if (!res.ok) throw new Error("checkin");
      const data = (await res.json()) as { conversationId: string };
      router.push(`/chat/${data.conversationId}`);
    } catch {
      setBusy(false);
    }
  };

  if (!needsCheckin) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-[#1D9E75]/25 bg-gradient-to-br from-[#1D9E75]/10 via-white to-amber-50/40 shadow-md dark:from-[#1D9E75]/15 dark:via-stone-900 dark:to-amber-950/20">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D9E75] text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Your daily check-in</h2>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                A few minutes to notice your day - and one small step toward real life.
              </p>
            </div>
          </div>
          <Button
            className="h-12 shrink-0 rounded-xl px-6"
            disabled={busy || loading}
            onClick={() => void start()}
          >
            {busy ? "Opening…" : "Start check-in"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
