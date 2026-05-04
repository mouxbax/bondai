"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  Flame,
  AlertTriangle,
  CalendarDays,
  Dumbbell,
  Wallet,
  ShoppingCart,
  CheckSquare,
  Send,
  Loader2,
  Zap,
  Lock,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useEnergy } from "@/hooks/useEnergy";
import { useMood } from "@/lib/mood-context";
import { LifeOsForm } from "@/components/life-os/LifeOsForm";
import type { LifeOsData } from "@/lib/life-os/types";
import { WeekProgress } from "@/components/life-os/WeekProgress";
import { ExportPlanButton } from "@/components/life-os/ExportPlanButton";
import { HabitTracker } from "@/components/life-os/HabitTracker";
import { MiniJournal } from "@/components/life-os/MiniJournal";

// ─── Sub-page grid tiles ─────────────────────────────────────────────
const planTiles = [
  {
    id: "schedule",
    icon: CalendarDays,
    title: "Weekly Schedule",
    subtitle: "Day-by-day plan",
    href: "/plans/schedule",
    color: "#4A7FA7",
    bg: "from-blue-100 to-sky-50",
    darkBg: "from-blue-900/30 to-sky-950/20",
  },
  {
    id: "workout",
    icon: Dumbbell,
    title: "Workouts",
    subtitle: "Training splits",
    href: "/plans/workout",
    color: "#EF4444",
    bg: "from-rose-100 to-red-50",
    darkBg: "from-rose-900/30 to-red-950/20",
  },
  {
    id: "finances",
    icon: Wallet,
    title: "Monthly Finances",
    subtitle: "Budget & debt",
    href: "/plans/finances",
    color: "#F5B945",
    bg: "from-amber-100 to-yellow-50",
    darkBg: "from-amber-900/30 to-yellow-950/20",
  },
  {
    id: "grocery",
    icon: ShoppingCart,
    title: "Grocery List",
    subtitle: "This week's haul",
    href: "/plans/grocery",
    color: "#F97316",
    bg: "from-orange-100 to-amber-50",
    darkBg: "from-orange-900/30 to-amber-950/20",
  },
  {
    id: "todo",
    icon: CheckSquare,
    title: "To Do",
    subtitle: "Tasks & deadlines",
    href: "/focus",
    color: "#1D9E75",
    bg: "from-emerald-100 to-green-50",
    darkBg: "from-emerald-900/30 to-green-950/20",
  },
  {
    id: "outreach",
    icon: Send,
    title: "Income & Outreach",
    subtitle: "DMs, posts, follow-ups",
    href: "/plans/outreach",
    color: "#3B82F6",
    bg: "from-blue-100 to-indigo-50",
    darkBg: "from-blue-900/30 to-indigo-950/20",
  },
];

