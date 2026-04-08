# BondAI Multi-Language Support Setup

## Overview

A lightweight custom i18n (internationalization) system has been implemented for BondAI supporting English and French. This system works **without any npm packages** and uses React Context for state management.

## Architecture

### Core Files Created

1. **`lib/i18n-provider.tsx`** - React Context provider component
   - Manages locale state
   - Loads translations from JSON files
   - Provides `useLocale()` hook to access translations
   - Handles localStorage and browser language detection

2. **`lib/i18n.ts`** - Legacy utility file (for reference)
   - Contains helper functions for translations
   - Not required for the current setup (use i18n-provider instead)

3. **`locales/en.json`** - English translations (173 keys)
   - Organized by feature: nav, landing, onboarding, dashboard, chat, coaching, goals, score, auth, common

4. **`locales/fr.json`** - French translations (173 keys)
   - 1:1 mapping with English translations

5. **`components/layout/LanguageSwitcher.tsx`** - Language selector UI
   - Dropdown component to switch between en/fr
   - Shows flag emoji (🇬🇧/🇫🇷) and language name
   - Can be placed in header/nav

6. **`components/providers.tsx`** - Updated to include LocaleProvider

## How to Use

### In Components (Client-Side)

```typescript
"use client";

import { useLocale } from "@/lib/i18n-provider";

export function MyComponent() {
  const { locale, setLocaleState, t } = useLocale();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>Current locale: {locale}</p>
      <button onClick={() => setLocaleState("fr")}>
        Switch to French
      </button>
    </div>
  );
}
```

### Using useTranslation Hook (Simpler)

```typescript
"use client";

import { useTranslation } from "@/lib/i18n-provider";

export function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t("dashboard.title")}</h1>;
}
```

### Using LanguageSwitcher Component

Add to your header/nav:

```typescript
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Header() {
  return (
    <header>
      <nav>
        {/* ... nav items ... */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

## Translation Key Naming Convention

Keys use dot notation organized by feature:

```
feature.subfeature.key

Examples:
- nav.home
- dashboard.title
- chat.input_placeholder
- coaching.scenario.difficult_conversation.title
- common.save
```

## Adding New Translations

1. Add the key-value pair to `locales/en.json`:

```json
{
  "myfeature": {
    "mykey": "English text"
  }
}
```

2. Add the corresponding translation to `locales/fr.json`:

```json
{
  "myfeature": {
    "mykey": "Texte français"
  }
}
```

3. Use in component:

```typescript
const { t } = useTranslation();
<p>{t("myfeature.mykey")}</p>
```

## Key Features

- **No external dependencies**: Uses only React built-ins
- **localStorage persistence**: User's language choice is saved
- **Browser language detection**: Falls back to browser language if not previously set
- **Fallback to English**: If a key is missing in French, it falls back to English
- **Full type safety**: TypeScript support throughout
- **Automatic document updates**: Changes `document.documentElement.lang` for accessibility
- **Cookie support**: Locale is also saved in a cookie for consistency
- **Custom events**: Dispatches `localechange` event when locale changes

## Storage & Detection

The system stores the user's locale choice in:
1. **localStorage** (`bondai-locale` key)
2. **Cookie** (`bondai-locale` with 1-year expiry)
3. **HTML lang attribute** (for accessibility)

On first visit, it detects the browser language via `navigator.language`.

## Translation Statistics

- **Total keys**: 173 (same for both languages)
- **Sections**:
  - Navigation: 5 keys
  - Landing page: 28 keys
  - Onboarding: 9 keys
  - Dashboard: 10 keys
  - Chat: 9 keys
  - Coaching: 15 keys
  - Goals: 18 keys
  - Score: 18 keys
  - Authentication: 13 keys
  - Common/Shared: 28 keys

## Next Steps

1. **Add LanguageSwitcher to Header**: Import and add to `components/layout/Header.tsx`
2. **Convert existing components**: Replace hardcoded strings with `t()` calls
3. **Test both languages**: Verify all translations display correctly
4. **Add language selection in onboarding**: Let users choose language during signup

## Example: Converting a Component

Before:
```typescript
export function ChatInput() {
  return (
    <input
      placeholder="Message your AI companion..."
      type="text"
    />
  );
}
```

After:
```typescript
"use client";

import { useTranslation } from "@/lib/i18n-provider";

export function ChatInput() {
  const { t } = useTranslation();
  
  return (
    <input
      placeholder={t("chat.input_placeholder")}
      type="text"
    />
  );
}
```

## Troubleshooting

**Keys showing as [key-name] instead of translation?**
- Check that the key exists in both `en.json` and `fr.json`
- Verify key path matches exactly (case-sensitive)
- Check that LocaleProvider wraps your component

**Translations not updating when switching languages?**
- Ensure component uses `useLocale()` hook inside LocaleProvider
- Component must be marked with "use client" directive
- Verify LocaleProvider is in the Provider chain

**Locale not persisting on page reload?**
- Check that localStorage is enabled in browser
- Verify `bondai-locale` key in localStorage after setting locale

## References

- Current locale state: Available via `useCurrentLocale()` hook
- Set locale programmatically: `setLocaleState("fr")` or `setLocaleState("en")`
- Access full context: Use `useLocale()` hook which returns `{ locale, setLocaleState, t }`
