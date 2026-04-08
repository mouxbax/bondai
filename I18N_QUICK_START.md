# BondAI i18n Quick Start Guide

## 30-Second Overview

BondAI now has **English + French** support with zero dependencies. Add to any component in 2 lines:

```typescript
const { t } = useTranslation();
return <button>{t("common.save")}</button>;
```

## Installation

✅ **Already installed!** Nothing to do. System is ready to use.

## 5-Minute Setup

### 1. Add Language Switcher to Header
Edit `components/layout/Header.tsx`:

```typescript
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Header({ title }: { title: string }) {
  return (
    <header className="...">
      <h1>{title}</h1>
      <LanguageSwitcher />  {/* Add this */}
    </header>
  );
}
```

### 2. Convert One Component
Edit any component (e.g., `components/layout/AppNav.tsx`):

```typescript
"use client";

import { useTranslation } from "@/lib/i18n-provider";
import { Home, MessageCircle, Target, GraduationCap, Activity } from "lucide-react";

const items = [
  { href: "/home", label: "home", icon: Home },      // key instead of label
  { href: "/chat", label: "chat", icon: MessageCircle },
  { href: "/coaching", label: "coach", icon: GraduationCap },
  { href: "/goals", label: "goals", icon: Target },
  { href: "/score", label: "score", icon: Activity },
];

export function AppNav() {
  const { t } = useTranslation();
  
  return (
    <nav>
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          {t(`nav.${item.label}`)}  {/* Use t() function */}
        </Link>
      ))}
    </nav>
  );
}
```

### 3. Test It
- Open browser DevTools
- Go to Console and run: `localStorage.setItem('bondai-locale', 'fr')`
- Refresh page
- UI should be in French now!

## Common Patterns

### Simple Text
```typescript
<p>{t("common.loading")}</p>
```

### Dynamic Keys
```typescript
const key = `nav.${item}`; // nav.home, nav.chat, etc.
<span>{t(key)}</span>
```

### Fallback (if key missing)
```typescript
const text = t("nonexistent.key") || "Fallback text";
// Returns "nonexistent.key" string, falls back to English
```

### Get Current Locale
```typescript
const { locale } = useLocale();
if (locale === "fr") {
  // Do something French-specific
}
```

### Switch Locale
```typescript
const { setLocaleState } = useLocale();
<button onClick={() => setLocaleState("fr")}>French</button>
```

## Available Hooks

### useTranslation()
```typescript
const { t } = useTranslation();
t("any.key") // Returns translated string or key
```

### useLocale()
```typescript
const { locale, setLocaleState, t } = useLocale();
locale           // "en" or "fr"
setLocaleState   // Change language
t                // Translate key
```

### useCurrentLocale()
```typescript
const locale = useCurrentLocale(); // "en" or "fr"
```

## Available Translations

### Navigation
- `nav.home` - "Home" / "Accueil"
- `nav.chat` - "Chat"
- `nav.coach` - "Coach"
- `nav.goals` - "Goals" / "Objectifs"
- `nav.score` - "Score"

### Dashboard
- `dashboard.title` - "Home" / "Accueil"
- `dashboard.daily_checkin` - "Daily Check-in" / "Enregistrement quotidien"
- `dashboard.quick_actions` - "Quick actions" / "Actions rapides"
- `dashboard.open_chats` - "Open chats" / "Ouvrir les chats"
- `dashboard.practice_scenario` - "Practice a scenario" / "Pratiquer un scénario"

### Common
- `common.save` - "Save" / "Enregistrer"
- `common.cancel` - "Cancel" / "Annuler"
- `common.delete` - "Delete" / "Supprimer"
- `common.loading` - "Loading..." / "Chargement..."
- `common.error` - "Something went wrong" / "Une erreur est survenue"

### Chat
- `chat.input_placeholder` - "Message your AI companion..." / "Messagez votre compagnon IA..."
- `chat.send` - "Send" / "Envoyer"

### Auth
- `auth.login` - "Log in" / "Se connecter"
- `auth.sign_up` - "Sign up" / "S'inscrire"
- `auth.sign_out` - "Sign out" / "Se déconnecter"

**Full list**: See `locales/en.json` and `locales/fr.json`

## Adding New Translations

### 1. Add to en.json
```json
{
  "myfeature": {
    "mykey": "English text here"
  }
}
```

### 2. Add to fr.json
```json
{
  "myfeature": {
    "mykey": "Texte français ici"
  }
}
```

### 3. Use in component
```typescript
const { t } = useTranslation();
<p>{t("myfeature.mykey")}</p>
```

## Key Naming Convention

Use **lowercase_with_underscores**:
- ✅ `chat.input_placeholder`
- ✅ `goals.status.active`
- ❌ `chat.inputPlaceholder` (camelCase)
- ❌ `goals.StatusActive` (PascalCase)

## Debugging

### Key not translating?
1. Check key exists in both `en.json` and `fr.json`
2. Check exact key path (case-sensitive)
3. Mark component with `"use client"` directive
4. Verify `LocaleProvider` wraps the app (already done)

### Locale not persisting?
```javascript
// Check localStorage
console.log(localStorage.getItem('bondai-locale')); // Should show "en" or "fr"

// Check cookie
console.log(document.cookie); // Should show bondai-locale=en or bondai-locale=fr
```

### Component not updating?
Use `useLocale()` instead of `useCurrentLocale()`:
```typescript
const { locale } = useLocale();  // ✅ Will trigger re-render
const locale2 = useCurrentLocale(); // ⚠️ May not trigger re-render
```

## Translation Statistics

| Language | Keys | Coverage |
|----------|------|----------|
| English | 173 | 100% |
| French | 173 | 100% |

## Performance Tips

- Translations load asynchronously, so no delay at startup
- Use `t()` for dynamic keys, not string concatenation
- Don't call hooks in loops (use the value before the loop)

## Gotchas

⚠️ **Locale won't change without component re-render**
- Simple solution: Add to component that uses useLocale()
- Full reload works always: `window.location.reload()`

⚠️ **Need client component**
- All i18n components must have `"use client"` at top
- Server components can't use hooks

⚠️ **TypeScript users**
- Translation keys are not type-checked (strings)
- Typos will return the key string as fallback

## Next Steps

1. ✅ System is ready - go convert components!
2. Start with high-visibility components (Header, Nav)
3. Test thoroughly in both en and fr
4. Gradually convert remaining hardcoded strings
5. Add language selector to user settings/onboarding

## Questions?

See full docs: `I18N_SETUP.md`
See implementation details: `I18N_IMPLEMENTATION_SUMMARY.md`

---

**Quick Test**:
```javascript
// Paste in browser console to test:
localStorage.setItem('bondai-locale', 'fr');
location.reload();
// Page should refresh in French!
```

Happy translating! 🎉
