"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CRISIS_RESOURCES } from "@/lib/ai/crisis";
import { CrisisModal } from "@/components/layout/CrisisModal";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { CoachingSession } from "@/components/coaching/CoachingSession";
import { VoiceConversation } from "@/components/chat/VoiceConversation";
import { useChat } from "@/hooks/useChat";
import { getScenarioById } from "@/lib/coaching-scenarios";
import type { ConversationType } from "@prisma/client";

interface ChatRoomProps {
  conversationId: string;
  type: ConversationType;
  scenarioId: string | null;
}

export function ChatRoom({ conversationId, type, scenarioId }: ChatRoomProps) {
  const { messages, streaming, thinking, error, lastMeta, load, send, clearError } = useChat(conversationId);
  const [immersiveVoice, setImmersiveVoice] = React.useState(false);
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
    if (v === "1") {
      setImmersiveVoice(true);
    }
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

  React.useEffect(() => {
    const c = lastMeta?.crisis;
    if (!c || !c.isCrisis) return;
    if (c.severity !== "medium" && c.severity !== "high") return;
    setCrisisOpen(true);
  }, [lastMeta]);

  const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#FAFAF8] dark:bg-[#0f1412]">
      {scenario ? <CoachingSession scenario={scenario} /> : null}
      {error ? (
        <div className="mx-auto mt-3 flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-700 shadow-[0_4px_20px_-8px_rgba(244,63,94,0.25)] backdrop-blur-xl dark:bg-rose-950/50 dark:text-rose-300">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <ChatWindow messages={messages} streaming={streaming} thinking={thinking} />
      </div>
      <ChatInput
        disabled={thinking}
        onOpenVoice={() => setImmersiveVoice(true)}
        onSend={(text) => void send(text)}
      />
      <VoiceConversation
        open={immersiveVoice}
        onClose={() => setImmersiveVoice(false)}
        messages={messages}
        thinking={thinking}
        onSend={(text) => void send(text, { useVoice: true })}
        chatError={error}
        onClearError={clearError}
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
