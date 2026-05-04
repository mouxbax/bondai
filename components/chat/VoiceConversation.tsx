"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Volume2 } from "lucide-react";
import { AIAHOrb, type OrbMood } from "@/components/companion/AIAHOrb";
import { useMood } from "@/lib/mood-context";
import { haptic } from "@/lib/haptics";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

interface VoiceConversationProps {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  thinking: boolean;
  onSend: (text: string) => void;
  chatError?: string | null;
  onClearError?: () => void;
}

type PhaseType = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

/** Silence detection thresholds */
const SILENCE_RMS = 0.012;        // below this = "silent"
const SILENCE_HANG_MS = 1600;      // trailing silence that ends a turn
const MIN_UTTERANCE_MS = 500;      // ignore accidental taps
const MAX_UTTERANCE_MS = 20000;    // hard cap per turn
const PRE_ROLL_MS = 250;           // brief wait before arming so the orb lands

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* some browsers throw on unknown types */
    }
  }
  return undefined;
}

function normalizeForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Full-screen immersive voice chat.
 * Flow: listen (MediaRecorder) → silence detected → POST /api/transcribe → onSend →
 *       wait for assistant → speak via OpenAI TTS → listen again.
 *
 * Works on iOS Safari (unlike the old Web Speech API version).
 */
