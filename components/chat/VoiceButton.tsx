"use client";

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
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant={enabled ? "default" : "outline"}
        size="icon"
        className={cn(
          "rounded-full transition-colors duration-200",
          enabled && "bg-[#1D9E75] hover:bg-[#178a64] text-white shadow-[0_0_12px_rgba(29,158,117,0.4)]"
        )}
        onClick={onToggleSession}
        aria-pressed={enabled}
        title="Voice mode for this chat"
      >
        {enabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      {enabled && supported ? (
        <Button
          type="button"
          variant={listening ? "amber" : "secondary"}
          size="sm"
          className="rounded-full"
          onClick={onPress}
        >
          {listening ? "Stop" : "Hold to talk"}
        </Button>
      ) : null}
    </div>
  );
}
