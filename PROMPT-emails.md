# Build AIAH Email Template System

## Context

AIAH is a mental wellness companion app. Brand identity: warm, human, calm, supportive — like a thoughtful friend, not a corporation. The app helps people feel less alone through daily check-ins, mood tracking, social skills practice, and AI conversation.

**Brand colors:**
- Primary green: `#1D9E75` (buttons, links, accents)
- Dark background: `#0f1412`
- Warm off-white: `#fafaf8`
- Text dark: `#1c1917`
- Text muted: `#78716c`
- Accent amber: `#f59e0b`

**Brand voice:** Warm, gentle, direct. Never corporate. Like a friend texting you, not a SaaS platform emailing you. Short sentences. Human.

**Existing setup:**
- `lib/email.ts` already has Resend integration with `sendEmail({ to, subject, html, text })` function
- Uses `process.env.RESEND_API_KEY` and `process.env.EMAIL_FROM` (defaults to `"AIAH <onboarding@resend.dev>"`)
- One template exists: `passwordResetEmail()` — use this as the pattern for new ones
- NextAuth v5 in `auth.ts`
- Account deletion endpoint exists at `DELETE /api/account`
- Onboarding completion at `POST /api/onboarding`
- Prisma + Supabase PostgreSQL

## What to Build

### 1. Email Templates in `lib/email.ts`

Add these template functions following the same pattern as `passwordResetEmail()`. Each should return `{ subject, html, text }`. All emails should share a consistent layout:

**Shared layout structure:**
```
- Max-width 520px, centered
- Background: #fafaf8
- AIAH logo/wordmark at top (just the text "AIAH" in #1D9E75, bold, 24px)
- Content area with generous padding
- Footer: "AIAH — Built with care" + unsubscribe link (where applicable) + muted text
- No heavy imagery, keep it lightweight and fast-loading
```

**Template functions to create:**

#### a) `welcomeEmail(name: string)`
- Subject: "Welcome to AIAH, {name}"
- Tone: Warm, personal. Like a friend saying "glad you're here"
- Content: Short welcome message, what to expect (daily check-ins, mood tracking, someone to talk to), single CTA button "Open AIAH" linking to https://aiah.app/home
- One line about privacy: "Everything you share stays between us."

#### b) `emailVerificationEmail(name: string, verificationUrl: string)`
- Subject: "Verify your email"
- Tone: Simple, no fluff
- Content: "Hey {name}, just confirming it's you." + verification button + "This link expires in 24 hours" + fallback plain URL below button

#### c) `passwordResetEmail(name, resetUrl)` — ALREADY EXISTS, leave as is

#### d) `passwordChangedEmail(name: string)`
- Subject: "Your password was changed"
- Tone: Security notification, calm but clear
- Content: Confirm password was changed, "If this wasn't you, reset your password immediately" with link to /forgot-password

#### e) `weeklyDigestEmail(name: string, stats: { checkins: number, streak: number, moodTrend: string, xpEarned: number })`
- Subject: "Your week with AIAH"
- Tone: Encouraging, celebrating progress no matter how small
- Content: Quick stats (check-ins this week, current streak, mood trend, XP earned), a gentle nudge if low activity ("Even showing up counts"), CTA "See your insights" → /insights

#### f) `nudgeEmail(name: string, message: string)`
- Subject: "Hey {name}, checking in"
- Tone: Gentle, not pushy. Like a friend who noticed you've been quiet.
- Content: Short personalized message, CTA "Talk to AIAH" → /talk
- Used when user hasn't opened the app in 3+ days

#### g) `accountDeletedEmail(name: string)`
- Subject: "We'll miss you, {name}"
- Tone: Respectful, no guilt-tripping, genuine warmth
- Content: Confirm data has been deleted. "If you ever want to come back, we'll be here." Brief — max 3-4 sentences. No CTA button (they're leaving, respect that). Maybe just the AIAH wordmark and the message.

#### h) `accountDeletedFeedbackEmail(name: string, feedbackUrl: string)`
- Actually skip this — fold a single optional line into accountDeletedEmail: "If you have a moment, we'd love to know why — [share feedback](url)"

### 2. API Integration Points

#### a) Send welcome email after signup
In the signup flow (check `app/api/auth/signup/route.ts` or wherever new users are created via credentials), after successfully creating the user, call:
```ts
const { subject, html, text } = welcomeEmail(user.name);
await sendEmail({ to: user.email, subject, html, text });
```

Also add it to the Google OAuth flow — in `auth.ts` events.createUser callback (NextAuth fires this on first-time OAuth signup):
```ts
events: {
  createUser: async ({ user }) => {
    const { subject, html, text } = welcomeEmail(user.name || "there");
    await sendEmail({ to: user.email!, subject, html, text });
  }
}
```

#### b) Send goodbye email on account deletion
In `app/api/account/route.ts` DELETE handler, BEFORE deleting the user (so you still have their email), send:
```ts
const { subject, html, text } = accountDeletedEmail(user.name);
await sendEmail({ to: user.email, subject, html, text });
```

#### c) Send password changed email
If there's a password change endpoint (check `app/api/account/` or `app/api/auth/reset-password/`), add the `passwordChangedEmail` call after successful password update.

### 3. Weekly Digest Cron (optional — if time permits)

Create `app/api/cron/weekly-digest/route.ts`:
- Runs weekly (add to `vercel.json` crons: `"0 9 * * 1"` — Monday 9 AM)
- Query all users who have opted in (you may need to add a `weeklyDigestEnabled Boolean @default(true)` to the User model)
- For each user, gather stats from the past 7 days and send `weeklyDigestEmail`
- Rate limit: batch sends, don't blast all at once

### 4. Email Preferences

Add to Account settings page (`app/(app)/account/page.tsx` or similar):
- Toggle for weekly digest emails
- Toggle for nudge/re-engagement emails
- Add fields to Prisma User model if needed:
  ```prisma
  emailDigestEnabled  Boolean @default(true)
  emailNudgesEnabled  Boolean @default(true)
  ```

## Design Rules for All Templates

1. **Mobile-first** — 520px max-width, 16px+ font size for body
2. **Single column** — no complex layouts
3. **One CTA max** per email — big green button (#1D9E75), white text, rounded corners (8px), padding 14px 32px
4. **No images** except the AIAH wordmark (use text, not an image file)
5. **Dark mode compatible** — use inline styles, not CSS classes
6. **Plain text version** for every email
7. **Consistent footer**: `AIAH · Built with care` + unsubscribe where relevant
8. **Short** — no email should be more than ~150 words of body copy
9. **Button style**: `background-color: #1D9E75; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;`

## Files to modify:
- `lib/email.ts` — add all template functions
- `app/api/auth/signup/route.ts` (or wherever credentials signup happens) — send welcome email
- `auth.ts` — add createUser event for OAuth welcome email
- `app/api/account/route.ts` — send goodbye email before deletion
- `app/api/auth/reset-password/route.ts` (if exists) — send password changed email
- `prisma/schema.prisma` — add email preference fields if implementing digest/nudge toggles
- `vercel.json` — add weekly digest cron if implementing

## Test
- Create a new account → should receive welcome email
- Delete account → should receive goodbye email
- Reset password → should receive password changed email
- All emails render well on Gmail, Apple Mail (test with Resend's preview or Litmus)
