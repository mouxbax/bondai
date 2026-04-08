"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-stone-100 bg-[#FAFAF8]/90 px-4 py-3 backdrop-blur-md dark:border-stone-800 dark:bg-[#0f1412]/90 md:px-6">
      <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">{title}</h1>
      <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
