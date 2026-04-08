"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "en" | "fr";

export interface LocaleOption {
  code: Locale;
  label: string;
}

export const AVAILABLE_LOCALES: LocaleOption[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

// Locale context
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Translation storage
let translations: Record<Locale, Record<string, string>> = {
  en: {},
  fr: {},
};

// Initialize translations
async function loadTranslations() {
  try {
    const [enModule, frModule] = await Promise.all([
      import("@/locales/en.json"),
      import("@/locales/fr.json"),
    ]);
    translations.en = enModule.default;
    translations.fr = frModule.default;
  } catch (error) {
    console.error("Failed to load translations:", error);
  }
}

// Load translations immediately
loadTranslations();

/**
 * Translation function - looks up key in current locale
 * Falls back to English if key not found
 */
export function t(key: string, locale: Locale = "en"): string {
  const parts = key.split(".");
  let value: any = translations[locale];

  for (const part of parts) {
    if (value && typeof value === "object") {
      value = value[part];
    } else {
      // Fallback to English if key not found
      value = translations.en;
      for (const p of parts) {
        if (value && typeof value === "object") {
          value = value[p];
        } else {
          return key; // Return key if not found anywhere
        }
      }
      return value || key;
    }
  }

  return typeof value === "string" ? value : key;
}

/**
 * Locale context provider - wraps app and manages locale state
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize from localStorage or browser language
    const stored = localStorage.getItem("bondai-locale");
    if (stored === "en" || stored === "fr") {
      setLocaleState(stored);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      const initialLocale = browserLang === "fr" ? "fr" : "en";
      setLocaleState(initialLocale);
      localStorage.setItem("bondai-locale", initialLocale);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("bondai-locale", newLocale);
    // Trigger app rerender
    document.documentElement.lang = newLocale;
  };

  if (!mounted) {
    return children;
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: (key: string) => t(key, locale),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to use locale context in components
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

/**
 * Set locale programmatically
 */
export function setLocale(locale: Locale) {
  localStorage.setItem("bondai-locale", locale);
  document.documentElement.lang = locale;
  window.location.reload(); // Simple way to trigger full app rerender
}
