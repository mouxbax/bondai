"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { StreamingMessage } from "@/components/chat/StreamingMessage";
import type { ChatMessageRow } from "@/hooks/useChat";

function ThinkingDots() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex justify-start"
    >
      <div className="rounded-[22px] bg-white/80 px-4 py-3 text-sm text-stone-500 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:bg-stone-800/70">
        <span className="inline-flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-[#1D9E75]"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
          <span className="ml-1.5">Thinking with you…</span>
        </span>
      </div>
    </motion.div>
  );
}

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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-stone-500 dark:text-stone-400"
          >
            Starting your conversation…
          </motion.p>
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
        <AnimatePresence>
          {thinking ? <ThinkingDots /> : null}
        </AnimatePresence>
        {streaming ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <StreamingMessage text={streaming} active />
          </motion.div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
