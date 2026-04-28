"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  MessageCircle,
  CalendarDays,
  Wind,
  ChevronDown,
  ShoppingCart,
  Dumbbell,
  Wallet,
  Send,
  Store,
  Heart,
  Globe,
  Trophy,
  GraduationCap,
  Users,
  BarChart3,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Bottom tab bar (mobile) ─────────────────────────────────────────
const mobileItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/talk", label: "Talk", icon: MessageCircle },
  { href: "/plans", label: "Plan", icon: CalendarDays },
  { href: "/breathe", label: "Breathe", icon: Wind },
];

// ─── Sidebar top items (desktop) ─────────────────────────────────────
const sideItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/talk", label: "Talk", icon: MessageCircle },
  { href: "/plans", label: "Life OS", icon: CalendarDays },
  { href: "/breathe", label: "Breathe", icon: Wind },
];

// ─── Plan sub-items (collapsible) ────────────────────────────────────
const planSubItems = [
  { href: "/plans/schedule", label: "Weekly Schedule", icon: CalendarDays },
  { href: "/plans/grocery", label: "Grocery List", icon: ShoppingCart },
  { href: "/plans/workout", label: "Workout Plan", icon: Dumbbell },
  { href: "/plans/finances", label: "Finances", icon: Wallet },
  { href: "/plans/outreach", label: "Outreach", icon: Send },
];

// ─── More section ────────────────────────────────────────────────────
const moreItems = [
  { href: "/companion", label: "Companion", icon: Globe },
  { href: "/shop", label: "Pet Shop", icon: Store },
  { href: "/mood", label: "Mood Check", icon: Heart },
  { href: "/coaching", label: "Practice", icon: GraduationCap },
  { href: "/people", label: "Circle", icon: Users },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/score", label: "Life Score", icon: BarChart3 },
  { href: "/account", label: "Account", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const plansOpen = pathname.startsWith("/plans");
  const [plansExpanded, setPlansExpanded] = useState(plansOpen);

  return (
    <>
      {/* ─── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white/80 p-4 backdrop-blur-2xl dark:border-white/[0.04] dark:bg-black/30 md:block overflow-y-auto">
        <div className="mb-8 px-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">AIAH</div>
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
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-white/[0.05] dark:hover:text-stone-200"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Plan section — collapsible */}
          <div className="mt-4 border-t border-stone-200 pt-4 dark:border-white/[0.06]">
            <button
              onClick={() => setPlansExpanded((p) => !p)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                plansOpen
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-white/[0.05] dark:hover:text-stone-200"
              )}
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Plan
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  plansExpanded ? "rotate-180" : ""
                )}
              />
            </button>
            {plansExpanded && (
              <div className="mt-1 ml-3 space-y-0.5">
                {planSubItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-white/[0.05] dark:hover:text-stone-300"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* More section */}
          <div className="mt-4 border-t border-stone-200 pt-4 dark:border-white/[0.06]">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              More
            </p>
            {moreItems.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-white/[0.05] dark:hover:text-stone-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ─── Mobile bottom bar ───────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-stone-200 bg-white/85 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl dark:border-white/[0.04] dark:bg-[#0b1210]/85 md:hidden">
        {mobileItems.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/talk" && pathname.startsWith("/chat"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tutorial={item.href === "/talk" ? "nav-talk" : item.href === "/home" ? "nav-home" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
                active ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500"
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
