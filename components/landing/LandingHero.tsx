"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AIAHOrb, type OrbMood } from "@/components/companion/AIAHOrb";

const ORB_QUOTES = [
  "What if your goals had a system behind them?",
  "Discipline is just a habit you haven't built yet.",
  "Your schedule should work for you, not against you.",
  "Small wins compound into something massive.",
  "The best version of you is already scheduled.",
  "Structure is freedom in disguise.",
  "You don't need more time. You need a system.",
  "Every hour you plan is two hours you save.",
  "Your potential is not the problem. Your system is.",
  "Consistency beats motivation every single time.",
  "What gets tracked gets done.",
  "The gap between your goals and your life is a plan.",
  "Imagine waking up knowing exactly what to do.",
  "Your future self will thank your present discipline.",
  "Stop dreaming. Start scheduling.",
  "One system to rule your meals, money, and mindset.",
];

function shuffleQuotes() {
  const arr = [...ORB_QUOTES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const responses: Record<string, { text: string; mood: OrbMood }[]> = {
  default: [
    { text: "Your system is being built.", mood: "calm" },
    { text: "I'll remember everything. You just show up.", mood: "focused" },
    { text: "Goals without a system are just wishes. I'm the system.", mood: "energetic" },
  ],
};

function pickResponse(name: string) {
  const pool = responses.default;
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return { text: `${name}, ${entry.text.charAt(0).toLowerCase()}${entry.text.slice(1)}`, mood: entry.mood };
}

export function LandingContent() {
  const [phase, setPhase] = useState<"intro" | "input" | "reveal">("intro");
  const [name, setName] = useState("");
  const [orbMood, setOrbMood] = useState<OrbMood>("calm");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [orbHovered, setOrbHovered] = useState(false);
  const [orbQuote, setOrbQuote] = useState("");
  const quotePoolRef = useRef<string[]>([]);
  const quoteIndexRef = useRef(0);
  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getNextQuote = useCallback(() => {
    if (quotePoolRef.current.length === 0 || quoteIndexRef.current >= quotePoolRef.current.length) {
      quotePoolRef.current = shuffleQuotes();
      quoteIndexRef.current = 0;
    }
    const q = quotePoolRef.current[quoteIndexRef.current];
    quoteIndexRef.current += 1;
    return q;
  }, []);

  const handleOrbEnter = useCallback(() => {
    setOrbHovered(true);
    setOrbQuote(getNextQuote());
    quoteIntervalRef.current = setInterval(() => {
      setOrbQuote(getNextQuote());
    }, 3500);
  }, [getNextQuote]);

  const handleOrbLeave = useCallback(() => {
    setOrbHovered(false);
    if (quoteIntervalRef.current) {
      clearInterval(quoteIntervalRef.current);
      quoteIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
    };
  }, []);

  // Auto-advance from intro to input after 2s
  useEffect(() => {
    const t = setTimeout(() => setPhase("input"), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "input" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  const handleSubmitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const resp = pickResponse(trimmed);
    setOrbMood(resp.mood);
    setMessage(resp.text);
    setPhase("reveal");
  };

  const handleWaitlist = () => {
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <>
      {/* Nav */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute left-0 right-0 top-0 z-20 mx-auto flex max-w-5xl items-center justify-between px-6 py-6 safe-area-top"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}
      >
        <span className="text-lg font-semibold text-emerald-400">AIAH</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/blog"
            className="text-stone-400 transition-colors hover:text-stone-200"
          >
            Blog
          </Link>
        </nav>
      </motion.header>

      {/* Full-screen orb experience */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6" style={{ minHeight: "100dvh", minHeight: "-webkit-fill-available" }}>
        {/* Ambient glow — radial gradient to avoid square blur artifacts */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: `radial-gradient(circle, ${
                orbMood === "calm" ? "rgba(45,212,163,0.25)" :
                orbMood === "energetic" ? "rgba(251,146,60,0.25)" :
                orbMood === "focused" ? "rgba(52,211,153,0.25)" :
                "rgba(45,212,163,0.25)"
              } 0%, transparent 70%)`,
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <h1 className="sr-only">AIAH: AI Life System for Schedule, Budget, Goals, Training and Growth</h1>
          {/* Orb + hover quotes */}
          <div
            className="relative flex flex-col items-center"
            onMouseEnter={handleOrbEnter}
            onMouseLeave={handleOrbLeave}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="cursor-pointer"
            >
              <AIAHOrb mood={orbMood} size={200} />
            </motion.div>

            <AnimatePresence>
              {orbHovered && phase !== "reveal" && (
                <motion.p
                  key={orbQuote}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-12 w-72 text-center text-xs font-medium text-emerald-400/80"
                >
                  {orbQuote}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {/* Phase 1: Intro */}
            {phase === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-lg text-stone-400">
                  Something is waking up...
                </p>
              </motion.div>
            )}

            {/* Phase 2: Name input */}
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-sm text-stone-400">
                  Tell me your name.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitName();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={30}
                    className="w-48 rounded-xl border border-stone-300 bg-white/80 px-4 py-2.5 text-center text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-emerald-500/50 focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-stone-100 dark:placeholder-stone-600 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.06]"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-colors hover:bg-emerald-500/30"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Phase 3: Reveal */}
            {phase === "reveal" && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex flex-col items-center gap-6"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="max-w-md text-center text-xl font-medium leading-relaxed text-stone-100"
                >
                  {message}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="max-w-sm text-center text-sm leading-relaxed text-stone-500"
                >
                  Your schedule. Your budget. Your goals. Your training. One AI
                  that knows your full picture and turns ambition into a system
                  you actually follow.
                </motion.p>

                {/* Waitlist */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mt-2 w-full max-w-sm"
                >
                  {!submitted ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleWaitlist();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        required
                        className="flex-1 rounded-xl border border-stone-300 bg-white/80 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-emerald-500/50 focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-stone-100 dark:placeholder-stone-600 dark:focus:border-emerald-500/30 dark:focus:bg-white/[0.06]"
                      />
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="whitespace-nowrap rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(45,212,163,0.4)] transition-all hover:bg-emerald-400"
                      >
                        Get early access
                      </motion.button>
                    </form>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center"
                    >
                      <p className="text-sm font-medium text-emerald-400">
                        You&apos;re on the list.
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        We&apos;ll notify you when AIAH is ready.
                      </p>
                    </motion.div>
                  )}
                </motion.div>

                {/* Feature hints */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                  className="mt-4 flex flex-wrap justify-center gap-2"
                >
                  {["Smart schedule", "Meal plans", "Budget coaching", "Goal tracking", "Fitness plans", "Daily check-ins"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-stone-500"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="absolute bottom-0 flex flex-col items-center gap-3 pb-4 safe-area-bottom"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
        >
          <div className="flex items-center gap-4 text-xs text-stone-600">
            <Link href="/blog" className="transition-colors hover:text-stone-400">
              Blog
            </Link>
            <span className="text-stone-800">·</span>
            <a
              href="mailto:contact@aiah.app"
              className="transition-colors hover:text-stone-400"
            >
              Contact
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
}
