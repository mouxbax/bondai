"use client";

import { cn } from "@/lib/utils";
import { getItemEmoji, RARITY_GLOW } from "@/lib/shop/emoji-map";

interface ItemIconProps {
  icon: string | null | undefined;
  rarity?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { container: "h-10 w-10", emoji: "text-xl" },
  md: { container: "h-14 w-14", emoji: "text-3xl" },
  lg: { container: "h-[72px] w-[72px]", emoji: "text-[40px]" },
};

/**
 * 3D-style emoji icon with radial gradient background,
 * rarity-colored glow ring, and drop shadow.
 * Used in shop cards, inventory, and anywhere items are displayed.
 */
export function ItemIcon({ icon, rarity = "common", size = "md", className }: ItemIconProps) {
  const emoji = getItemEmoji(icon);
  const glow = RARITY_GLOW[rarity] ?? RARITY_GLOW.common;
  const sizeClasses = SIZE_MAP[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl",
        "bg-gradient-to-br ring-2",
        glow.bg,
        glow.ring,
        glow.shadow,
        "shadow-lg",
        sizeClasses.container,
        className,
      )}
    >
      {/* Inner glow overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent dark:from-white/5" />

      {/* Emoji */}
      <span
        className={cn(
          sizeClasses.emoji,
          "relative z-10 select-none",
          // Subtle text shadow for depth
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
        )}
        role="img"
      >
        {emoji}
      </span>

      {/* Rarity shimmer for legendary */}
      {rarity === "legendary" && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 dark:opacity-15 animate-shimmer"
            style={{
              background: "linear-gradient(105deg, transparent 30%, rgba(255,215,0,0.4) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
      )}
    </div>
  );
}
