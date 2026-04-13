"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/i18n-provider";
import { MoodProvider } from "@/lib/mood-context";
import { CelebrationProvider } from "@/components/fx/Celebration";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MoodProvider>
            <CelebrationProvider>
              <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            </CelebrationProvider>
          </MoodProvider>
        </ThemeProvider>
      </SessionProvider>
    </LocaleProvider>
  );
}
