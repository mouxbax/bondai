"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Volume2 } from "lucide-react";
import { AIAHOrb, type OrbMood } from "@/components/companion/AIAHOrb";
import { useMood } from "@/lib/mood-context";

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

type PhaseType = "idle" | "listening" | "thinking" | "speaking";

function getRecognitionCtor():
  | (new () => SpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Full-screen immersive voice chat.
 * Auto-loop: listen → silence detected → send → wait → speak reply → listen again
 */
export function VoiceConversation({ open, onClose, messages, thinking, onSend, chatError, onClearError }: VoiceConversationProps) {
  const { theme } = useMood();
  const [phase, setPhase] = useState<PhaseType>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string>("");

  const recRef = useRef<SpeechRecognition | null>(null);
  const lastMsgCountRef = useRef(0);
  const shouldLoopRef = useRef(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pick the best voice available
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const setBest = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      // Prefer natural-sounding English voices
      const preferred =
        voices.find((v) => /samantha|aria|jenny|natural|neural/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      setVoiceName(preferred.name);
    };
    setBest();
    window.speechSynthesis.onvoiceschanged = setBest;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.pitch = 1.0;
      u.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((x) => x.name === voiceName);
      if (v) u.voice = v;
      u.onend = () => {
        setPhase("idle");
        onEnd?.();
      };
      u.onerror = () => {
        setPhase("idle");
        onEnd?.();
      };
      utterRef.current = u;
      setPhase("speaking");
      window.speechSynthesis.speak(u);
    },
    [voiceName],
  );

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    setError(null);
    setTranscript("");
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    let finalText = "";

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      setTranscript((finalText + " " + interim).trim());
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "no-speech" || ev.error === "aborted") {
        setPhase("idle");
        return;
      }
      // Translate cryptic browser codes into human messages.
      let msg: string;
      switch (ev.error) {
        case "network":
          msg =
            "Your browser's speech recognition couldn't reach the internet. Chrome/Safari send audio to Google to transcribe — it's blocked here. Use text mode instead.";
          break;
        case "not-allowed":
        case "service-not-allowed":
          msg = "Mic access was blocked. Allow microphone for this site in your browser settings.";
          break;
        case "audio-capture":
          msg = "No microphone detected. Check your input device and try again.";
          break;
        case "language-not-supported":
          msg = "Your system language isn't supported for voice. Switch browser language to English.";
          break;
        default:
          msg = `Voice recognition error (${ev.error}). Try text mode instead.`;
      }
      shouldLoopRef.current = false;
      setError(msg);
      setPhase("idle");
    };

    rec.onend = () => {
      const text = finalText.trim();
      setTranscript("");
      if (text) {
        setPhase("thinking");
        onSend(text);
      } else if (shouldLoopRef.current && open) {
        // No speech detected — restart listening
        setTimeout(() => {
          if (shouldLoopRef.current && open) startListening();
        }, 400);
      } else {
        setPhase("idle");
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setPhase("listening");
    } catch {
      setError("Could not start microphone.");
      setPhase("idle");
    }
  }, [onSend, open]);

  // On open: kick off the loop
  useEffect(() => {
    if (!open) {
      shouldLoopRef.current = false;
      if (recRef.current) {
        try {
          (recRef.current as SpeechRecognition & { abort?: () => void }).abort?.();
          recRef.current.stop();
        } catch {
          /* */
        }
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPhase("idle");
      setTranscript("");
      return;
    }

    shouldLoopRef.current = true;
    lastMsgCountRef.current = messages.length;
    // Small delay so orb can settle in
    const t = setTimeout(() => {
      if (shouldLoopRef.current) startListening();
    }, 600);

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
              if (shouldLoopRef.current && open) startListening();
            }, 500);
          }
        });
      }
    }
  }, [messages, open, speak, startListening]);

  // Sync phase with thinking state
  useEffect(() => {
    if (open && thinking && phase !== "speaking") {
      setPhase("thinking");
    }
  }, [thinking, open, phase]);

  // If chat surfaces an error, stop the voice loop and show it
  useEffect(() => {
    if (open && chatError) {
      shouldLoopRef.current = false;
      if (recRef.current) {
        try {
          (recRef.current as SpeechRecognition & { abort?: () => void }).abort?.();
          recRef.current.stop();
        } catch {
          /* */
        }
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPhase("idle");
      setError(chatError);
    }
  }, [chatError, open]);

  const retry = () => {
    setError(null);
    onClearError?.();
    shouldLoopRef.current = true;
    setTimeout(() => {
      if (shouldLoopRef.current && open) startListening();
    }, 200);
  };

  const handleClose = () => {
    shouldLoopRef.current = false;
    if (recRef.current) {
      try {
        (recRef.current as SpeechRecognition & { abort?: () => void }).abort?.();
        recRef.current.stop();
      } catch {
        /* */
      }
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  const tapToToggle = () => {
    if (phase === "listening") {
      // Stop listening manually (submits what we have)
      recRef.current?.stop();
    } else if (phase === "speaking") {
      // Skip speech, go back to listening
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPhase("idle");
      setTimeout(() => startListening(), 200);
    } else if (phase === "idle") {
      startListening();
    }
  };

  const orbMood: OrbMood =
    phase === "listening" ? "focused" : phase === "thinking" ? "tender" : phase === "speaking" ? "happy" : "calm";

  const phaseLabel =
    phase === "listening"
      ? "I'm listening"
      : phase === "thinking"
        ? "Thinking..."
        : phase === "speaking"
          ? "Speaking"
          : "Tap orb to talk";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`fixed inset-0 z-[150] flex flex-col items-center justify-between bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo} backdrop-blur-xl`}
        >
          {/* Ambient background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: theme.accent }}
              animate={{
                scale: phase === "listening" ? [1, 1.15, 1] : phase === "speaking" ? [1, 1.2, 1] : [1, 1.05, 1],
              }}
              transition={{
                duration: phase === "listening" ? 1.5 : phase === "speaking" ? 1 : 4,
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
            <motion.button
              onClick={tapToToggle}
              whileTap={{ scale: 0.97 }}
              className="cursor-pointer"
              aria-label="Toggle voice"
            >
              <AIAHOrb mood={orbMood} size={240} />
            </motion.button>

            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className={`text-xl font-medium ${theme.text}`}>{phaseLabel}</p>
              {phase === "listening" && transcript && (
                <p className={`mt-2 max-w-md px-6 text-sm italic ${theme.textMuted}`}>&ldquo;{transcript}&rdquo;</p>
              )}
              {phase === "speaking" && lastReply && (
                <p className={`mt-2 max-w-md px-6 text-sm ${theme.textMuted}`}>{lastReply.slice(0, 140)}{lastReply.length > 140 ? "..." : ""}</p>
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
                    : phase === "thinking"
                      ? "One moment..."
                      : "Tap the orb to start"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
