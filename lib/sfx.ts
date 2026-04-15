"use client";

/**
 * Lightweight WebAudio-based sound effects.
 * No audio assets to download — everything is synthesized.
 * Respects a global on/off flag stored in localStorage (`aiah-sfx`, default "1").
 */

const PREF_KEY = "aiah-sfx";

let ctxRef: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctxRef && ctxRef.state !== "closed") return ctxRef;
  const Ctor =
    (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctxRef = new Ctor();
    return ctxRef;
  } catch {
    return null;
  }
}

export function sfxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PREF_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSfxEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREF_KEY, on ? "1" : "0");
  } catch {
    /* no-op */
  }
}

interface Note {
  freq: number;
  dur: number; // seconds
  delay: number; // seconds from start
  type?: OscillatorType;
  gain?: number;
}

function play(notes: Note[]): void {
  if (!sfxEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    // Resume on first user gesture — most calls are from user events so this is fine.
    ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime;
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.value = n.freq;
    const peak = n.gain ?? 0.12;
    gain.gain.setValueAtTime(0.0001, now + n.delay);
    gain.gain.exponentialRampToValueAtTime(peak, now + n.delay + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + n.delay);
    osc.stop(now + n.delay + n.dur + 0.02);
  }
}

export const sfx = {
  /** Subtle confirmation — message sent, item checked */
  tap: () => play([{ freq: 660, dur: 0.08, delay: 0 }]),
  /** Quest or habit complete — two cheerful ascending pings */
  pop: () =>
    play([
      { freq: 523, dur: 0.12, delay: 0, type: "triangle" },
      { freq: 784, dur: 0.14, delay: 0.08, type: "triangle" },
    ]),
  /** XP gain — a short crystalline rising arp */
  xp: () =>
    play([
      { freq: 659, dur: 0.1, delay: 0, type: "sine", gain: 0.1 },
      { freq: 880, dur: 0.12, delay: 0.06, type: "sine", gain: 0.1 },
      { freq: 1319, dur: 0.18, delay: 0.13, type: "sine", gain: 0.08 },
    ]),
  /** Achievement / level up — majestic 4-note fanfare */
  fanfare: () =>
    play([
      { freq: 523, dur: 0.18, delay: 0, type: "triangle", gain: 0.13 },
      { freq: 659, dur: 0.18, delay: 0.12, type: "triangle", gain: 0.13 },
      { freq: 784, dur: 0.22, delay: 0.24, type: "triangle", gain: 0.13 },
      { freq: 1047, dur: 0.38, delay: 0.38, type: "sine", gain: 0.15 },
    ]),
  /** Streak milestone — warm bell */
  streak: () =>
    play([
      { freq: 440, dur: 0.35, delay: 0, type: "sine", gain: 0.14 },
      { freq: 880, dur: 0.25, delay: 0.04, type: "sine", gain: 0.09 },
    ]),
  /** Error / blocked — low muted thud */
  error: () =>
    play([{ freq: 140, dur: 0.22, delay: 0, type: "sawtooth", gain: 0.09 }]),
  /** Soft "ching" — a gentle chime for modal steps / ritual beats */
  chime: () =>
    play([
      { freq: 1175, dur: 0.55, delay: 0, type: "sine", gain: 0.08 },
      { freq: 1760, dur: 0.35, delay: 0.01, type: "sine", gain: 0.05 },
    ]),
};
