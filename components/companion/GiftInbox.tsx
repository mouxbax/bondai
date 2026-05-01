"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Loader2, Check, X } from "lucide-react";
import { getItemEmoji, RARITY_GLOW } from "@/lib/shop/emoji-map";

interface GiftEntry {
  id: string;
  senderName: string | null;
  senderImage: string | null;
  itemName: string;
  itemIcon: string | null;
  itemRarity: string;
  quantity: number;
  message: string | null;
  status: string;
  createdAt: string;
}

export function GiftInbox() {
  const [gifts, setGifts] = useState<GiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch("/api/pet/gift");
      if (!res.ok) return;
      const data = await res.json();
      setGifts(data.inbox);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const respond = async (giftId: string, action: "accept" | "decline") => {
    setResponding(giftId);
    try {
      await fetch("/api/pet/gift/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId, action }),
      });
      fetchGifts();
    } finally {
      setResponding(null);
    }
  };

  const pending = gifts.filter((g) => g.status === "pending");
  const recent = gifts.filter((g) => g.status !== "pending").slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
      </div>
    );
  }

  if (gifts.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Pending gifts */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Gift className="h-3.5 w-3.5 text-pink-500" />
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Gift Inbox ({pending.length})
            </label>
          </div>
          <AnimatePresence>
            {pending.map((g) => {
              const emoji = getItemEmoji(g.itemIcon);
              const glow = RARITY_GLOW[g.itemRarity] ?? RARITY_GLOW.common;

              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center gap-3 rounded-2xl border border-pink-200 dark:border-pink-500/20 bg-pink-50/50 dark:bg-pink-900/10 p-3 mb-2`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${glow.bg} ring-2 ${glow.ring}`}>
                    <span className="text-xl">{emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {g.senderName ?? "Someone"} sent {g.quantity}x {g.itemName}
                    </p>
                    {g.message && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                        &ldquo;{g.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => respond(g.id, "accept")}
                      disabled={responding === g.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {responding === g.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => respond(g.id, "decline")}
                      disabled={responding === g.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Recent gift history */}
      {recent.length > 0 && (
        <div>
          <label className="text-[10px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            Recent gifts
          </label>
          <div className="mt-1 space-y-1">
            {recent.map((g) => (
              <div key={g.id} className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                <span>{getItemEmoji(g.itemIcon)}</span>
                <span className="truncate">
                  {g.senderName} &rarr; {g.quantity}x {g.itemName}
                </span>
                <span className={g.status === "accepted" ? "text-emerald-500" : "text-stone-400"}>
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
