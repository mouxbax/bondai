"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CRISIS_RESOURCES } from "@/lib/ai/crisis";
import { CrisisModal } from "@/components/layout/CrisisModal";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { CoachingSession } from "@/components/coaching/CoachingSession";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { getScenarioById } from "@/lib/coaching-scenarios";
import type { ConversationType } from "@prisma/client";

interface ChatRoomProps {
  conversationId: string;
  type: ConversationType;
  scenarioId: string | null;
}

export function ChatRoom({ conversationId, type, scenarioId }: ChatRoomProps) {
  const { messages, streaming, thinking, error, lastMeta, load, send } = useChat(conversationId);
  const [voiceSession, setVoiceSession] = React.useState(false);
  const { listening, interim, start, stop, speak, supported, error: voiceError } = useVoice(voiceSession);
  const searchParams = useSearchParams();
  const [crisisOpen, setCrisisOpen] = React.useState(false);
  const bootstrapped = React.useRef(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      await load();
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  React.useEffect(() => {
    const v = searchParams.get("voice");
    if (v === "1") setVoiceSession(true);
  }, [searchParams]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (bootstrapped.current) return;
    if (type !== "DAILY_CHECKIN") return;
    const hasAssistant = messages.some((m) => m.role === "ASSISTANT");
    if (hasAssistant) return;
    bootstrapped.current = true;
    void send("", { bootstrap: true });
  }, [hydrated, type, messages, send]);

  // TTS: read AI response aloud when voice session is active
  const prevMsgCount = React.useRef(0);
  React.useEffect(() => {
    if (!voiceSession) {
      prevMsgCount.current = messages.length;
      return;
    }
    if (messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1];
      if (last && last.role === "ASSISTANT") {
        speak(last.content);
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, voiceSession, speak]);

  React.useEffect(() => {
    const c = lastMeta?.crisis;
    if (!c || !c.isCrisis) return;
    if (c.severity !== "medium" && c.severity !== "high") return;
    setCrisisOpen(true);
    // Crisis is logged server-side in POST /api/chat before streaming.
  }, [lastMeta]);

  const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#FAFAF8] dark:bg-[#0f1412]">
      {scenario ? <CoachingSession scenario={scenario} /> : null}
      {voiceError ? <p className="px-4 pt-2 text-center text-xs text-rose-600">{voiceError}</p> : null}
      {error ? <p className="px-4 pt-2 text-center text-xs text-rose-600">{error}</p> : null}
      <div className="min-h-0 flex-1">
        <ChatWindow messages={messages} streaming={streaming} thinking={thinking} />
      </div>
      <ChatInput
        disabled={thinking}
        voiceEnabled={voiceSession}
        voiceListening={listening}
        voiceSupported={supported}
        interimText={interim}
        onToggleVoiceSession={() => setVoiceSession((v) => !v)}
        onVoicePress={() => (listening ? stop() : start())}
        onSend={(text) => void send(text, { useVoice: voiceSession })}
      />
      <CrisisModal
        open={crisisOpen}
        payload={lastMeta?.crisis ?? null}
        resources={CRISIS_RESOURCES}
        onDismiss={() => setCrisisOpen(false)}
        onNeedSupport={() => {
          window.open("https://findahelpline.com", "_blank", "noopener,noreferrer");
        }}
      />
    </div>
  );
}
