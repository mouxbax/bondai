"use client";

import { useState, useEffect, useCallback } from "react";

interface EnergyState {
  energy: number;
  maxEnergy: number;
  planCooldown: {
    canGenerate: boolean;
    nextAvailableAt: string | null;
  };
  loading: boolean;
}

interface ConsumeResult {
  energy: number;
  error?: string;
  nextAvailableAt?: string;
}

export function useEnergy() {
  const [state, setState] = useState<EnergyState>({
    energy: 100,
    maxEnergy: 100,
    planCooldown: { canGenerate: true, nextAvailableAt: null },
    loading: true,
  });

  const fetchEnergy = useCallback(async () => {
    try {
      const res = await fetch("/api/energy", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setState({
        energy: data.energy,
        maxEnergy: data.maxEnergy,
        planCooldown: data.planCooldown,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchEnergy();
    // Poll every 60s to reflect passive recharge
    const interval = setInterval(fetchEnergy, 60_000);
    return () => clearInterval(interval);
  }, [fetchEnergy]);

  const consumeEnergy = useCallback(
    async (action: "plan_generation" | "practice" | "breathing"): Promise<ConsumeResult> => {
      try {
        const res = await fetch("/api/energy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            energy: state.energy,
            error: data.error,
            nextAvailableAt: data.nextAvailableAt,
          };
        }
        setState((prev) => ({ ...prev, energy: data.energy }));
        // Refresh full state (includes cooldown update)
        setTimeout(fetchEnergy, 500);
        return { energy: data.energy };
      } catch {
        return { energy: state.energy, error: "Network error" };
      }
    },
    [state.energy, fetchEnergy],
  );

  return {
    ...state,
    consumeEnergy,
    refreshEnergy: fetchEnergy,
  };
}
