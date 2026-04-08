"use client";

import { useLocale } from "@/lib/i18n-provider";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const LOCALE_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
};

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
};

/**
 * Language Switcher Component
 * Displays current language with flag and allows switching between en/fr
 * Can be placed in header/nav area
 */
export function LanguageSwitcher() {
  const { locale, setLocaleState } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const currentFlag = LOCALE_FLAGS[locale];
  const currentLabel = LOCALE_LABELS[locale];

  const handleLocaleChange = (newLocale: "en" | "fr") => {
    setLocaleState(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
      >
        <span className="text-base">{currentFlag}</span>
        <span className="hidden sm:inline">{currentLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800 z-50">
          <button
            onClick={() => handleLocaleChange("en")}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 first:rounded-t-lg border-b border-stone-100 dark:border-stone-700 last:border-0 last:rounded-b-lg"
          >
            <span className="text-base">{LOCALE_FLAGS.en}</span>
            <span>{LOCALE_LABELS.en}</span>
            {locale === "en" && (
              <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400">
                ✓
              </span>
            )}
          </button>
          <button
            onClick={() => handleLocaleChange("fr")}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 first:rounded-t-lg border-b border-stone-100 dark:border-stone-700 last:border-0 last:rounded-b-lg"
          >
            <span className="text-base">{LOCALE_FLAGS.fr}</span>
            <span>{LOCALE_LABELS.fr}</span>
            {locale === "fr" && (
              <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400">
                ✓
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
