"use client";

import { motion } from "framer-motion";
import type { EmotionTag } from "@prisma/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/utils";

const emotionColor: Record<EmotionTag, string> = {
  HAPPY: "bg-amber-400",
  SAD: "bg-sky-400",
  ANXIOUS: "bg-violet-400",
  LONELY: "bg-rose-400",
  ANGRY: "bg-orange-500",
  NEUTRAL: "bg-stone-300 dark:bg-stone-600",
};

export function MessageBubble({
  role,
  content,
  createdAt,
  emotionTag,
}: {
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  emotionTag: EmotionTag | null;
}) {
  const isUser = role === "USER";
  const date = new Date(createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group relative max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-relaxed backdrop-blur-xl ${
          isUser
            ? "bg-[#1D9E75] text-white shadow-[0_4px_20px_-4px_rgba(29,158,117,0.35)]"
            : "bg-white/80 text-stone-800 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] dark:bg-stone-800/70 dark:text-stone-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
          <span className={isUser ? "text-white/70" : "text-stone-400"}>{formatRelativeTime(date)}</span>
          {emotionTag && isUser ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${emotionColor[emotionTag]}`} />
                  <span className={isUser ? "text-white/70" : "text-stone-500"}>{emotionTag.toLowerCase()}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>Detected mood: {emotionTag}</TooltipContent>
            </Tooltip>
          ) : (
            <span />
          )}
        </div>
      </div>
    </motion.div>
  );
}
