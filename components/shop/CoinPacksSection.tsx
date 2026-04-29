'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Sparkles, Loader2, Check } from 'lucide-react';
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
  const packs = getAllPacks();

  useEffect(() => {
    // Check if purchase was successful via URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'success') {
      setPurchaseSuccess(true);
      const timer = setTimeout(() => {
        setPurchaseSuccess(false);
        // Clear the URL param
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="relative">
      {/* Success toast */}
      {purchaseSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-emerald-500/90 px-4 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-sm flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Coins purchased! Check your balance.
        </motion.div>
      )}

      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl pointer-events-none" />

      <div className="relative px-4 py-8 md:px-8 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg md:text-xl font-bold text-stone-900 dark:text-white">
              Get More Coins
            </h2>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Coins are used to feed and customize your companion
          </p>

          {/* Current balance */}
          <div className="mt-4 flex items-center gap-2 w-fit rounded-2xl bg-amber-50 dark:bg-amber-900/30 px-4 py-2 border border-amber-200 dark:border-amber-500/30">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {currentCoins} coins
            </span>
          </div>
        </motion.div>

        {/* Coin packs grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {packs.map((pack) => {
            const isPopular = pack.id === 'popular';
            const totalCoins = getTotalCoins(pack);
            const priceInDollars = (pack.price / 100).toFixed(2);

            return (
              <motion.div
                key={pack.id}
                variants={itemVariants}
                whileHover={isPopular ? { scale: 1.02 } : { scale: 1.01 }}
                className={cn(
                  'relative rounded-2xl border p-5 bg-white dark:bg-white/[0.02] transition-all',
                  isPopular
                    ? 'border-amber-200 dark:border-amber-500/40 shadow-lg dark:shadow-amber-500/10'
                    : 'border-stone-200 dark:border-white/[0.08]'
                )}
              >
                {/* Badge */}
                {pack.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                      {pack.badge}
                    </span>
                  </div>
                )}

                <div className={isPopular ? 'pt-2' : ''}>
                  {/* Pack name */}
                  <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-1">
                    {pack.name}
                  </h3>

                  {/* Coin amount with gradient */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                        {totalCoins}
                      </span>
                      <span className="text-sm text-stone-500 dark:text-stone-400">coins</span>
                    </div>

                    {/* Bonus coins tag */}
                    {pack.bonusCoins > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-emerald-200 dark:border-emerald-500/30">
                        <Sparkles className="h-3 w-3" />
                        +{pack.bonusCoins} bonus
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                    {pack.description}
                  </p>

                  {/* Price and button */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xl font-bold text-stone-900 dark:text-white">
                        ${priceInDollars}
                      </span>
                      {pack.bonusCoins > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Best value
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleBuyCoinPack(pack.id)}
                      disabled={purchasing === pack.id}
                      className={cn(
                        'flex-1 rounded-xl text-sm font-semibold',
                        isPopular
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg'
                          : ''
                      )}
                    >
                      {purchasing === pack.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Buy'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-stone-200 to-transparent dark:from-white/[0.08] to-transparent" />
          <span className="text-xs font-medium text-stone-400 dark:text-stone-500 px-2">
            Or
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-stone-200 to-transparent dark:from-white/[0.08] to-transparent" />
        </div>

        <h3 className="font-semibold text-stone-900 dark:text-white mb-4 text-sm">
          Buy Individual Items
        </h3>
      </div>
    </div>
  );
}
