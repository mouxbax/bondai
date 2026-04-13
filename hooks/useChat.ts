"use client";

import { useCallback, useRef, useState } from "react";
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
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setError(null);
    try {
      const res = await fetch(`/api/chat/${conversationId}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Could not load messages.");
        return;
      }
      const data = (await res.json()) as { messages: ChatMessageRow[] };
      setMessages(data.messages);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    }
  }, [conversationId]);

  const send = useCallback(
    async (content: string, opts?: { useVoice?: boolean; bootstrap?: boolean }) => {
      if (!conversationId) return;

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const ac = new AbortController();
      abortRef.current = ac;

      setError(null);
      setThinking(true);
      setStreaming("");
      setLastMeta(null);

      let res: Response;
      try {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            content,
            useVoice: opts?.useVoice,
            bootstrap: opts?.bootstrap,
          }),
          signal: ac.signal,
        });
      } catch (e) {
        setThinking(false);
        if ((e as Error).name === "AbortError") return;
        setError(
          navigator.onLine === false
            ? "You're offline. Reconnect and try again."
            : "Couldn't reach the server. Try again in a moment.",
        );
        return;
      }

      if (!res.ok) {
        setThinking(false);
        let msg = "Message failed to send.";
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        if (res.status === 401) msg = "You've been logged out. Please sign in again.";
        if (res.status === 500) msg = "The AI hit a snag. Try again in a moment.";
        setError(msg);
        return;
      }

      if (!res.body) {
        setThinking(false);
        setError("No response from the server.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      let streamErrored = false;

      // Optimistically add the user message so it never disappears
      const optimisticUserId = `local-u-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticUserId,
          role: "USER",
          content,
          createdAt: new Date().toISOString(),
          emotionTag: null,
          voiceUsed: Boolean(opts?.useVoice),
        },
      ]);

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
                streamErrored = true;
                setError(typeof obj.message === "string" ? obj.message : "Chat error");
              }
            } catch {
              /* ignore partial json */
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          streamErrored = true;
          setError("Connection dropped mid-reply. Try again.");
        }
      } finally {
        setThinking(false);

        // Optimistically add the assistant reply so it never disappears,
        // even if the DB write on the server failed silently.
        if (assembled && !streamErrored) {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-a-${Date.now()}`,
              role: "ASSISTANT",
              content: assembled,
              createdAt: new Date().toISOString(),
              emotionTag: null,
              voiceUsed: false,
            },
          ]);
        }
        setStreaming("");

        // Then reconcile with the server — this replaces optimistic rows with
        // persisted ones. If the server write failed, the optimistic row stays.
        try {
          const reload = await fetch(`/api/chat/${conversationId}`, { cache: "no-store" });
          if (reload.ok) {
            const data = (await reload.json()) as { messages: ChatMessageRow[] };
            if (data.messages.length > 0) {
              setMessages(data.messages);
            }
          }
        } catch {
          /* keep optimistic state */
        }

        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [conversationId, load],
  );

  const clearError = useCallback(() => setError(null), []);

  return { messages, streaming, thinking, error, lastMeta, load, send, clearError };
}
