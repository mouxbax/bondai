"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Target, GraduationCap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/coaching", label: "Coach", icon: GraduationCap },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/score", label: "Score", icon: Activity },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-stone-100 bg-white/80 p-4 dark:border-stone-800 dark:bg-stone-900/80 md:block">
        <div className="mb-8 px-2 text-lg font-semibold text-[#1D9E75]">BondAI</div>
        <nav className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
        </nav>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-stone-100 bg-[#FAFAF8]/95 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md dark:border-stone-800 dark:bg-[#0f1412]/95 md:hidden">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
