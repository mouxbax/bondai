"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  MessageCircle,
  Flame,
  Target,
  CheckCircle2,
  ChevronDown,
  CalendarDays,
  ShoppingCart,
  Dumbbell,
  Wallet,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/focus", label: "Focus", icon: CheckCircle2 },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/talk", label: "Talk", icon: MessageCircle },
];

const sideItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/focus", label: "Focus", icon: CheckCircle2 },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/talk", label: "Talk", icon: MessageCircle },
];

const planSubItems = [
  { href: "/plans/schedule", label: "Weekly Schedule", icon: CalendarDays },
  { href: "/plans/grocery", label: "Grocery List", icon: ShoppingCart },
  { href: "/plans/workout", label: "Workout Plan", icon: Dumbbell },
  { href: "/plans/finances", label: "Finances", icon: Wallet },
  { href: "/plans/outreach", label: "Outreach", icon: Send },
];

export function AppNav() {
  const pathname = usePathname();
  const plansOpen = pathname.startsWith("/plans");
  const [plansExpanded, setPlansExpanded] = useState(plansOpen);

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-white/[0.04] bg-black/30 p-4 backdrop-blur-2xl md:block overflow-y-auto">
        <div className="mb-8 px-2 text-lg font-semibold text-emerald-400">AIAH</div>
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
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-stone-400 hover:bg-white/[0.05] hover:text-stone-200"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Plans section — collapsible */}
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <button
              onClick={() => setPlansExpanded((p) => !p)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                plansOpen
                  ? "text-emerald-300"
                  : "text-stone-400 hover:bg-white/[0.05] hover:text-stone-200"
              )}
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                My Plans
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
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "text-stone-500 hover:bg-white/[0.05] hover:text-stone-300"
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

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              More
            </p>
            {[
              { href: "/mood", label: "Mood" },
              { href: "/breathe", label: "Breathe" },
              { href: "/insights", label: "Insights" },
              { href: "/coaching", label: "Practice" },
              { href: "/people", label: "Circle" },
              { href: "/achievements", label: "Achievements" },
              { href: "/timeline", label: "Timeline" },
              { href: "/companion", label: "Companion" },
              { href: "/score", label: "Life Score" },
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
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "text-stone-500 hover:bg-white/[0.05] hover:text-stone-300"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/[0.04] bg-[#0b1210]/85 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl md:hidden">
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
              data-tutorial={item.href === "/talk" ? "nav-talk" : item.href === "/home" ? "nav-home" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
                active ? "text-emerald-400" : "text-stone-500"
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
