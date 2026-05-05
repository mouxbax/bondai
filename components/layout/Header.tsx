"use client";

import * as React from "react";
import Link from "next/link";
import { Moon, Sun, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-[#FAFAF8]/70 px-4 py-3 backdrop-blur-2xl dark:bg-[#0f1412]/70 md:px-6 safe-area-top" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0.75rem))" }}>
      <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">{title}</h1>
      <div className="flex items-center gap-1">
        {right}
        {mounted ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        ) : (
          <span className="h-10 w-10" />
        )}
        <Button asChild variant="ghost" size="icon" aria-label="Account">
          <Link href="/account">
            <UserCircle2 className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