function formatCooldown(nextAvailable: string): string {
  const diff = new Date(nextAvailable).getTime() - Date.now();
  if (diff <= 0) return "now";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const min = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${min}m`;
}

export default function LifeOsHubPage() {
  const { plan, loading, refetch } = useWeeklyPlan();
  const { energy, planCooldown } = useEnergy();
  const { theme } = useMood();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [profile, setProfile] = useState<LifeOsData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/life-os", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      setProfile(j.profile ?? {});
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const hasProfile = profile && Object.keys(profile).length > 0;

  const generate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/life-os/generate", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Generation failed.");
      refetch();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const weekRange = plan
    ? (() => {
        const start = new Date(plan.weekStart);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 6);
        const fmt = (d: Date) =>
          d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return `${fmt(start)} – ${fmt(end)}`;
      })()
    : "";

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 space-y-6">

        {/* ─── LIFE OS PROFILE (collapsible) ─────────────────── */}
        {!profileLoading && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-white/[0.03] px-4 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-stone-500" />
                <span className={`text-sm font-medium ${theme.text}`}>Life OS Profile</span>
                {!hasProfile && (
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    Setup required
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-stone-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <LifeOsForm initial={profile ?? {}} onSaved={(d) => setProfile(d)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* ─── GENERATE BUTTON (prominent, with 7-day cooldown) ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {!planCooldown.canGenerate && planCooldown.nextAvailableAt ? (
            <div className="flex items-center justify-between rounded-2xl border border-stone-200/60 dark:border-stone-800 bg-gradient-to-r from-stone-50/80 to-stone-100/40 dark:from-white/[0.04] dark:to-white/[0.02] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/60 dark:bg-white/10">
                  <Lock className="h-4 w-4 text-stone-500" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${theme.text}`}>Next plan available in</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCooldown(planCooldown.nextAvailableAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                {energy}%
              </div>
            </div>
          ) : (
            <Button
              onClick={generate}
              disabled={generating || !hasProfile || energy <= 13}
              className="w-full rounded-2xl h-14 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              {generating
                ? "Generating your plan..."
                : plan
                  ? "Regenerate weekly plan"
                  : hasProfile
                    ? "Generate my plan"
                    : "Fill profile first"}
            </Button>
          )}
          {genError && (
            <p className="mt-2 text-xs text-rose-500">{genError}</p>
          )}
        </motion.section>

        {/* ─── THIS WEEK hero ─────────────────────────────────── */}
        {plan && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-950/20 p-5"
          >
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme.textMuted}`}>
              This week
            </p>
            {weekRange && (
              <p className={`text-xs mt-0.5 ${theme.textMuted}`}>{weekRange}</p>
            )}
            {plan.weekTheme && (
              <h1 className={`text-lg font-semibold mt-1.5 flex items-center gap-2 ${theme.text}`}>
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{plan.weekTheme}</span>
              </h1>
            )}
          </motion.section>
        )}

        {plan && (
          <>
            {/* ─── WEEKLY PROGRESS ─────────────────────────────── */}
            <WeekProgress />

            {/* ─── TOP PRIORITIES ──────────────────────────────── */}
            {plan.topPriorities && plan.topPriorities.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <h2 className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
                    Top priorities
                  </h2>
                </div>
                <ol className="space-y-2">
                  {plan.topPriorities.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-white/[0.03] px-4 py-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        {i + 1}
                      </span>
                      <span className={`text-sm ${theme.text}`}>{p}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3">
                  <ExportPlanButton data={plan} />
                </div>
              </motion.section>
            )}

            {/* ─── HABIT TRACKER ──────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <h2 className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
                  Habit tracker
                </h2>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-white/[0.03] p-4">
                <HabitTracker />
              </div>
            </motion.section>

            {/* ─── MINI JOURNAL ───────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme.textMuted}`}>
                Journal
              </h2>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-white/[0.03] p-4">
                <MiniJournal />
              </div>
            </motion.section>

            {/* ─── WARNINGS ───────────────────────────────────── */}
            {plan.warnings && plan.warnings.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {plan.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-amber-800 dark:text-amber-300">{w}</span>
                  </div>
                ))}
              </motion.section>
            )}
          </>
        )}

        {/* ─── PLAN SECTIONS GRID ───────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {planTiles.map((tile, i) => {
              const Icon = tile.icon;
              return (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link href={tile.href}>
                    <div
                      className={`relative h-full min-h-[100px] overflow-hidden rounded-2xl border border-stone-100/80 bg-gradient-to-br ${tile.bg} dark:border-stone-800/50 dark:${tile.darkBg} p-3.5 shadow-sm transition-shadow hover:shadow-md`}
                    >
                      <motion.div
                        className="absolute -right-3 -top-3 opacity-15"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Icon className="h-14 w-14" style={{ color: tile.color }} />
                      </motion.div>
                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${tile.color}25` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: tile.color }} />
                        </div>
                        <div className="mt-2">
                          <h3 className={`text-xs font-semibold ${theme.text}`}>{tile.title}</h3>
                          <p className={`text-[10px] ${theme.textMuted}`}>{tile.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ─── Sunday review link ─────────────────────────────── */}
        {plan?.reflections && plan.reflections.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/30 p-4"
          >
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme.textMuted}`}>
              Sunday review
            </h3>
            <ul className="space-y-1.5">
              {plan.reflections.map((r, i) => (
                <li key={i} className={`text-sm flex gap-2 ${theme.text}`}>
                  <span className="text-stone-400 shrink-0">?</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ─── Motivational footer ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-6"
        >
          <p className={`text-xs italic ${theme.textMuted}`}>
            By following this plan, you will unleash the superhuman in you.
          </p>
          <p className="text-[10px] text-stone-400 mt-1">
            Powered by AIAH
          </p>
        </motion.div>

        <div className="h-16" />
      </div>
    </div>
  );
}
