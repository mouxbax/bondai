"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind, Volume2, VolumeX } from "lucide-react";
import { AIAHOrb } from "@/components/companion/AIAHOrb";
import { useMood } from "@/lib/mood-context";
import { awardXP, checkAchievements } from "@/lib/gamification";

type Phase = "intro" | "inhale" | "hold" | "exhale" | "rest" | "done";

interface Pattern {
  id: string;
  name: string;
  desc: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  cycles: number;
}

interface SessionDuration {
  id: string;
  label: string;
  seconds: number;
}

const PATTERNS: Pattern[] = [
  {
    id: "box",
    name: "Box breathing",
    desc: "4 · 4 · 4 · 4 - calm focus",
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
    cycles: 6,
  },
  {
    id: "478",
    name: "4-7-8 relax",
    desc: "Slow the nervous system",
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 0,
    cycles: 4,
  },
  {
    id: "energize",
    name: "Energize",
    desc: "Quick breath for focus",
    inhale: 4,
    hold: 2,
    exhale: 4,
    rest: 0,
    cycles: 8,
  },
];

const DURATIONS: SessionDuration[] = [
  { id: "1m", label: "1 min", seconds: 60 },
  { id: "5m", label: "5 min", seconds: 300 },
  { id: "10m", label: "10 min", seconds: 600 },
];

const END_QUOTES = {
  soft: [
    "A calm breath is a quiet promise to yourself.",
    "You met yourself with care. That matters.",
    "Breathe gently. You are worth this softness.",
  ],
  aware: [
    "Awareness starts with one honest breath.",
    "You are not behind - you are here.",
    "Notice this moment. It is enough.",
  ],
  playful: [
    "You just turned oxygen into emotional Wi-Fi.",
    "Breath check complete. Nervous system now slightly more fabulous.",
    "Gold star for your lungs and your heart.",
  ],
};

interface BreathingExerciseProps {
  open: boolean;
  onClose: () => void;
}

function phaseLabel(p: Phase): string {
  if (p === "inhale") return "Breathe in";
  if (p === "hold") return "Hold";
  if (p === "exhale") return "Breathe out";
  if (p === "rest") return "Rest";
  if (p === "done") return "Well done";
  return "Ready?";
}

function formatMMSS(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ensureCtx(ctxRef: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  try {
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Start a smooth 4-bar evolving meditation pad.
 * Returns a stop function.
 */
function startMeditationPad(ctx: AudioContext, dest: AudioNode): () => void {
  const progression = [
    [174.61, 207.65, 261.63, 349.23], // Fm
    [174.61, 207.65, 261.63, 349.23], // Fm
    [174.61, 207.65, 261.63, 349.23], // Fm
    [174.61, 207.65, 261.63, 349.23], // Fm
  ];
  const barSeconds = 4;
  const master = ctx.createGain();
  master.gain.value = 0.18;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2100;
  filter.Q.value = 0.5;
  master.connect(filter);
  filter.connect(dest);

  const stops: Array<() => void> = [];
  const oscillators: OscillatorNode[] = [];
  const voiceGains: GainNode[] = [];
  progression[0].forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === progression[0].length - 1 ? "triangle" : "sine";
    osc.frequency.value = f;
    osc.detune.value = (i - 1.5) * 2;
    const g = ctx.createGain();
    g.gain.value = i === progression[0].length - 1 ? 0.1 : 0.14;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06 + i * 0.04;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    osc.connect(g);
    g.connect(master);
    osc.start();
    lfo.start();
    stops.push(() => {
      try {
        osc.stop();
        lfo.stop();
      } catch {}
    });
    oscillators.push(osc);
    voiceGains.push(g);
  });

  let idx = 0;
  const chordLooper = window.setInterval(() => {
    idx = (idx + 1) % progression.length;
    const next = progression[idx];
    const now = ctx.currentTime;
    oscillators.forEach((osc, i) => {
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(osc.frequency.value, now);
      osc.frequency.linearRampToValueAtTime(next[i], now + 1.3);
    });
    voiceGains.forEach((g) => {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0.16, now + 0.6);
      g.gain.linearRampToValueAtTime(0.12, now + barSeconds - 0.1);
    });
  }, barSeconds * 1000);
  stops.push(() => window.clearInterval(chordLooper));

  return () => {
    stops.forEach((s) => s());
    try {
      master.disconnect();
      filter.disconnect();
    } catch {}
  };
}

/**
 * A "breath" whoosh sound - filtered pink noise that swells and fades.
 */
function playBreathSound(ctx: AudioContext, dest: AudioNode, kind: "in" | "out", duration: number) {
  try {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = kind === "in" ? 1400 : 700;
    filter.Q.value = 1.1;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.35);
    gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + duration + 0.1);
  } catch {
    /* ignore */
  }
}

/**
 * Soft chime for hold or completion.
 */
function playChime(ctx: AudioContext, dest: AudioNode, freq: number) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 1.3);
  } catch {}
}

