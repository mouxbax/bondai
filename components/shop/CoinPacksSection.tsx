'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Sparkles, Loader2, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAllPacks, getTotalCoins } from '@/lib/coin-packs';

interface CoinPacksSectionProps {
  currentCoins: number;
  onPurchaseSuccess?: () => void;
}

export function CoinPacksSection({ currentCoins, onPurchaseSuccess }: CoinPacksSectionProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const packs = getAllPacks();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'success') {
      setPurchaseSuccess(true);
      const timer = setTimeout(() => {
        setPurchaseSuccess(false);
        window.history.replaceState({}, '', '/shop');
        onPurchaseSuccess?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [onPurchaseSuccess]);

  const handleBuyCoinPack = async (packId: string) => {
    setPurchasing(packId);
    try {
      const response = await fetch('/api/shop/coins/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Checkout error:', data.error);
        setPurchasing(null);
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to initiate checkout:', error);
      setPurchasing(null);
    }
  };

  return (
    <>
      {/* Success toast */}
      {purchaseSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-emerald-500/90 px-4 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-sm flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Coins added to your balance!
        </motion.div>
      )}

      {/* Compact toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 md:px-8 border-b border-stone-200 dark:border-white/[0.06] hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Need more coins?
          </span>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-stone-400 transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>

      {/* Expandable packs row */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-stone-200 dark:border-white/[0.06] bg-stone-50/50 dark:bg-white/[0.01]"
        >
          <div className="px-4 py-4 md:px-8">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {packs.map((pack) => {
                const isPopular = pack.id === 'popular';
                const totalCoins = getTotalCoins(pack);
                const priceInDollars = (pack.price / 100).toFixed(2);

                return (
                  <div
                    key={pack.id}
                    className={cn(
                      'relative flex-shrink-0 w-[160px] rounded-xl border p-3 bg-white dark:bg-white/[0.03] transition-all',
                      isPopular
                        ? 'border-amber-200 dark:border-amber-500/30'
                        : 'border-stone-200 dark:border-white/[0.08]'
                    )}
                  >
                    {/* Badge */}
                    {pack.badge && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                          {pack.badge}
                        </span>
                      </div>
                    )}

                    <div className={pack.badge ? 'pt-1' : ''}>
                      {/* Coin amount */}
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                          {totalCoins}
                        </span>
                        <span className="text-[10px] text-stone-400">coins</span>
                      </div>

                      {/* Bonus tag */}
                      {pack.bonusCoins > 0 && (
                        <div className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[9px] font-medium mb-2">
                          <Sparkles className="h-2.5 w-2.5" />
                          +{pack.bonusCoins} bonus
                        </div>
                      )}

                      {/* Price + Buy */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-sm font-bold text-stone-900 dark:text-white">
                          ${priceInDollars}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleBuyCoinPack(pack.id)}
                          disabled={purchasing === pack.id}
                          className={cn(
                            'h-7 px-3 rounded-lg text-xs font-semibold',
                            isPopular
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                              : ''
                          )}
                        >
                          {purchasing === pack.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Buy'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
