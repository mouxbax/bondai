"use client";

import { useConnectionScore } from "@/hooks/useConnectionScore";

export function useStreak() {
  const { data, loading, error, refresh } = useConnectionScore();
  return {
    current: data?.streak.current ?? 0,
    longest: data?.streak.longest ?? 0,
    lastCheckIn: data?.streak.lastCheckInDate ?? null,
    loading,
    error,
    refresh,
  };
}
