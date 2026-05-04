"use client";

import { useState, useEffect, useCallback } from "react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  coinsAwarded: number;
  milestone: number | null;
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    checkedInToday: false,
    coinsAwarded: 0,
    milestone: null,
  });
  const [loading, setLoading] = useState(true);

  // Auto check-in on mount (idempotent — safe to call multiple times)
  const checkIn = useCallback(async () => {
    try {
      const res = await fetch("/api/streak", { method: "POST" });
      if (!res.ok) return undefined;
      const data = await res.json();
      setStreak(data);
      return data as StreakData;
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    checkIn().finally(() => setLoading(false));
  }, [checkIn]);

  return { ...streak, loading, checkIn };
}
