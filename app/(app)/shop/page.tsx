"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Coins,
  Loader2,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CoinPacksSection, type CoinPacksSectionRef } from "@/components/shop/CoinPacksSection";
import { ItemIcon } from "@/components/shop/ItemIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = "ALL" | "FOOD" | "DRINK" | "ACCESSORY" | "BACKGROUND" | "PERSONALITY";

interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  icon: string | null;
  rarity: string;
  consumable: boolean;
  effect: { evoXp?: number; moodBoost?: string; duration?: number } | null;
  owned: number;
  equipped: boolean;
}

const categoryEmoji: Record<string, string> = {
  FOOD: "🍎",
  DRINK: "🍵",
  ACCESSORY: "👑",
  BACKGROUND: "🌌",
  PERSONALITY: "🎭",
};

const rarityColors: Record<string, string> = {
  common: "border-stone-200 dark:border-stone-600",
  rare: "border-blue-300 dark:border-blue-500/50",
  legendary: "border-amber-300 dark:border-amber-500/50",
};

const rarityGlow: Record<string, string> = {
  common: "",
  rare: "shadow-blue-200/30 shadow-lg dark:shadow-blue-500/10",
  legendary: "shadow-amber-200/30 shadow-lg dark:shadow-amber-500/20",
};

const rarityBadge: Record<string, string> = {
  common: "bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
  rare: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
  legendary: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [coins, setCoins] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category>("ALL");
  const [toast, setToast] = useState<string | null>(null);
  const coinPacksRef = useRef<CoinPacksSectionRef>(null);

  const fetchShop = useCallback(async () => {
    try {
      const res = await fetch("/api/shop");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setCoins(data.coins);
      setEquipped(data.equipped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  const buy = async (itemId: string) => {
    setBuying(itemId);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error ?? "Purchase failed");
      } else {
        setToast(`Bought ${data.item}!`);
        fetchShop();
      }
    } finally {
      setBuying(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const equip = async (itemId: string, slot: string) => {
    const res = await fetch("/api/shop/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, slot }),
    });
    if (res.ok) {
      setToast("Equipped!");
      fetchShop();
      setTimeout(() => setToast(null), 2000);
    }
  };

  const categories: Category[] = ["ALL", "FOOD", "DRINK", "ACCESSORY", "BACKGROUND", "PERSONALITY"];
  const filtered = filter === "ALL" ? items : items.filter((i) => i.category === filter);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Pet Shop" />

      {/* Coin balance bar */}
      <div className="border-b border-stone-200 px-4 py-3 dark:border-white/[0.06] md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm text-stone-500 dark:text-stone-400">
            Feed, dress, and customize your companion
          </span>
        </div>
        <button
          onClick={() => coinPacksRef.current?.expand()}
          className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors active:scale-95"
          title="Tap to buy more coins"
        >
          <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{coins}</span>
          <span className="text-[10px] text-amber-500 dark:text-amber-400/70">+</span>
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Coin packs section */}
        <CoinPacksSection
          ref={coinPacksRef}
          currentCoins={coins}
          onPurchaseSuccess={fetchShop}
        />

        {/* Shop items section */}
        <div className="px-4 md:px-8 pb-4 pt-4">
          <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-3">Shop Items</h3>
          {/* Category filter */}
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  filter === cat
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                    : "bg-white text-stone-500 border border-stone-200 hover:text-stone-700 dark:bg-white/[0.04] dark:border-white/[0.06] dark:hover:text-stone-300"
                )}
              >
                {cat !== "ALL" && <span className="text-sm">{categoryEmoji[cat]}</span>}
                {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Items grid */}
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-stone-500 py-12">No items in this category yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => {
                  const canAfford = coins >= item.price;
                  const isOwned = item.owned > 0;
                  const isEquipped = item.equipped;
                  const slotMap: Record<string, string> = {
                    ACCESSORY: item.slug.startsWith("acc-glasses") ? "glasses" : "hat",
                    BACKGROUND: "background",
                    PERSONALITY: "personality",
                  };

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "rounded-2xl border p-4 bg-white transition-all dark:bg-white/[0.02]",
                        rarityColors[item.rarity],
                        rarityGlow[item.rarity],
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ItemIcon icon={item.icon} rarity={item.rarity} size="md" />
                          <div>
                            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">{item.name}</h3>
                            <span className={cn("text-[10px] rounded-full px-2 py-0.5 font-medium", rarityBadge[item.rarity])}>
                              {item.rarity}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Coins className="h-3.5 w-3.5" />
                          <span className="text-sm font-bold">{item.price}</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 mb-3 leading-relaxed">{item.description}</p>

                      {/* Effect tags */}
                      {item.effect && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.effect.evoXp && (
                            <span className="text-[10px] bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded-full px-2 py-0.5">
                              +{item.effect.evoXp} EvoXP
                            </span>
                          )}
                          {item.effect.moodBoost && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full px-2 py-0.5">
                              {item.effect.moodBoost} mood
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {item.consumable ? (
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl text-xs"
                            disabled={!canAfford || buying === item.id}
                            onClick={() => buy(item.id)}
                          >
                            {buying === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isOwned ? (
                              `Buy again (${item.owned} owned)`
                            ) : (
                              "Buy"
                            )}
                          </Button>
                        ) : isOwned ? (
                          isEquipped ? (
                            <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" disabled>
                              <Check className="h-3 w-3 mr-1" /> Equipped
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-xl text-xs"
                              onClick={() => equip(item.id, slotMap[item.category] ?? "hat")}
                            >
                              Equip
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl text-xs"
                            disabled={!canAfford || buying === item.id}
                            onClick={() => buy(item.id)}
                          >
                            {buying === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Buy"
                            )}
                          </Button>
                        )}
                      </div>

                      {!canAfford && !isOwned && (
                        <button
                          onClick={() => coinPacksRef.current?.expand()}
                          className="mt-1.5 text-[10px] text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 text-center w-full transition-colors"
                        >
                          Need {item.price - coins} more coins — <span className="underline">Get coins</span>
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
