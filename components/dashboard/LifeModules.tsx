"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Target,
  Flame,
  Brain,
  Users,
  CheckCircle2,
  MessageCircleHeart,
  Sparkles,
  TrendingUp,
  Trophy,
  Clock,
  Bot,
  Wind,
} from "lucide-react";
import { useMood } from "@/lib/mood-context";

interface LifeModule {
  id: string;
  icon: typeof Heart;
  title: string;
  subtitle: string;
  href: string;
  color: string;
  bg: string;
  darkBg: string;
}

const modules: LifeModule[] = [
  {
    id: "mood",
    icon: Brain,
    title: "Mood",
    subtitle: "How are you feeling?",
    href: "/mood",
    color: "#8B5CF6",
    bg: "from-violet-100 to-purple-50",
    darkBg: "from-violet-900/30 to-purple-950/20",
  },
  {
    id: "habits",
    icon: Flame,
    title: "Habits",
    subtitle: "Daily rituals",
    href: "/habits",
    color: "#F97316",
    bg: "from-orange-100 to-amber-50",
    darkBg: "from-orange-900/30 to-amber-950/20",
  },
  {
    id: "goals",
    icon: Target,
    title: "Goals",
    subtitle: "What you're building",
    href: "/goals",
    color: "#1D9E75",
    bg: "from-emerald-100 to-green-50",
    darkBg: "from-emerald-900/30 to-green-950/20",
  },
  {
    id: "people",
    icon: Users,
    title: "People",
    subtitle: "Stay in touch",
    href: "/people",
    color: "#EC4899",
    bg: "from-pink-100 to-rose-50",
    darkBg: "from-pink-900/30 to-rose-950/20",
  },
  {
    id: "focus",
    icon: CheckCircle2,
    title: "Focus",
    subtitle: "Today's priorities",
    href: "/focus",
    color: "#0D7C6A",
    bg: "from-teal-100 to-cyan-50",
    darkBg: "from-teal-900/30 to-cyan-950/20",
  },
  {
    id: "chat",
    icon: MessageCircleHeart,
    title: "Talk",
    subtitle: "I'm here to listen",
    href: "/talk",
    color: "#4A7FA7",
    bg: "from-blue-100 to-sky-50",
    darkBg: "from-blue-900/30 to-sky-950/20",
  },
  {
    id: "breathe",
    icon: Wind,
    title: "Breathe",
    subtitle: "Reset in a minute",
    href: "/breathe",
    color: "#14B8A6",
    bg: "from-teal-100 to-emerald-50",
    darkBg: "from-teal-900/30 to-emerald-950/20",
  },
  {
    id: "coaching",
    icon: Sparkles,
    title: "Practice",
    subtitle: "Social scenarios",
    href: "/coaching",
    color: "#F5B945",
    bg: "from-amber-100 to-yellow-50",
    darkBg: "from-amber-900/30 to-yellow-950/20",
  },
  {
    id: "insights",
    icon: TrendingUp,
    title: "Insights",
    subtitle: "Your week in numbers",
    href: "/insights",
    color: "#06B6D4",
    bg: "from-cyan-100 to-sky-50",
    darkBg: "from-cyan-900/30 to-sky-950/20",
  },
  {
    id: "achievements",
    icon: Trophy,
    title: "Badges",
    subtitle: "Unlockables",
    href: "/achievements",
    color: "#F5B945",
    bg: "from-yellow-100 to-amber-50",
    darkBg: "from-yellow-900/30 to-amber-950/20",
  },
  {
    id: "timeline",
    icon: Clock,
    title: "Timeline",
    subtitle: "Your story",
    href: "/timeline",
    color: "#8B5CF6",
    bg: "from-indigo-100 to-violet-50",
    darkBg: "from-indigo-900/30 to-violet-950/20",
  },
  {
    id: "companion",
    icon: Bot,
    title: "Companion",
    subtitle: "Customize AIAH",
    href: "/companion",
    color: "#1D9E75",
    bg: "from-emerald-100 to-teal-50",
    darkBg: "from-emerald-900/30 to-teal-950/20",
  },
  {
    id: "score",
    icon: Heart,
    title: "Connection",
    subtitle: "Social health",
    href: "/score",
    color: "#EF4444",
    bg: "from-red-100 to-rose-50",
    darkBg: "from-red-900/30 to-rose-950/20",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      delay: i * 0.06,
      ease: "easeOut" as const,
    },
  }),
};

export function LifeModules() {
  const { theme } = useMood();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {modules.map((m, i) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={m.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <Link href={m.href}>
              <div
                className={`relative h-full min-h-[120px] overflow-hidden rounded-2xl border border-stone-100/80 bg-gradient-to-br ${m.bg} dark:border-stone-800/50 dark:${m.darkBg} p-4 shadow-sm transition-shadow hover:shadow-md`}
              >
                {/* Floating icon decoration */}
                <motion.div
                  className="absolute -right-4 -top-4 opacity-20"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 6 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon className="h-16 w-16" style={{ color: m.color }} />
                </motion.div>

                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${m.color}25` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: m.color }} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${theme.text}`}>{m.title}</h3>
                    <p className={`text-xs ${theme.textMuted}`}>{m.subtitle}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
