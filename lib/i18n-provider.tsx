"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "en" | "fr";

interface LocaleContextType {
  locale: Locale;
  setLocaleState: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Translation storage
// eslint-disable-next-line prefer-const, @typescript-eslint/no-explicit-any
let translations: Record<Locale, Record<string, any>> = {
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
 * Deep get translation value by dot notation key
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTranslation(obj: any, path: string): string {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof current === "string" ? current : path;
}

/**
 * Translation function - looks up key in specified locale
 */
function t(key: string, locale: Locale): string {
  const value = getTranslation(translations[locale], key);
  // Fallback to English if key not found in requested locale
  if (value === key && locale !== "en") {
    return getTranslation(translations.en, key);
  }
  return value;
}

interface LocaleProviderProps {
  children: ReactNode;
}

/**
 * Locale Provider Component
 * Wraps app and manages locale state and context
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize from localStorage or cookie or browser language
    const storedLocale = localStorage.getItem("aiah-locale");
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("aiah-locale="))
      ?.split("=")[1];

    let initialLocale: Locale = "en";

    if (storedLocale === "en" || storedLocale === "fr") {
      initialLocale = storedLocale;
    } else if (cookieLocale === "en" || cookieLocale === "fr") {
      initialLocale = cookieLocale;
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      initialLocale = browserLang === "fr" ? "fr" : "en";
    }

    setLocale(initialLocale);
    localStorage.setItem("aiah-locale", initialLocale);
    document.documentElement.lang = initialLocale;
    document.cookie = `aiah-locale=${initialLocale}; path=/; max-age=31536000`;
    setMounted(true);
  }, []);

  const setLocaleState = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("aiah-locale", newLocale);
    document.documentElement.lang = newLocale;
    document.cookie = `aiah-locale=${newLocale}; path=/; max-age=31536000`;
    // Dispatch custom event so components can react to locale change
    window.dispatchEvent(
      new CustomEvent("localechange", { detail: { locale: newLocale } })
    );
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocaleState,
        t: (key: string) => t(key, locale),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to use locale context in components
 * Returns locale, setLocaleState, and t function
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

/**
 * Hook to get just the t function
 * Useful for components that only need translations
 */
export function useTranslation() {
  const { t } = useLocale();
  return { t };
}

/**
 * Hook to get the current locale
 */
export function useCurrentLocale() {
  const { locale } = useLocale();
  return locale;
}
