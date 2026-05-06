"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Sparkles, Instagram, Download } from "lucide-react";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { getXPState, hydrateFromServer } from "@/lib/gamification";
import { getEvolutionInfo, syncEvoXPFromServer } from "@/lib/evolution";
import { getCompanionConfig } from "@/lib/companion-config";
import { useEnergy } from "@/hooks/useEnergy";
import { useMood } from "@/lib/mood-context";
import { useEquippedItems } from "@/hooks/useEquippedItems";
import { useStreak } from "@/hooks/useStreak";
import { getItemEmoji } from "@/lib/shop/emoji-map";
import type { OrbMood } from "@/components/companion/AIAHOrb";

interface ProfileCardProps {
  username?: string;
}

/**
 * Shareable companion profile card — Instagram story format (9:16).
 * All data is fetched live from hooks/server so it's always in sync.
 */
export function ProfileCard({ username }: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [xp, setXp] = useState(getXPState());
  const [evo, setEvo] = useState(getEvolutionInfo());
  const { mood } = useMood();
  const { energy } = useEnergy();
  const { currentStreak } = useStreak();
  const { items: equippedItems } = useEquippedItems();

  const config = getCompanionConfig();
  const companionName = config.name || "AIAH";
  const displayName = username || companionName;

  // Sync with server on mount for accurate data
  useEffect(() => {
    Promise.all([hydrateFromServer(), syncEvoXPFromServer()]).then(() => {
      setXp(getXPState());
      setEvo(getEvolutionInfo());
    });
  }, []);

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 1.0)
    );
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await generateImage();
      if (!blob) throw new Error("Failed to create image");

      const file = new File([blob], "aiah-companion.png", { type: "image/png" });

      // Native share (works on mobile — includes IG Stories, WhatsApp, etc.)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${companionName} - My AIAH Companion`,
          text: `Meet my Level ${xp.level} companion ${companionName}! ${evo.emoji}\naiah.app`,
          files: [file],
        });
      } else {
        // Desktop: download
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
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await generateImage();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aiah-companion.png";
      a.click();
      URL.revokeObjectURL(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } finally {
      setSharing(false);
    }
  };

  // Equipped item emojis for display
  const equippedEmojis = equippedItems
    .filter((i) => i.slot !== "background" && i.slot !== "personality")
    .map((i) => ({ emoji: getItemEmoji(i.icon), name: i.name ?? i.slot }));

  return (
    <div className="space-y-3">
      {/* The card */}
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

        {/* Content — centered flex layout */}
        <div className="relative flex h-full flex-col items-center px-6 py-8">
          {/* Top: User info — fixed at top */}
          <div className="text-center w-full">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-400/60">
              My companion
            </p>
            <h2 className="mt-1.5 text-2xl font-bold text-white tracking-tight">{companionName}</h2>
            <p className="mt-1 text-[11px] text-stone-400">by {displayName}</p>
          </div>

          {/* Middle: Orb — centered vertically */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 w-full">
            <AIAHOrb
              mood={mood as OrbMood}
              size={130}
              energy={energy}
              equippedItems={equippedItems}
              eyeStyle={config.eyeStyle}
              mouthStyle={config.mouthStyle}
            />

            {/* Evolution badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              {evo.emoji} {evo.label}
            </span>

            {/* Equipped items pills */}
            {equippedEmojis.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-center">
                {equippedEmojis.map((item, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] text-stone-300"
                  >
                    {item.emoji} {item.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Stats — fixed at bottom */}
          <div className="w-full space-y-2.5">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Level" value={String(xp.level)} icon="🏆" />
              <StatBox label="EvoXP" value={String(evo.evoXp)} icon="⚡" />
              <StatBox label="Streak" value={currentStreak > 0 ? `${currentStreak}d` : "—"} icon="🔥" />
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
                  style={{ width: `${Math.max(2, xp.progress * 100)}%` }}
                />
              </div>
            </div>

            {/* Energy bar */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-stone-500 w-9 shrink-0">Energy</span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${energy}%` }}
                />
              </div>
              <span className="text-[9px] text-stone-400 w-7 text-right shrink-0">{energy}%</span>
            </div>

            {/* Branding */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <Sparkles className="h-3 w-3 text-emerald-500/40" />
              <span className="text-[9px] font-medium tracking-wider text-stone-600">
                aiah.app
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-60"
        >
          {sharing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : shared ? (
            <Check className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {sharing ? "..." : shared ? "Done!" : "Share"}
        </button>

        <button
          onClick={handleDownload}
          disabled={sharing}
          className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:bg-white active:scale-95 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-stone-200"
        >
          <Download className="h-4 w-4" />
          Save
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {shared && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-emerald-500"
          >
            Share to IG Stories, WhatsApp, or any app!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2 py-2.5 text-center">
      <div className="text-sm leading-none">{icon}</div>
      <p className="mt-1 text-lg font-bold text-white leading-none">{value}</p>
      <p className="mt-0.5 text-[8px] uppercase tracking-wider text-stone-500">{label}</p>
    </div>
  );
}
