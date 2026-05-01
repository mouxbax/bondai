"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Package, UtensilsCrossed, Shirt } from "lucide-react";
import Link from "next/link";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";
import { getItemEmoji, RARITY_GLOW } from "@/lib/shop/emoji-map";
import { addEvoXP } from "@/lib/evolution";

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
  effect: { evoXp?: number; moodBoost?: string; duration?: number } | null;
}

interface CompanionInventoryProps {
  onFed?: (result: { item: string; evoXpGained?: number; moodBoost?: string }) => void;
}

function getEmoji(icon: string | null): string {
  return getItemEmoji(icon);
}

// ─── Treat card (draggable food/drink item) ─────────────────────────────
function TreatCard({
  item,
  feeding,
  dragItem,
  dragOffset,
  onTouchStart,
  onMouseDown,
}: {
  item: InventoryItem;
  feeding: string | null;
  dragItem: string | null;
  dragOffset: { x: number; y: number };
  onTouchStart: (id: string, e: React.TouchEvent) => void;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
}) {
  const isDragging = dragItem === item.id;
  const emoji = getEmoji(item.icon);
  const empty = item.quantity <= 0;
  const glow = RARITY_GLOW[item.rarity] ?? RARITY_GLOW.common;
  const evoXp = item.effect?.evoXp;

  return (
    <motion.div
      className={`relative flex-shrink-0 rounded-2xl border p-2.5 select-none touch-none transition-all ${
        empty
          ? "border-white/[0.04] opacity-40 grayscale cursor-default"
          : isDragging
            ? "border-emerald-400 dark:border-emerald-500/50 shadow-lg shadow-emerald-500/20 cursor-grabbing"
            : `border-white/[0.08] hover:border-white/[0.15] cursor-grab ring-2 ${glow.ring}`
      } bg-gradient-to-br ${empty ? "from-stone-900/20 to-stone-900/20" : glow.bg}`}
      style={{
        width: 72,
        ...(isDragging
          ? {
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.15)`,
              zIndex: 50,
              position: "relative" as const,
            }
          : {}),
      }}
      onTouchStart={(e) => !empty && onTouchStart(item.id, e)}
      onMouseDown={(e) => !empty && onMouseDown(item.id, e)}
    >
      {/* Quantity badge */}
      {item.quantity > 0 && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white shadow-sm">
          {item.quantity}
        </div>
      )}

      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[28px] leading-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
          {feeding === item.id ? (
            <Loader2 className="h-7 w-7 animate-spin text-stone-400" />
          ) : (
            emoji
          )}
        </div>
        <span className="text-[9px] font-medium text-stone-400 text-center leading-tight truncate w-full">
          {item.name}
        </span>
        {evoXp && item.quantity > 0 && (
          <span className="text-[8px] font-semibold text-violet-500">
            +{evoXp} EvoXP
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Closet card (accessory — equip/unequip) ───────────────────────────
function ClosetCard({ item }: { item: InventoryItem }) {
  const emoji = getEmoji(item.icon);
  const glow = RARITY_GLOW[item.rarity] ?? RARITY_GLOW.common;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex-shrink-0 rounded-2xl border border-white/[0.08] hover:border-white/[0.15] p-2.5 cursor-pointer select-none bg-gradient-to-br ${glow.bg} ring-2 ${glow.ring} transition-all`}
      style={{ width: 72 }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[28px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{emoji}</div>
        <span className="text-[9px] font-medium text-stone-400 text-center leading-tight truncate w-full">
          {item.name}
        </span>
        <span className="text-[8px] text-violet-400 font-medium">
          {item.rarity}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────
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
      setItems(data.items);
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
        // Add EvoXP locally too (for instant UI feedback)
        if (data.evoXpGained) {
          addEvoXP(data.evoXpGained);
        }
        setFeedResult(`${emoji} Yum! ${data.item}${data.evoXpGained ? ` +${data.evoXpGained} EvoXP` : ""}`);
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

  // Touch drag
  const handleTouchStart = useCallback((itemId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    const t = e.touches[0];
    setDragItem(itemId);
    setDragOffset({ x: 0, y: 0 });
    const startX = t.clientX;
    const startY = t.clientY;

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const ct = ev.touches[0];
      setDragOffset({ x: ct.clientX - startX, y: ct.clientY - startY });
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

  // Mouse drag
  const handleMouseDown = useCallback((itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragItem(itemId);
    setDragOffset({ x: 0, y: 0 });
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      setDragOffset({ x: ev.clientX - startX, y: ev.clientY - startY });
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

  // Split items
  const fridgeItems = items.filter((i) => i.consumable); // food + drinks
  const closetItems = items.filter((i) => !i.consumable); // accessories, backgrounds, personalities

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
      </div>
    );
  }

  const hasNothing = fridgeItems.length === 0 && closetItems.length === 0;

  return (
    <div className="mt-6 space-y-5">
      {/* ─── Feed result toast (floats above both sections) ─── */}
      <AnimatePresence>
        {feedResult && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="rounded-2xl bg-emerald-500/90 px-4 py-2.5 text-xs font-medium text-white text-center shadow-lg"
          >
            {feedResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone indicator when dragging */}
      <AnimatePresence>
        {dragItem && dragOffset.y < -30 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center"
          >
            <div className={`rounded-full border-2 border-dashed px-4 py-1.5 text-[10px] font-medium transition-colors ${
              dragOffset.y < -80
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-stone-500/40 text-stone-500"
            }`}>
              {dragOffset.y < -80 ? "✨ Release to feed!" : "↑ Keep dragging up..."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasNothing && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 dark:border-white/[0.06] py-8 px-4">
          <Package className="h-6 w-6 text-stone-300 dark:text-stone-600" />
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            No items yet. Visit the shop!
          </p>
          <Link
            href="/shop"
            className="mt-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            Shop
          </Link>
        </div>
      )}

      {/* ─── Fridge (food + drinks) ──────────────────────────── */}
      {fridgeItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Fridge
              </label>
            </div>
            <Link
              href="/shop"
              className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Get more
            </Link>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-stone-500 mb-2 text-center">
            Drag a treat up to feed and evolve your companion
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            {fridgeItems.map((item) => (
              <TreatCard
                key={item.id}
                item={item}
                feeding={feeding}
                dragItem={dragItem}
                dragOffset={dragOffset}
                onTouchStart={handleTouchStart}
                onMouseDown={handleMouseDown}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Closet (accessories, backgrounds, personalities) ── */}
      {closetItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shirt className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Closet
              </label>
            </div>
            <Link
              href="/shop"
              className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Get more
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {closetItems.map((item) => (
              <ClosetCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