export function VoiceConversation({
  open,
  onClose,
  messages,
  thinking,
  onSend,
  chatError,
  onClearError,
}: VoiceConversationProps) {
  const { theme } = useMood();
  const [phase, setPhase] = useState<PhaseType>("idle");
  const [level, setLevel] = useState(0); // 0..1 mic amplitude (for viz)
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const streamRef = useRef<MediaStream | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCtxRef = useRef<AudioContext | null>(null);
  const ttsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const startedAtRef = useRef<number>(0);
  const lastVoiceAtRef = useRef<number>(0);
  const hasSpeechRef = useRef<boolean>(false);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMsgCountRef = useRef(0);
  const shouldLoopRef = useRef(true);
  const listeningRef = useRef(false);

  /** Ensure we have an AudioContext for TTS playback (unlocked on user gesture) */
  const ensureTTSContext = useCallback(() => {
    if (!ttsCtxRef.current || ttsCtxRef.current.state === "closed") {
      ttsCtxRef.current = new AudioContext();
    }
    // Resume if suspended (mobile requires resume inside gesture)
    if (ttsCtxRef.current.state === "suspended") {
      ttsCtxRef.current.resume().catch(() => {});
    }
    return ttsCtxRef.current;
  }, []);

  /** Stop any in-flight TTS audio */
  const stopTTS = useCallback(() => {
    // Stop AudioBuffer-based playback
    if (ttsSourceRef.current) {
      try { ttsSourceRef.current.stop(); } catch {}
      ttsSourceRef.current = null;
    }
    // Stop legacy Audio element playback
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      const src = ttsAudioRef.current.src;
      ttsAudioRef.current.src = "";
      ttsAudioRef.current = null;
      if (src) URL.revokeObjectURL(src);
    }
  }, []);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      stopTTS();
      const clean = normalizeForSpeech(text);
      if (!clean) {
        setPhase("idle");
        onEnd?.();
        return;
      }
      setPhase("speaking");
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean.slice(0, 4096) }),
        });
        if (!res.ok) {
          console.error("[TTS] API error", res.status);
          setPhase("idle");
          onEnd?.();
          return;
        }
        const arrayBuffer = await res.arrayBuffer();

        // Try AudioContext first (works on mobile when pre-unlocked)
        const ctx = ttsCtxRef.current;
        if (ctx && ctx.state === "running") {
          try {
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            ttsSourceRef.current = source;
            source.onended = () => {
              ttsSourceRef.current = null;
              setPhase("idle");
              onEnd?.();
            };
            source.start(0);
            return;
          } catch (decodeErr) {
            console.warn("[TTS] AudioContext decode failed, falling back", decodeErr);
          }
        }

        // Fallback: Audio element (works on desktop, may fail on mobile)
        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        ttsAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          setPhase("idle");
          onEnd?.();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          ttsAudioRef.current = null;
          setPhase("idle");
          onEnd?.();
        };
        await audio.play();
      } catch (err) {
        console.error("[TTS] playback error", err);
        setPhase("idle");
        onEnd?.();
      }
    },
    [stopTTS],
  );

  // --- Recorder lifecycle ---------------------------------------------------

  const teardownAudio = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    try {
      sourceRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;
    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {});
    }
    audioCtxRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    listeningRef.current = false;
    setLevel(0);
  }, []);

  const transcribeAndSend = useCallback(
    async (blob: Blob) => {
      setPhase("transcribing");
      try {
        const fd = new FormData();
        fd.append("audio", blob, "speech.webm");
        if (typeof navigator !== "undefined" && navigator.language) {
          fd.append("language", navigator.language.split("-")[0] ?? "en");
        }
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          shouldLoopRef.current = false;
          setError(
            j.error ??
              "Transcription failed. Try text mode instead, or check OPENAI_API_KEY on the server.",
          );
          setPhase("idle");
          return;
        }
        const j = (await res.json()) as { text?: string };
        const text = (j.text ?? "").trim();
        if (!text) {
          // Empty — silently re-arm if we're still open.
          if (shouldLoopRef.current && open) {
            setTimeout(() => {
              if (shouldLoopRef.current && open) void startListening();
            }, 300);
          } else {
            setPhase("idle");
          }
          return;
        }
        haptic("tap");
        setPhase("thinking");
        onSend(text);
      } catch {
        shouldLoopRef.current = false;
        setError("Network error while transcribing. Try text mode.");
        setPhase("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSend, open],
  );

  const stopListening = useCallback(
    (reason: "silence" | "manual" | "abort" = "silence") => {
      if (!listeningRef.current && reason !== "abort") return;
      const rec = recorderRef.current;
      listeningRef.current = false;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          /* noop */
        }
      } else {
        // Nothing to flush — just clean up.
        teardownAudio();
        if (reason === "abort") setPhase("idle");
      }
    },
    [teardownAudio],
  );

  const startListening = useCallback(async () => {
    if (listeningRef.current) return;
    if (typeof window === "undefined") return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Mic access not available in this browser.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    setError(null);

    // Unlock AudioContext for TTS on mobile (must happen during user gesture)
    ensureTTSContext();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e) {
      const err = e as DOMException;
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        setError("Mic access was blocked. Allow microphone for this site in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone detected. Check your input device and try again.");
      } else {
        setError("Could not access the microphone.");
      }
      shouldLoopRef.current = false;
      setPhase("idle");
      return;
    }
    streamRef.current = stream;

    // Audio graph for silence detection + level meter
    const Ctor =
      (window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      setError("WebAudio isn't supported in this browser.");
      teardownAudio();
      return;
    }
    const ctx = new Ctor();
    audioCtxRef.current = ctx;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    source.connect(analyser);

    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      setError("Could not start the recorder.");
      teardownAudio();
      return;
    }
    recorderRef.current = rec;
    chunksRef.current = [];

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.onstop = () => {
      const chunks = chunksRef.current;
      const type = rec.mimeType || mimeType || "audio/webm";
      const durMs = Date.now() - startedAtRef.current;
      teardownAudio();
      if (!hasSpeechRef.current || durMs < MIN_UTTERANCE_MS || chunks.length === 0) {
        // Too short / no voice — re-arm if still open
        if (shouldLoopRef.current && open) {
          setTimeout(() => {
            if (shouldLoopRef.current && open) void startListening();
          }, 250);
        } else {
          setPhase("idle");
        }
        return;
      }
      const blob = new Blob(chunks, { type });
      void transcribeAndSend(blob);
    };

    try {
      rec.start(250); // emit chunks periodically so teardown has data even on rapid stops
    } catch {
      setError("Could not start recording.");
      teardownAudio();
      return;
    }

    startedAtRef.current = Date.now();
    lastVoiceAtRef.current = Date.now();
    hasSpeechRef.current = false;
    listeningRef.current = true;
    setPhase("listening");
    haptic("tap");

    // Hard cap — never record longer than MAX_UTTERANCE_MS
    maxTimerRef.current = setTimeout(() => {
      if (listeningRef.current) stopListening("silence");
    }, MAX_UTTERANCE_MS);

    // RMS loop
    const buffer = new Float32Array(analyser.fftSize);
    const tick = () => {
      if (!analyserRef.current || !listeningRef.current) return;
      analyserRef.current.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
      const rms = Math.sqrt(sum / buffer.length);
      setLevel(Math.min(1, rms * 6));
      const now = Date.now();
      if (rms > SILENCE_RMS) {
        hasSpeechRef.current = true;
        lastVoiceAtRef.current = now;
      } else if (hasSpeechRef.current && now - lastVoiceAtRef.current > SILENCE_HANG_MS) {
        stopListening("silence");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [open, stopListening, teardownAudio, transcribeAndSend, ensureTTSContext]);

  // On open: kick off the loop
  useEffect(() => {
    if (!open) {
      shouldLoopRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {}
      }
      teardownAudio();
      stopTTS();
      setPhase("idle");
      return;
    }

    shouldLoopRef.current = true;
    lastMsgCountRef.current = messages.length;
    const t = setTimeout(() => {
      if (shouldLoopRef.current) void startListening();
    }, PRE_ROLL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Watch for new assistant messages → speak them
  useEffect(() => {
    if (!open) return;
    if (messages.length > lastMsgCountRef.current) {
      const last = messages[messages.length - 1];
      lastMsgCountRef.current = messages.length;
      if (last && last.role === "ASSISTANT" && last.content) {
        setLastReply(last.content);
        speak(last.content, () => {
          if (shouldLoopRef.current && open) {
            setTimeout(() => {
              if (shouldLoopRef.current && open) void startListening();
            }, 400);
          }
        });
      }
    }
  }, [messages, open, speak, startListening]);

  // Sync phase with thinking state from the parent
  useEffect(() => {
    if (open && thinking && phase !== "speaking" && phase !== "transcribing") {
      setPhase("thinking");
    }
  }, [thinking, open, phase]);

  // If chat surfaces an error, stop the voice loop and show it
  useEffect(() => {
    if (open && chatError) {
      shouldLoopRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {}
      }
      teardownAudio();
      stopTTS();
      setPhase("idle");
      setError(chatError);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatError, open, teardownAudio, stopTTS]);

  const retry = () => {
    setError(null);
    onClearError?.();
    shouldLoopRef.current = true;
    setTimeout(() => {
      if (shouldLoopRef.current && open) void startListening();
    }, 200);
  };

  const handleClose = () => {
    shouldLoopRef.current = false;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    teardownAudio();
    stopTTS();
    onClose();
  };

  const tapToToggle = () => {
    haptic("tap");
    if (phase === "listening") {
      stopListening("manual");
    } else if (phase === "speaking") {
      stopTTS();
      setPhase("idle");
      setTimeout(() => void startListening(), 150);
    } else if (phase === "idle") {
      void startListening();
    }
  };

  const orbMood: OrbMood =
    phase === "listening"
      ? "focused"
      : phase === "transcribing" || phase === "thinking"
        ? "tender"
        : phase === "speaking"
          ? "happy"
          : "calm";

  const phaseLabel =
    phase === "listening"
      ? "I'm listening"
      : phase === "transcribing"
        ? "Hearing you..."
        : phase === "thinking"
          ? "Thinking..."
          : phase === "speaking"
            ? "Speaking"
            : "Tap orb to talk";

  const orbSize = 240;
  const ringScale = 1 + level * 0.35;

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-between"
        >
          {/* Solid opaque base (light/dark aware) so nothing bleeds through */}
          <div className="pointer-events-none absolute inset-0 bg-[#FAFAF8] dark:bg-[#0b0f0e]" />
          {/* Themed gradient wash on top of the solid base */}
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}
          />

          {/* Ambient background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: theme.accent }}
              animate={{
                scale:
                  phase === "listening"
                    ? [1, 1 + level * 0.3, 1]
                    : phase === "speaking"
                      ? [1, 1.2, 1]
                      : [1, 1.05, 1],
              }}
              transition={{
                duration: phase === "listening" ? 0.6 : phase === "speaking" ? 1 : 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Close */}
          <div className="relative z-10 flex w-full items-center justify-between px-6 pt-6 md:pt-8">
            <div className={`text-xs font-medium uppercase tracking-widest ${theme.textMuted}`}>
              Voice mode
            </div>
            <button
              onClick={handleClose}
              className="rounded-full bg-white/60 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-stone-900/60 dark:hover:bg-stone-900"
              aria-label="Exit voice mode"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Orb + phase */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
              {phase === "listening" && (
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#1D9E75]/60"
                  style={{ width: orbSize, height: orbSize }}
                  animate={{ scale: ringScale, opacity: 0.4 + level * 0.5 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                />
              )}
              <motion.button
                onClick={tapToToggle}
                whileTap={{ scale: 0.97 }}
                className="cursor-pointer"
                aria-label="Toggle voice"
              >
                <AIAHOrb mood={orbMood} size={orbSize} />
              </motion.button>
            </div>

            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className={`text-xl font-medium ${theme.text}`}>{phaseLabel}</p>
              {phase === "speaking" && lastReply && (
                <p className={`mt-2 max-w-md px-6 text-sm ${theme.textMuted}`}>
                  {lastReply.slice(0, 140)}
                  {lastReply.length > 140 ? "..." : ""}
                </p>
              )}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 rounded-2xl bg-rose-50/95 px-5 py-4 shadow-lg backdrop-blur-xl dark:bg-rose-950/60"
              >
                <p className="max-w-xs text-center text-sm leading-relaxed text-rose-700 dark:text-rose-300">
                  {error}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={retry}
                    className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-600"
                  >
                    Try again
                  </button>
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-rose-700 shadow-md hover:bg-white dark:bg-stone-800/80 dark:text-rose-200"
                  >
                    Type instead
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Hint */}
          <div className="relative z-10 pb-10 pt-6 text-center">
            <div className={`flex items-center justify-center gap-2 text-xs ${theme.textMuted}`}>
              {phase === "speaking" ? <Volume2 className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              <span>
                {phase === "listening"
                  ? "Pause when you're done"
                  : phase === "speaking"
                    ? "Tap orb to interrupt"
                    : phase === "thinking" || phase === "transcribing"
                      ? "One moment..."
                      : "Tap the orb to start"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render through a portal so we escape any ancestor stacking context
  // (PageTransition's motion.div applies `filter`, which otherwise clips
  // our `position: fixed` overlay to the main content area).
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
