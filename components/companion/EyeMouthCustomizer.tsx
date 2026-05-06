"use client";

import { motion } from "framer-motion";
import { Check, Lock, Eye, Smile } from "lucide-react";
import {
  type EyeStyle,
  type MouthStyle,
  type CompanionConfig,
} from "@/lib/companion-config";

const EYE_OPTIONS: { value: EyeStyle; label: string; preview: string }[] = [
  { value: "default", label: "Classic", preview: "👁️" },
  { value: "round", label: "Big Round", preview: "🔵" },
  { value: "cat", label: "Cat", preview: "🐱" },
  { value: "star", label: "Starry", preview: "⭐" },
  { value: "heart", label: "Heart", preview: "💗" },
  { value: "wink", label: "Wink", preview: "😉" },
  { value: "sleek", label: "Sleek", preview: "😎" },
];

const MOUTH_OPTIONS: { value: MouthStyle; label: string; preview: string }[] = [
  { value: "default", label: "Classic", preview: "😊" },
  { value: "smile", label: "Big Smile", preview: "😄" },
  { value: "cat", label: "Cat", preview: "🐱" },
  { value: "fangs", label: "Fangs", preview: "🧛" },
  { value: "wide", label: "Wide Grin", preview: "😁" },
  { value: "dot", label: "Dot", preview: "🤫" },
  { value: "smirk", label: "Smirk", preview: "😏" },
];

interface EyeMouthCustomizerProps {
  config: CompanionConfig;
  level: number;
  onSave: (patch: Partial<CompanionConfig>, flash?: string) => void;
  themeMuted: string;
  themeText: string;
}

export function EyeMouthCustomizer({ config, level, onSave, themeMuted, themeText }: EyeMouthCustomizerProps) {
  const eyesUnlocked = level >= 5;
  const mouthUnlocked = level >= 10;

  // Nothing to show if both locked
  if (!eyesUnlocked && !mouthUnlocked) {
    return (
      <section className="mt-6">
        <label className={`text-[11px] font-semibold uppercase tracking-wider ${themeMuted}`}>
          Customization
        </label>
        <div className="mt-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200/60 bg-white/30 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <Lock className={`h-4 w-4 ${themeMuted}`} />
            <div>
              <p className={`text-xs font-medium ${themeText}`}>Eye customization</p>
              <p className={`text-[10px] ${themeMuted}`}>Unlocks at Level 5</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200/60 bg-white/30 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <Lock className={`h-4 w-4 ${themeMuted}`} />
            <div>
              <p className={`text-xs font-medium ${themeText}`}>Mouth customization</p>
              <p className={`text-[10px] ${themeMuted}`}>Unlocks at Level 10</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-5">
      {/* Eyes — Level 5 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Eye className={`h-3.5 w-3.5 ${eyesUnlocked ? "text-violet-500" : themeMuted}`} />
          <label className={`text-[11px] font-semibold uppercase tracking-wider ${themeMuted}`}>
            Eyes {!eyesUnlocked && "(Level 5)"}
          </label>
          {!eyesUnlocked && <Lock className={`h-3 w-3 ${themeMuted}`} />}
        </div>
        {eyesUnlocked ? (
          <div className="grid grid-cols-4 gap-1.5">
            {EYE_OPTIONS.map((opt) => {
              const active = config.eyeStyle === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onSave({ eyeStyle: opt.value }, `Eyes: ${opt.label}`)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center transition-all ${
                    active
                      ? "border-violet-500 bg-violet-50/80 shadow-sm dark:border-violet-500/50 dark:bg-violet-950/30"
                      : "border-stone-200/60 bg-white/50 hover:bg-white/80 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {active && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-2.5 w-2.5 text-violet-500" />
                    </div>
                  )}
                  <span className="text-lg">{opt.preview}</span>
                  <span className={`text-[8px] font-medium leading-tight ${themeText}`}>
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200/60 bg-white/30 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <Lock className={`h-4 w-4 ${themeMuted}`} />
            <p className={`text-[10px] ${themeMuted}`}>Reach Level 5 to customize eyes</p>
          </div>
        )}
      </div>

      {/* Mouth — Level 10 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Smile className={`h-3.5 w-3.5 ${mouthUnlocked ? "text-rose-500" : themeMuted}`} />
          <label className={`text-[11px] font-semibold uppercase tracking-wider ${themeMuted}`}>
            Mouth {!mouthUnlocked && "(Level 10)"}
          </label>
          {!mouthUnlocked && <Lock className={`h-3 w-3 ${themeMuted}`} />}
        </div>
        {mouthUnlocked ? (
          <div className="grid grid-cols-4 gap-1.5">
            {MOUTH_OPTIONS.map((opt) => {
              const active = config.mouthStyle === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onSave({ mouthStyle: opt.value }, `Mouth: ${opt.label}`)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center transition-all ${
                    active
                      ? "border-rose-500 bg-rose-50/80 shadow-sm dark:border-rose-500/50 dark:bg-rose-950/30"
                      : "border-stone-200/60 bg-white/50 hover:bg-white/80 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {active && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-2.5 w-2.5 text-rose-500" />
                    </div>
                  )}
                  <span className="text-lg">{opt.preview}</span>
                  <span className={`text-[8px] font-medium leading-tight ${themeText}`}>
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200/60 bg-white/30 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <Lock className={`h-4 w-4 ${themeMuted}`} />
            <p className={`text-[10px] ${themeMuted}`}>Reach Level 10 to customize mouth</p>
          </div>
        )}
      </div>
    </section>
  );
}