export function BreathingExercise({ open, onClose }: BreathingExerciseProps) {
  const { theme, mood } = useMood();
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [duration, setDuration] = useState<SessionDuration>(DURATIONS[1]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [cycle, setCycle] = useState(0);
  const [count, setCount] = useState(0);
  const [remainingSession, setRemainingSession] = useState(DURATIONS[1].seconds);
  const [finalQuote, setFinalQuote] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdCueRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const padStopRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);
  const endAtRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countRef.current) clearInterval(countRef.current);
    if (sessionRef.current) clearInterval(sessionRef.current);
    if (holdCueRef.current) clearTimeout(holdCueRef.current);
    timerRef.current = null;
    countRef.current = null;
    sessionRef.current = null;
    holdCueRef.current = null;
  }, []);

  const stopPad = useCallback(() => {
    if (padStopRef.current) {
      padStopRef.current();
      padStopRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      cleanup();
      stopPad();
      cancelledRef.current = true;
      setPhase("intro");
      setCycle(0);
      setCount(0);
      setRemainingSession(duration.seconds);
      setFinalQuote("");
      completedRef.current = false;
    } else {
      cancelledRef.current = false;
    }
  }, [open, cleanup, duration.seconds, stopPad]);

  const pickEndQuote = useCallback(() => {
    const personality =
      mood === "happy" || mood === "energetic"
        ? "playful"
        : mood === "anxious" || mood === "sad" || mood === "tender"
          ? "soft"
          : "aware";
    const pool = END_QUOTES[personality];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [mood]);

  const finishSession = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    cleanup();
    stopPad();
    setCount(0);
    setPhase("done");
    setFinalQuote(pickEndQuote());
    if (soundOn) {
      const ctx = ensureCtx(audioRef);
      if (ctx) {
        playChime(ctx, ctx.destination, 523.25);
        setTimeout(() => playChime(ctx, ctx.destination, 659.25), 250);
        setTimeout(() => playChime(ctx, ctx.destination, 783.99), 500);
      }
    }
    awardXP("mood_log");
    // Recharge orb energy after breathing session
    fetch("/api/energy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "breathing" }),
    }).catch(() => {});
    // Award coins for breathing session
    fetch("/api/coins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "breathingSession" }),
    }).catch(() => {});
    checkAchievements();
  }, [cleanup, pickEndQuote, soundOn, stopPad]);

  // Start/stop meditation pad when session is active
  useEffect(() => {
    if (!open) return;
    const shouldPlay = soundOn && (phase !== "intro" && phase !== "done");
    if (shouldPlay && !padStopRef.current) {
      const ctx = ensureCtx(audioRef);
      if (ctx) {
        padStopRef.current = startMeditationPad(ctx, ctx.destination);
      }
    } else if (!shouldPlay && padStopRef.current) {
      stopPad();
    }
  }, [open, soundOn, phase, stopPad]);

  const runPhase = useCallback(
    (next: Phase, duration: number, onComplete: () => void) => {
      if (cancelledRef.current || completedRef.current) return;
      const remainingMs = endAtRef.current - Date.now();
      const phaseDuration = Math.max(0, Math.min(duration, Math.ceil(remainingMs / 1000)));
      if (phaseDuration <= 0) {
        finishSession();
        return;
      }
      setPhase(next);
      setCount(phaseDuration);
      if (soundOn) {
        const ctx = ensureCtx(audioRef);
        if (ctx) {
          if (next === "inhale") playBreathSound(ctx, ctx.destination, "in", phaseDuration);
          else if (next === "exhale") playBreathSound(ctx, ctx.destination, "out", phaseDuration);
          else if (next === "hold") playChime(ctx, ctx.destination, 523.25);
          if (next === "hold" && phaseDuration >= 2) {
            holdCueRef.current = setTimeout(() => {
              if (!cancelledRef.current && !completedRef.current) {
                playChime(ctx, ctx.destination, 659.25);
              }
            }, Math.max(300, (phaseDuration - 0.4) * 1000));
          }
        }
      }
      countRef.current = setInterval(() => {
        setCount((c) => {
          if (c <= 1) {
            if (countRef.current) clearInterval(countRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      timerRef.current = setTimeout(() => {
        if (countRef.current) clearInterval(countRef.current);
        if (holdCueRef.current) clearTimeout(holdCueRef.current);
        if (!cancelledRef.current) onComplete();
      }, phaseDuration * 1000);
    },
    [finishSession, soundOn],
  );

  const runCycle = useCallback(
    (i: number) => {
      if (cancelledRef.current || completedRef.current) return;
      if (Date.now() >= endAtRef.current) {
        finishSession();
        return;
      }
      setCycle(i + 1);
      runPhase("inhale", pattern.inhale, () => {
        if (pattern.hold > 0) {
          runPhase("hold", pattern.hold, () => {
            runPhase("exhale", pattern.exhale, () => {
              if (pattern.rest > 0) {
                runPhase("rest", pattern.rest, () => runCycle(i + 1));
              } else {
                runCycle(i + 1);
              }
            });
          });
        } else {
          runPhase("exhale", pattern.exhale, () => {
            if (pattern.rest > 0) {
              runPhase("rest", pattern.rest, () => runCycle(i + 1));
            } else {
              runCycle(i + 1);
            }
          });
        }
      });
    },
    [finishSession, pattern, runPhase],
  );

  const startSession = () => {
    cleanup();
    cancelledRef.current = false;
    completedRef.current = false;
    // Unlock audio on user gesture
    ensureCtx(audioRef);
    setCycle(0);
    setFinalQuote("");
    setRemainingSession(duration.seconds);
    endAtRef.current = Date.now() + duration.seconds * 1000;
    sessionRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemainingSession(remaining);
      if (remaining <= 0) finishSession();
    }, 300);
    runCycle(0);
  };

  const handleClose = () => {
    cancelledRef.current = true;
    cleanup();
    stopPad();
    onClose();
  };

  const orbScale =
    phase === "inhale"
      ? 1.4
      : phase === "hold"
        ? 1.4
        : phase === "exhale"
          ? 0.7
          : phase === "rest"
            ? 0.7
            : phase === "done"
              ? 1
              : 1;

  const orbDuration = phase === "inhale" ? pattern.inhale : phase === "exhale" ? pattern.exhale : 0.5;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className={`fixed inset-0 z-[160] flex flex-col items-center justify-between bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo} backdrop-blur-2xl`}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
              style={{ background: theme.accent }}
              animate={{ scale: phase === "inhale" ? 1.3 : phase === "exhale" ? 0.85 : 1 }}
              transition={{ duration: orbDuration, ease: "easeInOut" }}
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex w-full items-center justify-between px-6 pt-6 md:pt-8">
            <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-widest ${theme.textMuted}`}>
              <Wind className="h-3 w-3" />
              Breathing
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundOn((s) => !s)}
                className="rounded-full bg-white/60 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-stone-900/60 dark:hover:bg-stone-900"
                aria-label={soundOn ? "Mute sound" : "Unmute sound"}
                title={soundOn ? "Sound on" : "Sound off"}
              >
                {soundOn ? (
                  <Volume2 className="h-5 w-5 text-[#1D9E75]" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="rounded-full bg-white/60 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-stone-900/60 dark:hover:bg-stone-900"
                aria-label="Close breathing"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {phase === "intro" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 px-6"
              >
                <AIAHOrb mood={mood} size={180} />
                <h2 className={`text-center text-2xl font-semibold ${theme.text}`}>
                  It is your time to take a pause from chaos and breathe...
                </h2>
                <p className={`max-w-sm text-center text-sm ${theme.textMuted}`}>
                  Choose a technique and session length. A smooth pad will play while I guide your breath.
                </p>
                <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
                  {DURATIONS.map((d) => {
                    const active = duration.id === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          setDuration(d);
                          setRemainingSession(d.seconds);
                        }}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                          active
                            ? "bg-[#1D9E75] text-white shadow-[0_8px_24px_-8px_rgba(29,158,117,0.6)]"
                            : "bg-white/60 text-stone-700 backdrop-blur dark:bg-stone-900/40 dark:text-stone-300"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex w-full max-w-md flex-col gap-2">
                  {PATTERNS.map((p) => {
                    const active = pattern.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPattern(p)}
                        className={`rounded-2xl p-4 text-left transition-all ${
                          active
                            ? "bg-[#1D9E75] text-white shadow-[0_8px_24px_-8px_rgba(29,158,117,0.6)]"
                            : "bg-white/60 text-stone-700 backdrop-blur dark:bg-stone-900/40 dark:text-stone-300"
                        }`}
                      >
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className={`text-xs ${active ? "text-white/80" : "text-stone-500"}`}>
                          {p.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={startSession}
                  className="mt-2 rounded-full bg-[#1D9E75] px-10 py-4 text-base font-semibold text-white shadow-[0_12px_32px_-8px_rgba(29,158,117,0.6)]"
                >
                  Start
                </motion.button>
              </motion.div>
            ) : phase === "done" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <AIAHOrb mood="happy" size={200} />
                <h2 className={`text-center text-3xl font-semibold ${theme.text}`}>Nicely done</h2>
                <p className={`max-w-sm text-center text-sm ${theme.textMuted}`}>
                  {finalQuote || "Notice your breath. Notice yourself."}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPhase("intro");
                      setCycle(0);
                      setCount(0);
                    }}
                    className="rounded-full bg-white/60 px-6 py-3 text-sm font-medium text-stone-700 backdrop-blur dark:bg-stone-900/60 dark:text-stone-300"
                  >
                    Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-[#1D9E75] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(29,158,117,0.6)]"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-8">
                {/* Breathing orb */}
                <motion.div
                  animate={{ scale: orbScale }}
                  transition={{ duration: orbDuration, ease: [0.45, 0, 0.55, 1] }}
                >
                  <AIAHOrb mood={mood} size={200} />
                </motion.div>

                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <p className={`text-3xl font-light tracking-wide ${theme.text}`}>
                    {phaseLabel(phase)}
                  </p>
                  <p className="text-6xl font-extralight tabular-nums text-[#1D9E75]">
                    {count}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Time left {formatMMSS(remainingSession)} · Cycle {cycle}
                  </p>
                </motion.div>
              </div>
            )}
          </div>

          <div className="relative z-10 pb-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
