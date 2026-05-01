"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpinPrize {
  label: string;
  emoji: string;
  type: "coins" | "xp" | "treat" | "rare" | "energy";
  value: number;
  weight: number; // higher = more common
}

const PRIZES: SpinPrize[] = [
  { label: "5 Coins", emoji: "🪙", type: "coins", value: 5, weight: 30 },
  { label: "10 Coins", emoji: "💰", type: "coins", value: 10, weight: 20 },
  { label: "25 Coins", emoji: "🤑", type: "coins", value: 25, weight: 8 },
  { label: "+15 XP", emoji: "⚡", type: "xp", value: 15, weight: 20 },
  { label: "+30 XP", emoji: "🔥", type: "xp", value: 30, weight: 10 },
  { label: "Free Treat", emoji: "🍎", type: "treat", value: 1, weight: 15 },
  { label: "+10 Energy", emoji: "✨", type: "energy", value: 10, weight: 15 },
  { label: "Rare Item!", emoji: "💎", type: "rare", value: 1, weight: 3 },
];

const SEGMENT_COUNT = PRIZES.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

// Colors for wheel segments
const SEGMENT_COLORS = [
  "#1D9E75", "#0d7a5a", "#f59e0b", "#d97706",
  "#1D9E75", "#0d7a5a", "#f59e0b", "#d97706",
];

const SPIN_KEY = "aiah-last-free-spin";
const SPIN_COUNT_KEY = "aiah-daily-spins";

function getSpinState(): { canFreeSpin: boolean; spinsToday: number } {
  if (typeof window === "undefined") return { canFreeSpin: true, spinsToday: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const lastSpin = localStorage.getItem(SPIN_KEY);
  const spinsRaw = localStorage.getItem(SPIN_COUNT_KEY);
  let spinsToday = 0;
  if (spinsRaw) {
    try {
      const parsed = JSON.parse(spinsRaw);
      if (parsed.date === today) spinsToday = parsed.count;
    } catch { /* ignore */ }
  }
  return {
    canFreeSpin: lastSpin !== today,
    spinsToday,
  };
}

function recordSpin() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(SPIN_KEY, today);
  const spinsRaw = localStorage.getItem(SPIN_COUNT_KEY);
  let count = 1;
  if (spinsRaw) {
    try {
      const parsed = JSON.parse(spinsRaw);
      if (parsed.date === today) count = parsed.count + 1;
    } catch { /* ignore */ }
  }
  localStorage.setItem(SPIN_COUNT_KEY, JSON.stringify({ date: today, count }));
}

function weightedRandom(): SpinPrize {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const prize of PRIZES) {
    rand -= prize.weight;
    if (rand <= 0) return prize;
  }
  return PRIZES[0];
}

interface SpinWheelProps {
  coins: number;
  onPrize: (prize: SpinPrize) => void;
  onSpendCoins?: (amount: number) => Promise<boolean>;
}

export function SpinWheel({ coins, onPrize, onSpendCoins }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinPrize | null>(null);
  const [spinState, setSpinState] = useState(getSpinState);
  const spinCost = 10;

  const handleSpin = async (free: boolean) => {
    if (spinning) return;

    if (!free) {
      if (coins < spinCost) return;
      if (onSpendCoins) {
        const ok = await onSpendCoins(spinCost);
        if (!ok) return;
      }
    }

    setSpinning(true);
    setResult(null);

    const prize = weightedRandom();
    const prizeIndex = PRIZES.indexOf(prize);
    // Spin 5-8 full rotations + land on prize segment
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = 360 - (prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
    const newRotation = rotation + fullSpins + targetAngle;

    setRotation(newRotation);

    if (free) recordSpin();

    // Wait for spin animation
    setTimeout(() => {
      setSpinning(false);
      setResult(prize);
      setSpinState(getSpinState());
      onPrize(prize);
    }, 3500);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Wheel */}
      <div className="relative">
        {/* Pointer triangle */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
        </div>

        {/* Wheel SVG */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3.5, ease: [0.17, 0.67, 0.12, 0.99] }}
          className="relative h-56 w-56 rounded-full border-4 border-white/20 shadow-2xl"
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            {PRIZES.map((prize, i) => {
              const startAngle = i * SEGMENT_ANGLE;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              const x1 = 100 + 100 * Math.cos(startRad);
              const y1 = 100 + 100 * Math.sin(startRad);
              const x2 = 100 + 100 * Math.cos(endRad);
              const y2 = 100 + 100 * Math.sin(endRad);
              const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

              // Label position
              const midRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
              const lx = 100 + 62 * Math.cos(midRad);
              const ly = 100 + 62 * Math.sin(midRad);
              const labelAngle = (startAngle + endAngle) / 2;

              return (
                <g key={i}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    transform={`rotate(${labelAngle}, ${lx}, ${ly})`}
                  >
                    {prize.emoji}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="100" cy="100" r="18" fill="#0a1a14" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="100" y="100" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="8" fontWeight="bold">
              SPIN
            </text>
          </svg>
        </motion.div>
      </div>

      {/* Result toast */}
      <AnimatePresence>
        {result && !spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl"
          >
            <Gift className="h-4 w-4" />
            You won: {result.emoji} {result.label}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin buttons */}
      <div className="flex gap-3">
        {spinState.canFreeSpin ? (
          <Button
            onClick={() => handleSpin(true)}
            disabled={spinning}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Free Daily Spin!
          </Button>
        ) : (
          <Button
            onClick={() => handleSpin(false)}
            disabled={spinning || coins < spinCost}
            variant="outline"
            className="rounded-2xl px-6 text-sm font-semibold"
          >
            <Coins className="mr-2 h-4 w-4 text-amber-500" />
            Spin ({spinCost} coins)
          </Button>
        )}
      </div>

      {/* Spin info */}
      <p className="text-[10px] text-stone-500">
        {spinState.canFreeSpin
          ? "1 free spin per day! Extra spins cost 10 coins."
          : `${spinState.spinsToday} spin${spinState.spinsToday !== 1 ? "s" : ""} today. Next free spin tomorrow.`}
      </p>
    </div>
  );
}
