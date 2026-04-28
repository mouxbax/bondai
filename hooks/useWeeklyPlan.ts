"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeeklyPlanData } from "@/lib/life-os/types";

export function useWeeklyPlan() {
  const [plan, setPlan] = useState<WeeklyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/life-os", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load plan");
      const j = (await res.json()) as {
        latestPlan: { data: WeeklyPlanData } | null;
      };
      setPlan(j.latestPlan?.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { plan, loading, error, refetch: fetchPlan };
}
