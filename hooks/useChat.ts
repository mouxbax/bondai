"use client";

import { useCallback, useState } from "react";
import type { EmotionTag } from "@prisma/client";
import type { CrisisPayload } from "@/types";

export interface ChatMessageRow {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  emotionTag: EmotionTag | null;
  voiceUsed: boolean;
}

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [streaming, setStreaming] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{
    emotion?: EmotionTag | null;
    crisis?: CrisisPayload | null;
  } | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setError(null);
    const res = await fetch(`/api/chat/${conversationId}`);
    if (!res.ok) {
      setError("Could not load messages.");
      return;
    }
    const data = (await res.json()) as { messages: ChatMessageRow[] };
    setMessages(data.messages);
  }, [conversationId]);

  const send = useCallback(
    async (content: string, opts?: { useVoice?: boolean; bootstrap?: boolean }) => {
      if (!conversationId) return;
      setError(null);
      setThinking(true);
      setStreaming("");
      setLastMeta(null);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content,
          useVoice: opts?.useVoice,
          bootstrap: opts?.bootstrap,
        }),
      });

      if (!res.ok || !res.body) {
        setThinking(false);
        setError("Could not send message.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            try {
              const obj = JSON.parse(raw) as Record<string, unknown>;
              if (obj.type === "text" && typeof obj.text === "string") {
                setThinking(false);
                assembled += obj.text;
                setStreaming(assembled);
              }
              if (obj.type === "meta") {
                setLastMeta({
                  emotion: (obj.emotion as EmotionTag | null | undefined) ?? null,
                  crisis: (obj.crisis as CrisisPayload | null | undefined) ?? null,
                });
              }
              if (obj.type === "error") {
                setError(typeof obj.message === "string" ? obj.message : "Chat error");
              }
            } catch {
              /* ignore partial json */
            }
          }
        }
      } finally {
        setThinking(false);
        setStreaming("");
        await load();
      }
    },
    [conversationId, load]
  );

  return { messages, streaming, thinking, error, lastMeta, load, send };
}
