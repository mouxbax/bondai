"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Sparkles } from "lucide-react";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { getXPState } from "@/lib/gamification";
import { getEvolutionInfo } from "@/lib/evolution";
import { getCompanionConfig } from "@/lib/companion-config";
import { useEnergy } from "@/hooks/useEnergy";
import { useMood } from "@/lib/mood-context";
import type { OrbMood } from "@/components/companion/AIAHOrb";

interface ProfileCardProps {
  /** Username / display name for the card */
  username?: string;
  /** Current streak count */
  streak?: number;
  /** Equipped accessory names */
  equippedItems?: string[];
}

/**
 * Shareable companion profile card — Instagram story format (9:16).
 * Renders as a styled div that can be exported as PNG via canvas.
 */
export function ProfileCard({ username, streak = 0, equippedItems = [] }: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const { mood } = useMood();
  const { energy } = useEnergy();

  const xp = getXPState();
  const evo = getEvolutionInfo();
  const config = getCompanionConfig();
  const companionName = config.name || "AIAH";
  const displayName = username || "AIAH User";

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);

    try {
      // Dynamic import to keep bundle small
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      if (!blob) throw new Error("Failed to create image");

      // Try native share first (mobile), fallback to download
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "aiah-companion.png", { type: "image/png" })] })) {
        const file = new File([blob], "aiah-companion.png", { type: "image/png" });
        await navigator.share({
          title: `${companionName} - My AIAH Companion`,
          text: `Check out my Level ${xp.level} companion ${companionName}! ${evo.emoji}`,
          files: [file],
        });
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aiah-companion.png";
        a.click();
        URL.revokeObjectURL(url);
      }

      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* The card itself */}
      <div
        ref={cardRef}
        className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl"
        style={{
          aspectRatio: "9 / 16",
          background: "linear-gradient(160deg, #0a1a14 0%, #0d2818 30%, #112211 60%, #0a0f0c 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-600/8 blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Content */}
        <div className="relative flex h-full flex-col items-center justify-between px-6 py-8">
          {/* Top: User info */}
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-400/60">
              My companion
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{companionName}</h2>
            <p className="mt-0.5 text-[11px] text-stone-400">by {displayName}</p>
          </div>

          {/* Middle: Orb */}
          <div className="flex flex-col items-center gap-4">
            <AIAHOrb mood={mood as OrbMood} size={130} energy={energy} />

            {/* Evolution badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                {evo.emoji} {evo.label}
              </span>
            </div>

            {/* Equipped items */}
            {equippedItems.length > 0 && (
              <div className="flex gap-1.5">
                {equippedItems.map((item, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-stone-400"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Stats row */}
          <div className="w-full space-y-3">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Level" value={String(xp.level)} icon="🏆" />
              <StatBox label="XP" value={String(xp.total)} icon="⚡" />
              <StatBox label="Streak" value={`${streak}d`} icon="🔥" />
            </div>

            {/* XP Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-stone-500">
                <span>Level {xp.level}</span>
                <span>Level {xp.level + 1}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${xp.progress * 100}%` }}
                />
              </div>
            </div>

            {/* Energy bar */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-stone-500">Energy</span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${energy}%` }}
                />
              </div>
              <span className="text-[9px] text-stone-400">{energy}%</span>
            </div>

            {/* Branding */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <Sparkles className="h-3 w-3 text-emerald-500/40" />
              <span className="text-[9px] font-medium tracking-wider text-stone-600">
                aiah.app
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="mx-auto flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-60"
      >
        {sharing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : shared ? (
          <Check className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {sharing ? "Generating..." : shared ? "Shared!" : "Share your companion"}
      </button>

      {/* Toast */}
      <AnimatePresence>
        {shared && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-emerald-500"
          >
            Image saved! Share it on your socials
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2 py-2 text-center">
      <span className="text-sm">{icon}</span>
      <p className="text-base font-bold text-white leading-tight">{value}</p>
      <p className="text-[8px] uppercase tracking-wider text-stone-500">{label}</p>
    </div>
  );
}
