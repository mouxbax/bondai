"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceButton } from "@/components/chat/VoiceButton";

interface ChatInputProps {
  disabled?: boolean;
  voiceEnabled: boolean;
  voiceListening: boolean;
  voiceSupported: boolean;
  interimText: string;
  onToggleVoiceSession: () => void;
  onVoicePress: () => void;
  onSend: (text: string) => void;
}

export function ChatInput({
  disabled,
  voiceEnabled,
  voiceListening,
  voiceSupported,
  interimText,
  onToggleVoiceSession,
  onVoicePress,
  onSend,
}: ChatInputProps) {
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (interimText) setValue((v) => `${v ? `${v} ` : ""}${interimText}`.trimStart());
  }, [interimText]);

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    setValue("");
    onSend(t);
  };

  return (
    <div className="border-t border-stone-100 bg-[#FAFAF8]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-stone-800 dark:bg-[#0f1412]/95">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Say what’s on your mind…"
            className="min-h-[52px] flex-1 resize-none rounded-2xl"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button type="button" size="icon" className="h-11 w-11 shrink-0 rounded-full" onClick={submit} disabled={disabled}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <VoiceButton
            enabled={voiceEnabled}
            listening={voiceListening}
            supported={voiceSupported}
            onToggleSession={onToggleVoiceSession}
            onPress={onVoicePress}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  );
}
