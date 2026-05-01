"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Package } from "lucide-react";
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

/** Map item icon/slug to emoji */
const ITEM_EMOJI: Record<string, string> = {
  apple: "🍎",
  pizza: "🍕",
  sushi: "🍣",
  cake: "🎂",
  droplets: "💧",
  coffee: "🍵",
  zap: "⚡",
  crown: "👑",
  glasses: "🕶️",
  shirt: "🎀",
  sparkles: "✨",
  star: "⭐",
  "flower-2": "🌸",
  binary: "💻",
  drama: "🎭",
  flame: "🔥",
};

function getEmoji(icon: string | null): string {
  if (!icon) return "🎁";
  return ITEM_EMOJI[icon] ?? "🎁";
}

export function CompanionInventory({ onFed }: CompanionInventoryProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState<string | null>(null);
  const [feedResult, setFeedResult] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
        sfx.purr();
        haptic("success");
        const emoji = getEmoji(data.icon);
        setFeedResult(`${emoji} Fed ${data.item}!${data.energyRestored ? ` +${data.energyRestored}% energy` : ""}`);
        onFed?.(data);
        fetchInventory();
        setTimeout(() => setFeedResult(null), 2500);
      }
    } finally {
      setFeeding(null);
      setDragItem(null);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [fetchInventory, onFed]);

  // Unified drag handlers for touch
  const handleTouchStart = useCallback((itemId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    const t = e.touches[0];
    setDragItem(itemId);
    setDragOffset({ x: 0, y: 0 });
    // Store start position in a data attribute approach via closure
    const startX = t.clientX;
    const startY = t.clientY;

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const ct = ev.touches[0];
      setDragOffset({
        x: ct.clientX - startX,
        y: ct.clientY - startY,
      });
    };
    const onEnd = (ev: TouchEvent) => {
      const ct = ev.changedTouches[0];
      const dy = ct.clientY - startY;
      if (dy < -80) {
        feedItem(itemId);
      } else {
        setDragItem(null);
        setDragOffset({ x: 0, y: 0 });
      }
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  }, [feedItem]);

  // Mouse drag handlers (desktop)
  const handleMouseDown = useCallback((itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragItem(itemId);
    setDragOffset({ x: 0, y: 0 });
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      setDragOffset({
        x: ev.clientX - startX,
        y: ev.clientY - startY,
      });
    };
    const onUp = (ev: MouseEvent) => {
      const dy = ev.clientY - startY;
      if (dy < -80) {
        feedItem(itemId);
      } else {
        setDragItem(null);
        setDragOffset({ x: 0, y: 0 });
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
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
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-3 text-center">
            Drag a treat up toward your companion to feed it
          </p>

          {/* Drop zone indicator */}
          <AnimatePresence>
            {dragItem && dragOffset.y < -30 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center mb-3"
              >
                <div className={`rounded-full border-2 border-dashed px-4 py-1.5 text-[10px] font-medium transition-colors ${
                  dragOffset.y < -80
                    ? "border-emerald-400 text-emerald-500 dark:text-emerald-400 bg-emerald-500/10"
                    : "border-stone-400/40 text-stone-400 dark:text-stone-500"
                }`}>
                  {dragOffset.y < -80 ? "✨ Release to feed!" : "↑ Keep dragging up..."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 justify-center flex-wrap">
            {consumables.map((item) => {
              const isDragging = dragItem === item.id;
              const emoji = getEmoji(item.icon);
              const rarityRing =
                item.rarity === "legendary"
                  ? "ring-amber-400/60"
                  : item.rarity === "rare"
                    ? "ring-violet-400/60"
                    : "";

              return (
                <motion.div
                  key={item.id}
                  className={`relative flex-shrink-0 rounded-2xl border p-3 cursor-grab active:cursor-grabbing select-none touch-none transition-all ${
                    isDragging
                      ? "border-emerald-400 dark:border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                      : `border-white/[0.08] hover:border-white/[0.15] ${rarityRing ? `ring-1 ${rarityRing}` : ""}`
                  } bg-white/[0.04] backdrop-blur-sm`}
                  style={{
                    width: 80,
                    ...(isDragging
                      ? {
                          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.15)`,
                          zIndex: 50,
                          position: "relative" as const,
                        }
                      : {}),
                  }}
                  onTouchStart={(e) => handleTouchStart(item.id, e)}
                  onMouseDown={(e) => handleMouseDown(item.id, e)}
                >
                  {/* Quantity badge */}
                  <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white shadow-sm">
                    {item.quantity}
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="text-3xl leading-none select-none">
                      {feeding === item.id ? (
                        <Loader2 className="h-7 w-7 animate-spin text-stone-400" />
                      ) : (
                        emoji
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-stone-400 dark:text-stone-400 text-center leading-tight">
                      {item.name}
                    </span>
                    {item.effect?.energy && (
                      <span className="text-[9px] font-semibold text-emerald-500 dark:text-emerald-400">
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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mt-3 rounded-2xl bg-emerald-500/90 px-4 py-2.5 text-xs font-medium text-white text-center shadow-lg"
          >
            {feedResult}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
