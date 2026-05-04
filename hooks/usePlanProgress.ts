"use client";

import { useState, useEffect, useCallback } from "react";

interface PlanStats {
  completed: number;
  total: number;
  percent: number;
}

interface PlanProgressData {
  progress: Record<string, boolean[]>;
  stats: PlanStats | null;
}

export function usePlanProgress() {
  const [data, setData] = useState<PlanProgressData>({
    progress: {},
    stats: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/plan-progress");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {}
  }, []);

  useEffect(() => {
    fetchProgress().finally(() => setLoading(false));
  }, [fetchProgress]);

  const toggleTask = useCallback(
    async (day: string, taskIndex: number, completed: boolean) => {
      // Optimistic update
      setData((prev) => {
        const progress = { ...prev.progress };
        if (!progress[day]) progress[day] = [];
        const arr = [...progress[day]];
        while (arr.length <= taskIndex) arr.push(false);
        arr[taskIndex] = completed;
        progress[day] = arr;
        return { ...prev, progress };
      });

      try {
        const res = await fetch("/api/plan-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day, taskIndex, completed }),
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {}
    },
    [],
  );

  return { ...data, loading, toggleTask, refetch: fetchProgress };
}
