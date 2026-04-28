"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageCircle, Wind, Sparkles } from "lucide-react";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { useMood } from "@/lib/mood-context";
import { MoodSelector } from "@/components/dashboard/MoodSelector";
import { LifeModules } from "@/components/dashboard/LifeModules";
import { NudgeCards } from "@/components/dashboard/NudgeCards";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { LifeScoreRing } from "@/components/gamification/LifeScoreRing";
import { QuestsList } from "@/components/gamification/QuestsList";
import { useEffect, useState } from "react";
import { useEnergy } from "@/hooks/useEnergy";

interface CompanionHomeProps {
  firstName?: string | null;
}

function getGreeting(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late night";
}

const moodLines: Record<string, string[]> = {
  calm: ["I'm right here with you.", "Take a slow breath. I'm listening.", "A quiet moment. What's on your mind?"],
  happy: ["Love the energy today.", "Let's make it count.", "Ready when you are."],
  focused: ["Locked in. Let's go.", "Deep work mode. I've got you.", "Tell me the one thing that matters now."],
  energetic: ["Big energy, let's channel it.", "What are we crushing today?", "Momentum is a gift. Use it."],
  tender: ["Go easy on yourself.", "I'm here, no pressure.", "Small steps count."],
  anxious: ["Breathe with me. You're safe.", "One thing at a time.", "Let's slow things down together."],
  sad: ["I'm here. No rush.", "Heavy days happen. Still here.", "You don't have to figure it all out right now."],
};

export function CompanionHome({ firstName }: CompanionHomeProps) {
  const { mood, theme, isDay } = useMood();
  const { energy } = useEnergy();
  const [hour, setHour] = useState(12);
  const [line, setLine] = useState("I'm here.");

  useEffect(() => {
    const h = new Date().getHours();
    setHour(h);
    const lines = moodLines[mood] ?? moodLines.calm;
    setLine(lines[Math.floor(Math.random() * lines.length)]);
  }, [mood]);

  const greeting = getGreeting(hour);
  const name = firstName ? `, ${firstName}` : "";

  return (
    <div
      className={`relative flex min-h-full flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo} transition-colors duration-1000`}
    >
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: theme.accent }}
          animate={{ x: [0, 30, -20, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 top-40 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: theme.accentSoft }}
          animate={{ x: [0, -40, 20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        {/* Orb hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 pt-4"
        >
          <div data-tutorial="orb">
            <AIAHOrb mood={mood} size={180} energy={energy} showFace />
          </div>
          <p className={`text-[10px] tabular-nums ${theme.textMuted}`}>
            {energy <= 0 ? "Sleeping... recharging" : `${energy}% energy`}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center"
          >
            <p className={`text-xs uppercase tracking-widest ${theme.textMuted}`}>
              {greeting}
              {name}
            </p>
            <h1 className={`mt-1 text-2xl font-semibold ${theme.text}`}>{line}</h1>
            <p className={`mt-1 text-xs ${theme.textMuted}`}>
              {isDay ? "Your day. Your system. Your potential." : "Recovery is part of the system."}
            </p>
          </motion.div>
          <div data-tutorial="mood-selector">
            <MoodSelector />
          </div>

          {/* Primary quick actions - the three things you can always do */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            data-tutorial="quick-actions"
            className="mt-2 grid w-full max-w-md grid-cols-3 gap-2"
          >
            <Link
              href="/talk?voice=1"
              className="group flex flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-emerald-500 p-3 text-white shadow-[0_8px_24px_-8px_rgba(29,158,117,0.55)] transition-transform hover:scale-[1.03]"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs font-semibold">Talk</span>
            </Link>
            <Link
              href="/breathe"
              className="group flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.05] p-3 text-stone-200 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:scale-[1.03] hover:bg-white/[0.08]"
            >
              <Wind className="h-5 w-5 text-teal-400" />
              <span className="text-xs font-semibold">Breathe</span>
            </Link>
            <Link
              href="/focus"
              className="group flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.05] p-3 text-stone-200 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:scale-[1.03] hover:bg-white/[0.08]"
            >
              <Sparkles className="h-5 w-5 text-violet-400" />
              <span className="text-xs font-semibold">Plan</span>
            </Link>
          </motion.div>
        </motion.section>

        {/* Life Score + Level */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid gap-3 sm:grid-cols-[auto_1fr]"
        >
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <LifeScoreRing size={100} />
          </div>
          <LevelBadge />
        </motion.div>

        {/* Daily Quests */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <QuestsList />
        </motion.div>

        {/* Nudges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <NudgeCards />
        </motion.div>

        {/* Life modules grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <h2 className={`mb-3 text-sm font-semibold ${theme.text}`}>Your command center</h2>
          <LifeModules />
        </motion.div>

        <div className="h-24" />
      </div>
    </div>
  );
}
