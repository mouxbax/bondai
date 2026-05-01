"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Droplets, ShoppingBag, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";

interface InventoryItem {
  inventoryId: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  rarity: string;
  consumable: boolean;
  quantity: number;
  effect: { energy?: number; moodBoost?: string; duration?: number } | null;
}

interface CompanionInventoryProps {
  onFed?: (result: { item: string; energyRestored?: number; moodBoost?: string }) => void;
}

function getItemIcon(iconName: string | null) {
  switch (iconName) {
    case "apple": return <Apple className="h-5 w-5" />;
    case "droplets": return <Droplets className="h-5 w-5" />;
    default: return <ShoppingBag className="h-5 w-5" />;
  }
}

export function CompanionInventory({ onFed }: CompanionInventoryProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState<string | null>(null);
  const [feedResult, setFeedResult] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/pet/inventory");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items.filter((i: InventoryItem) => i.consumable && i.quantity > 0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const feedItem = useCallback(async (itemId: string) => {
    setFeeding(itemId);
    try {
      const res = await fetch("/api/pet/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        sfx.pop();
        haptic("success");
        setFeedResult(`Fed ${data.item}!${data.energyRestored ? ` +${data.energyRestored}% energy` : ""}`);
        onFed?.(data);
        fetchInventory();
        setTimeout(() => setFeedResult(null), 2500);
      }
    } finally {
      setFeeding(null);
      setDragItem(null);
    }
  }, [fetchInventory, onFed]);

  // Handle touch/drag to feed
  const handleDragStart = useCallback((itemId: string, e: React.TouchEvent | React.MouseEvent) => {
    setDragItem(itemId);
    const pos = "touches" in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    dragStartPos.current = pos;
  }, []);

  const handleDragEnd = useCallback((itemId: string, e: React.TouchEvent | React.MouseEvent) => {
    if (!dragStartPos.current) return;
    const end = "changedTouches" in e
      ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    const dy = dragStartPos.current.y - end.y;

    // If dragged upward significantly (toward the orb), feed
    if (dy > 60) {
      feedItem(itemId);
    } else {
      setDragItem(null);
    }
    dragStartPos.current = null;
  }, [feedItem]);

  const consumables = items.filter((i) => i.consumable && i.quantity > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Treats
        </label>
        <Link
          href="/shop"
          className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Get more
        </Link>
      </div>

      {consumables.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 dark:border-white/[0.06] py-8 px-4">
          <Package className="h-6 w-6 text-stone-300 dark:text-stone-600" />
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            No treats yet. Visit the shop to buy some!
          </p>
          <Link
            href="/shop"
            className="mt-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            Shop
          </Link>
        </div>
      ) : (
        <>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-2">
            Drag a treat up toward your companion to feed it
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {consumables.map((item) => {
              const isDragging = dragItem === item.id;
              return (
                <motion.div
                  key={item.id}
                  className={`relative flex-shrink-0 w-[90px] rounded-2xl border p-3 bg-white dark:bg-white/[0.03] cursor-grab active:cursor-grabbing select-none transition-all ${
                    isDragging
                      ? "border-emerald-400 dark:border-emerald-500/50 shadow-lg scale-105"
                      : "border-stone-200 dark:border-white/[0.08]"
                  }`}
                  whileTap={{ scale: 1.05 }}
                  onTouchStart={(e) => handleDragStart(item.id, e)}
                  onTouchEnd={(e) => handleDragEnd(item.id, e)}
                  onMouseDown={(e) => handleDragStart(item.id, e)}
                  onMouseUp={(e) => handleDragEnd(item.id, e)}
                  animate={isDragging ? { y: -10, opacity: 0.8 } : { y: 0, opacity: 1 }}
                >
                  {/* Quantity badge */}
                  <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white">
                    {item.quantity}
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/[0.06] dark:text-stone-300">
                      {feeding === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        getItemIcon(item.icon)
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-stone-700 dark:text-stone-300 text-center leading-tight">
                      {item.name}
                    </span>
                    {item.effect?.energy && (
                      <span className="text-[8px] text-emerald-600 dark:text-emerald-400">
                        +{item.effect.energy}%
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Feed result toast */}
      <AnimatePresence>
        {feedResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 rounded-xl bg-emerald-500/90 px-3 py-2 text-xs font-medium text-white text-center"
          >
            {feedResult}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
