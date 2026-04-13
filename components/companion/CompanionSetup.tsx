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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Sparkles } from "lucide-react";

const ambientOptions: { id: CompanionConfig["ambientSound"]; label: string; emoji: string }[] = [
  { id: "none", label: "Silence", emoji: "🤫" },
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "ocean", label: "Ocean", emoji: "🌊" },
  { id: "forest", label: "Forest", emoji: "🌲" },
  { id: "lofi", label: "Lofi", emoji: "🎧" },
];

export function CompanionSetup() {
  const { mood, theme } = useMood();
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
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div className="flex flex-col items-center gap-3">
          <AIAHOrb mood={mood} size={140} />
          <motion.div
            key={config.name}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-center"
          >
            <h2 className={`text-3xl font-semibold ${theme.text}`}>
              Meet <span className="bg-gradient-to-r from-[#1D9E75] to-emerald-500 bg-clip-text text-transparent">{config.name}</span>
            </h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Your companion. Shape how it shows up for you.
            </p>
          </motion.div>
        </div>

        {/* Name */}
        <section className="mt-8 rounded-3xl bg-white/70 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
              Companion name
            </label>
            {!editingName && (
              <button
                onClick={() => {
                  setDraftName(config.name);
                  setEditingName(true);
                }}
                className="flex items-center gap-1.5 rounded-full bg-stone-100/80 px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>

          {editingName ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex gap-2"
            >
              <Input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="AIAH"
                maxLength={20}
                className="rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setDraftName(config.name);
                    setEditingName(false);
                  }
                }}
              />
              <Button onClick={commitName} className="rounded-2xl bg-[#1D9E75] hover:bg-[#178a64]">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraftName(config.name);
                  setEditingName(false);
                }}
                className="rounded-2xl"
              >
                Cancel
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2"
            >
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                <Sparkles className="h-4 w-4 text-[#1D9E75]" />
                <span className={`text-lg font-semibold ${theme.text}`}>{config.name}</span>
              </div>
              <p className={`text-xs ${theme.textMuted}`}>Tap edit to rename</p>
            </motion.div>
          )}
        </section>

        {/* Vibe */}
        <section className="mt-4 rounded-3xl bg-white/70 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
          <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
            Personality
          </label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(Object.keys(VIBES) as CompanionVibe[]).map((v) => {
              const vibe = VIBES[v];
              const active = config.vibe === v;
              return (
                <motion.button
                  key={v}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => persist({ vibe: v }, `Personality: ${vibe.label}`)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-[#1D9E75] bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
                      : "border-stone-200 bg-white/60 hover:bg-white dark:border-stone-700 dark:bg-stone-900/40 dark:hover:bg-stone-800"
                  }`}
                >
                  <div className="text-2xl">{vibe.emoji}</div>
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

        {/* Ambient sound */}
        <section className="mt-4 rounded-3xl bg-white/70 p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
              Ambient background
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ambientOptions.map((opt) => {
              const active = config.ambientSound === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() =>
                    persist(
                      { ambientSound: opt.id, soundEnabled: opt.id !== "none" },
                      opt.id === "none" ? "Ambient off" : `Playing ${opt.label.toLowerCase()}`,
                    )
                  }
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-[#1D9E75] bg-emerald-50 text-[#0f6b4f] dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className={`mt-2 text-[10px] ${theme.textMuted}`}>
            First tap anywhere to allow sound, then pick a vibe. Look for the speaker button bottom-left to mute.
          </p>
        </section>

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
