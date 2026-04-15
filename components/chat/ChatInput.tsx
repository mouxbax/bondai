"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Send, Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { haptic } from "@/lib/haptics";
import { sfx } from "@/lib/sfx";

interface ChatInputProps {
  disabled?: boolean;
  onOpenVoice: () => void;
  onSend: (text: string) => void;
}

export function ChatInput({ disabled, onOpenVoice, onSend }: ChatInputProps) {
  const [value, setValue] = React.useState("");

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    setValue("");
    haptic("tap");
    sfx.tap();
    onSend(t);
  };

  const openVoice = () => {
    haptic("pop");
    onOpenVoice();
  };

  return (
    <div className="bg-[#FAFAF8]/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-2xl dark:bg-[#0f1412]/80">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={openVoice}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D9E75] to-emerald-500 text-white shadow-[0_6px_24px_-6px_rgba(29,158,117,0.55)] transition-shadow hover:shadow-[0_8px_32px_-4px_rgba(29,158,117,0.7)]"
          aria-label="Talk to AIAH"
          title="Open voice conversation"
        >
          <Mic className="h-5 w-5" />
        </motion.button>
        <Textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={disabled ? "Thinking…" : "Say what's on your mind…"}
          className="min-h-[48px] flex-1 resize-none rounded-3xl border-0 bg-white/80 px-4 py-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:bg-stone-800/70"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={submit}
          disabled={!value.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1D9E75] text-white shadow-[0_4px_16px_-4px_rgba(29,158,117,0.5)] transition-all disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-stone-400">Tap mic to talk · Enter to send</p>
    </div>
  );
}
