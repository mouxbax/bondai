"use client";

import { useState, useEffect, useCallback } from "react";

export interface EquippedItem {
  slot: string;
  itemId: string;
  slug: string;
  name: string;
  icon: string | null;
  rarity: string;
  category: string;
  effect: Record<string, unknown> | null;
}

/**
 * Fetches the user's currently equipped companion items.
 * Returns { items, refresh, loading }.
 */
export function useEquippedItems() {
  const [items, setItems] = useState<EquippedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/pet/equipped");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.equipped ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, refresh, loading };
}
