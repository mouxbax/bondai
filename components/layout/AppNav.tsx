"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Flame, Brain, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/mood", label: "Mood", icon: Brain },
  { href: "/people", label: "People", icon: Users },
  { href: "/talk", label: "Talk", icon: MessageCircle },
];

const sideItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/mood", label: "Mood", icon: Brain },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/people", label: "People", icon: Users },
  { href: "/talk", label: "Talk", icon: MessageCircle },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-56 shrink-0 bg-white/50 p-4 backdrop-blur-2xl dark:bg-stone-900/40 md:block">
        <div className="mb-8 px-2 text-lg font-semibold text-[#1D9E75]">AIAH</div>
        <nav className="space-y-1">
          {sideItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/talk" && pathname.startsWith("/chat"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#1D9E75]/10 text-[#0f6b4f] dark:bg-[#1D9E75]/20 dark:text-emerald-200"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-6 border-t border-stone-200/40 pt-4 dark:border-stone-700/30">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              More
            </p>
            {[
              { href: "/focus", label: "Focus" },
              { href: "/goals", label: "Goals" },
              { href: "/breathe", label: "Breathe" },
              { href: "/insights", label: "Insights" },
              { href: "/achievements", label: "Achievements" },
              { href: "/timeline", label: "Timeline" },
              { href: "/companion", label: "Companion" },
              { href: "/coaching", label: "Practice" },
              { href: "/score", label: "Score" },
              { href: "/account", label: "Account" },
            ].map((item) => {
              const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/talk" && pathname.startsWith("/chat"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#1D9E75]/10 text-[#0f6b4f] dark:bg-[#1D9E75]/20 dark:text-emerald-200"
                      : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex bg-[#FAFAF8]/80 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:bg-[#0f1412]/80 md:hidden">
        {items.map((item) => {
          const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/talk" && pathname.startsWith("/chat"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
                active ? "text-[#1D9E75]" : "text-stone-500 dark:text-stone-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
