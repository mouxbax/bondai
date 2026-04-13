"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  enabled: boolean;
  listening: boolean;
  supported: boolean;
  onToggleSession: () => void;
  onPress: () => void;
}

export function VoiceButton({ enabled, listening, supported, onToggleSession, onPress }: VoiceButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {/* Pulse rings when listening */}
        <AnimatePresence>
          {listening && (
            <>
              <motion.div
                key="ring1"
                className="absolute inset-0 rounded-full border-2 border-[#1D9E75]"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                key="ring2"
                className="absolute inset-0 rounded-full border-2 border-[#1D9E75]"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
              />
            </>
          )}
        </AnimatePresence>

        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            type="button"
            variant={enabled ? "default" : "outline"}
            size="icon"
            className={cn(
              "rounded-full transition-all duration-200 relative z-10",
              enabled && "bg-[#1D9E75] hover:bg-[#178a64] text-white shadow-[0_0_12px_rgba(29,158,117,0.4)]",
              listening && "bg-[#1D9E75] shadow-[0_0_20px_rgba(29,158,117,0.6)]"
            )}
            onClick={onToggleSession}
            aria-pressed={enabled}
            title="Open voice conversation mode"
          >
            <motion.div
              animate={listening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={listening ? { duration: 0.8, repeat: Infinity } : {}}
            >
              {enabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </motion.div>
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {enabled && supported ? (
          <motion.div
            initial={{ opacity: 0, x: -8, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: -8, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              type="button"
              variant={listening ? "amber" : "secondary"}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={onPress}
            >
              {listening ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Listening...
                </motion.span>
              ) : (
                "Tap to talk"
              )}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
