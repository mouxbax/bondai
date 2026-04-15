"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import { getCompanionConfig, setCompanionConfig } from "@/lib/companion-config";

/**
 * Procedural ambient sound player using Web Audio API.
 * No external assets - generates rain/ocean/forest/lofi tones on the fly.
 * Requires user gesture to start - auto-resumes on first interaction.
 */

type Ambient = "none" | "rain" | "ocean" | "forest" | "lofi";

function createNoise(ctx: AudioContext, type: "white" | "pink" | "brown") {
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "white") {
      output[i] = white;
    } else if (type === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function startAmbient(ctx: AudioContext, kind: Ambient, destination: AudioNode): (() => void) | null {
  if (kind === "none") return null;

  const stops: Array<() => void> = [];
  const nodes: AudioNode[] = [];

  if (kind === "rain") {
    // Layered rain: high-passed white noise + occasional droplet clicks
    const noise = createNoise(ctx, "white");
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    stops.push(() => {
      try {
        noise.stop();
      } catch {}
    });
    nodes.push(noise, filter, gain);
  } else if (kind === "ocean") {
    // Rolling waves: brown noise with LFO modulating the gain
    const noise = createNoise(ctx, "brown");
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    lfo.start();
    stops.push(() => {
      try {
        noise.stop();
        lfo.stop();
      } catch {}
    });
    nodes.push(noise, filter, gain, lfo, lfoGain);
  } else if (kind === "forest") {
    // Pink noise with gentle tone to feel like wind through trees
    const noise = createNoise(ctx, "pink");
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    stops.push(() => {
      try {
        noise.stop();
      } catch {}
    });
    nodes.push(noise, filter, gain);
  } else if (kind === "lofi") {
    // Ambient drone pad - multiple detuned sines for warmth
    const freqs = [164.81, 196, 246.94, 329.63]; // E3 G3 B3 E4 (E minor)
    const master = ctx.createGain();
    master.gain.value = 0.25;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;
    master.connect(filter);
    filter.connect(destination);
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "triangle" : "sine";
      osc.frequency.value = f;
      // Slow LFO on gain for movement
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.25;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1 + i * 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(master);
      osc.start();
      lfo.start();
      stops.push(() => {
        try {
          osc.stop();
          lfo.stop();
        } catch {}
      });
      nodes.push(osc, oscGain, lfo, lfoGain);
    });
    nodes.push(master, filter);
  }

  return () => {
    stops.forEach((s) => s());
    nodes.forEach((n) => {
      try {
        n.disconnect();
      } catch {}
    });
  };
}

export function AmbientPlayer() {
  const [enabled, setEnabled] = useState(false);
  const [ambient, setAmbient] = useState<Ambient>("none");
  const [needsGesture, setNeedsGesture] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const cfg = getCompanionConfig();
    setAmbient(cfg.ambientSound);
    setEnabled(cfg.soundEnabled && cfg.ambientSound !== "none");
  }, []);

  // Listen for config changes (from CompanionSetup)
  useEffect(() => {
    const i = setInterval(() => {
      const cfg = getCompanionConfig();
      setAmbient((prev) => (prev !== cfg.ambientSound ? cfg.ambientSound : prev));
      setEnabled((prev) =>
        prev !== (cfg.soundEnabled && cfg.ambientSound !== "none")
          ? cfg.soundEnabled && cfg.ambientSound !== "none"
          : prev,
      );
    }, 800);
    return () => clearInterval(i);
  }, []);

  const startPlayback = useCallback(() => {
    if (ambient === "none") return;
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
      const master = ctxRef.current.createGain();
      master.gain.value = 0.7;
      master.connect(ctxRef.current.destination);
      masterRef.current = master;
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    if (stopRef.current) stopRef.current();
    if (masterRef.current) {
      stopRef.current = startAmbient(ctx, ambient, masterRef.current);
    }
    setNeedsGesture(ctx.state !== "running");
  }, [ambient]);

  const stopPlayback = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || ambient === "none") {
      stopPlayback();
      return;
    }
    startPlayback();
    return () => stopPlayback();
  }, [enabled, ambient, startPlayback, stopPlayback]);

  // Auto-resume on any user gesture (fixes autoplay policy)
  useEffect(() => {
    if (!enabled || ambient === "none") return;
    const handler = () => {
      if (ctxRef.current && ctxRef.current.state !== "running") {
        void ctxRef.current.resume();
      }
      setNeedsGesture(false);
      if (!stopRef.current && ctxRef.current && masterRef.current) {
        stopRef.current = startAmbient(ctxRef.current, ambient, masterRef.current);
      }
    };
    window.addEventListener("click", handler);
    window.addEventListener("touchstart", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [enabled, ambient]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setCompanionConfig({ soundEnabled: next });
    if (next) {
      // Kick off immediately on user gesture
      setTimeout(startPlayback, 0);
    }
  };

  if (ambient === "none") return null;

  return (
    <>
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)] backdrop-blur-xl dark:bg-stone-900/80 dark:text-stone-300 md:bottom-6 md:left-6"
        aria-label={enabled ? "Mute ambient sound" : "Play ambient sound"}
      >
        {enabled ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Volume2 className="h-4 w-4 text-[#1D9E75]" />
          </motion.div>
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </motion.button>

      <AnimatePresence>
        {needsGesture && enabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-36 left-4 z-50 flex items-center gap-2 rounded-full bg-[#1D9E75] px-4 py-2 text-xs font-medium text-white shadow-lg md:bottom-20 md:left-6"
          >
            <Music className="h-3 w-3" />
            Tap anywhere to start sound
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
