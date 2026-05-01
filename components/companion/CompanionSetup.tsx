"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { useMood } from "@/lib/mood-context";
import {
  getCompanionConfig,
  setCompanionConfig,
  VIBES,
  type CompanionConfig,
  type CompanionVibe,
} from "@/lib/companion-config";
import { useEnergy } from "@/hooks/useEnergy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Volume2, VolumeX } from "lucide-react";
import { CompanionInventory } from "@/components/companion/CompanionInventory";
import { getEvolutionInfo } from "@/lib/evolution";
import { sfx } from "@/lib/sfx";
import { haptic } from "@/lib/haptics";
import type { OrbMood } from "@/components/companion/AIAHOrb";

export function CompanionSetup() {
  const { mood, setMood, theme } = useMood();
  const { energy } = useEnergy();
  const [config, setCfg] = useState<CompanionConfig | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    const c = getCompanionConfig();
    setCfg(c);
    setDraftName(c.name);
  }, []);

  const persist = (patch: Partial<CompanionConfig>, flashLabel?: string) => {
    const next = setCompanionConfig(patch);
    setCfg(next);
    if (flashLabel) {
      setSavedFlash(flashLabel);
      setTimeout(() => setSavedFlash(null), 2200);
    }
  };

  const commitName = () => {
    const cleaned = draftName.trim() || "AIAH";
    persist({ name: cleaned, setupComplete: true }, `Name saved as ${cleaned}`);
    setDraftName(cleaned);
    setEditingName(false);
  };

  if (!config) return null;

  return (
    <div className={`relative flex flex-1 flex-col overflow-y-auto bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-lg px-4 py-8 md:px-8">

        {/* Orb hero */}
        <div className="flex flex-col items-center gap-4">
          <AIAHOrb mood={mood} size={160} energy={energy} />

          {/* Name display / edit */}
          {editingName ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full max-w-xs gap-2"
            >
              <Input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="AIAH"
                maxLength={20}
                className="rounded-2xl text-center text-lg font-semibold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setDraftName(config.name);
                    setEditingName(false);
                  }
                }}
              />
              <Button onClick={commitName} size="sm" className="rounded-2xl bg-[#1D9E75] hover:bg-[#178a64]">
                <Check className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <button
              onClick={() => {
                setDraftName(config.name);
                setEditingName(true);
              }}
              className="group flex items-center gap-2 transition-colors"
            >
              <h2 className={`text-2xl font-bold ${theme.text}`}>
                {config.name}
              </h2>
              <Pencil className={`h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60 ${theme.textMuted}`} />
            </button>
          )}

          <p className={`text-center text-sm ${theme.textMuted}`}>
            Tap the orb to interact. Hold to purr. Pet to make shy.
          </p>

          {/* Evolution stage badge */}
          {(() => {
            const evo = getEvolutionInfo();
            return (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {evo.emoji} {evo.label}
                </span>
                {evo.nextStageLevel && (
                  <span className={`text-[10px] ${theme.textMuted}`}>
                    Next at Lv.{evo.nextStageLevel}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Personality picker */}
        <section className="mt-8">
          <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
            Personality
          </label>
          <div className="mt-3 grid gap-2">
            {(Object.keys(VIBES) as CompanionVibe[]).map((v) => {
              const vibe = VIBES[v];
              const active = config.vibe === v;
              return (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => persist({ vibe: v }, `Personality: ${vibe.label}`)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-[#1D9E75] bg-emerald-50/80 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-950/30"
                      : "border-stone-200/60 bg-white/50 hover:bg-white/80 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-xl">{vibe.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${theme.text}`}>{vibe.label}</p>
                    <p className={`mt-0.5 text-xs ${theme.textMuted}`}>{vibe.desc}</p>
                  </div>
                  {active && <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Sound toggle */}
        <section className="mt-6">
          <button
            onClick={() =>
              persist(
                { soundEnabled: !config.soundEnabled },
                config.soundEnabled ? "Sounds off" : "Sounds on",
              )
            }
            className={`flex w-full items-center justify-between rounded-2xl border p-4 transition-all ${
              config.soundEnabled
                ? "border-[#1D9E75]/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/20"
                : "border-stone-200/60 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center gap-3">
              {config.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-[#1D9E75]" />
              ) : (
                <VolumeX className={`h-5 w-5 ${theme.textMuted}`} />
              )}
              <div className="text-left">
                <p className={`text-sm font-semibold ${theme.text}`}>Touch sounds</p>
                <p className={`text-xs ${theme.textMuted}`}>Purrs, chirps, and reaction sounds</p>
              </div>
            </div>
            <div
              className={`h-6 w-11 rounded-full transition-colors ${
                config.soundEnabled ? "bg-[#1D9E75]" : "bg-stone-300 dark:bg-stone-600"
              }`}
            >
              <motion.div
                className="h-5 w-5 rounded-full bg-white shadow-sm mt-0.5"
                animate={{ x: config.soundEnabled ? 22 : 3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </button>
        </section>

        {/* Inventory — Fridge + Closet */}
        <CompanionInventory
          energy={energy}
          onFed={(result) => {
            // Trigger orb reaction — happy mood + purr
            const newMood = (result.moodBoost as OrbMood) || "happy";
            setMood(newMood);
            sfx.purr();
            haptic("success");
          }}
        />

        <div className="h-24" />
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {savedFlash && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-10"
          >
            <div className="flex items-center gap-2 rounded-full bg-[#1D9E75] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_32px_-8px_rgba(29,158,117,0.6)]">
              <Check className="h-4 w-4" />
              {savedFlash}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
