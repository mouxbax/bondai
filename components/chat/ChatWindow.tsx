"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { StreamingMessage } from "@/components/chat/StreamingMessage";
import type { ChatMessageRow } from "@/hooks/useChat";

export function ChatWindow({
  messages,
  streaming,
  thinking,
}: {
  messages: ChatMessageRow[];
  streaming: string;
  thinking: boolean;
}) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, thinking]);

  return (
    <ScrollArea className="h-full max-h-full min-h-0 px-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 py-4 pb-28">
        {messages.length === 0 && !streaming && !thinking ? (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400">Starting your conversation…</p>
        ) : null}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            createdAt={m.createdAt}
            emotionTag={m.emotionTag}
          />
        ))}
        {thinking ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm text-stone-500 shadow-sm dark:border-stone-700 dark:bg-stone-900">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1D9E75]" />
                Thinking with you…
              </span>
            </div>
          </div>
        ) : null}
        {streaming ? (
          <div className="flex justify-start">
            <StreamingMessage text={streaming} active />
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
