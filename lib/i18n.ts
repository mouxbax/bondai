/**
 * i18n re-exports from the main provider
 * All i18n functionality is in i18n-provider.tsx
 */
export type { Locale } from "./i18n-provider";
export { useLocale, useTranslation, useCurrentLocale, LocaleProvider } from "./i18n-provider";

export interface LocaleOption {
  code: "en" | "fr";
  label: string;
}

export const AVAILABLE_LOCALES: LocaleOption[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Fran\u00e7ais" },
];
