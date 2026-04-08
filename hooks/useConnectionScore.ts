"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScoreApiResponse } from "@/types";

export function useConnectionScore() {
  const [data, setData] = useState<ScoreApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/score");
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as ScoreApiResponse;
      setData(json);
    } catch {
      setError("Could not load score.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logEvent = useCallback(
    async (type: ScoreApiResponse["events"][number]["type"], note?: string) => {
      const res = await fetch("/api/score/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, note }),
      });
      if (!res.ok) return;
      await refresh();
    },
    [refresh]
  );

  return { data, loading, error, refresh, logEvent };
}
