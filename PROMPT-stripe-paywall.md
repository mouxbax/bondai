# Stripe Paywall — Remove Free Tier, Force 7-Day Trial with Card

## Goal
No user should access the app without starting a 7-day trial and entering their card details. After 7 days, auto-charge kicks in. Remove the free tier entirely.

## Current State (already built)
- Stripe checkout at `app/api/stripe/checkout/route.ts` — already has `trial_period_days: 7` and `payment_method_collection: "always"`
- Webhook at `app/api/stripe/webhook/route.ts` — handles checkout.session.completed, subscription.updated, subscription.deleted
- Billing portal at `app/api/stripe/portal/route.ts`
- User model has: `subscriptionStatus` (free/trialing/active/canceled/past_due), `subscriptionPlan` (free/plus/care_plus), `trialEnd`, `currentPeriodEnd`, `stripeCustomerId`
- Stripe products: Plus ($9/mo, price_1TJxK874qNRG6c1R8tFGLEn1), Care+ ($19/mo, price_1TJxK974qNRG6c1RfE8gwLMO)
- Subscribe page at `app/(app)/subscribe/page.tsx` — shows Free/Plus/Care+ tiers
- Feature gating exists in cron job (dispatch-nudges) based on plan

## What to Change

### 1. Add Subscription Gate Middleware

Create or modify `middleware.ts` (or the app layout at `app/(app)/layout.tsx`) to check subscription status before allowing access to any app route.

**Logic:**
```
If user is authenticated AND (subscriptionStatus === "trialing" OR subscriptionStatus === "active"):
  → Allow access to app
If user is authenticated AND subscriptionStatus is "free", "canceled", or "past_due":
  → Redirect to /subscribe
If not authenticated:
  → Redirect to /login (this already works)
```

**Exempt routes** (don't gate these):
- `/subscribe` — they need to see this to pick a plan
- `/api/stripe/*` — webhook and checkout need to work
- `/api/auth/*` — auth needs to work
- `/account` — so they can manage billing even if expired
- `/api/account` — account API
- All auth pages (`/login`, `/signup`, `/onboarding`, `/forgot-password`, `/reset-password`)
- Landing page (`/`)

**Best approach:** Do this check in `app/(app)/layout.tsx` since it already fetches the user session. After getting the user, check `subscriptionStatus`. If not trialing/active, redirect to `/subscribe`. This is simpler than middleware and already has the auth context.

```tsx
// In app/(app)/layout.tsx, after getting the user:
const activeStatuses = ["trialing", "active"];
if (!activeStatuses.includes(user.subscriptionStatus)) {
  redirect("/subscribe");
}
```

### 2. Update Subscribe Page — Remove Free Tier

**File:** `app/(app)/subscribe/page.tsx`

Remove the Free tier card entirely. Show only two options:

**AIAH Plus** — $9/month
- 7-day free trial
- Unlimited check-ins
- Full coaching scenarios
- Voice mode
- Priority AI responses
- "Start 7-day free trial" button

**AIAH Care+** — $19/month
- 7-day free trial
- Everything in Plus
- Family sharing (up to 3)
- Advanced analytics
- Priority support
- "Start 7-day free trial" button

Both buttons should call `/api/stripe/checkout` with the respective priceId.

**Add trust signals:**
- "Cancel anytime during your trial"
- "No charge for 7 days"
- "You won't be charged until [date 7 days from now]"

**Important UX:** This page should also be accessible to users who are NOT fully onboarded yet. After signup + onboarding, redirect to `/subscribe` instead of `/home`. The flow becomes:

```
Signup → Onboarding (5 steps) → /subscribe (pick plan + enter card) → /home
```

### 3. Update Onboarding Redirect

**File:** Check `app/api/onboarding/route.ts` and/or `app/(app)/onboarding/page.tsx`

After onboarding completes, redirect to `/subscribe` instead of creating a chat and going to `/chat`. The first chat should only happen after they've started their trial.

Or better: let onboarding complete as normal, and let the layout gate (from step 1) catch them and redirect to `/subscribe` automatically. This is cleaner.

### 4. Update Landing Page Pricing Section

**File:** Check the landing page component (likely `app/(marketing)/page.tsx` or `app/page.tsx`)

Remove the Free tier from the pricing section. Show only Plus and Care+ with "Start 7-day free trial" CTAs. Remove "Get started" (free) button.

### 5. Update Stripe Product Names (cosmetic)

The Stripe products are named "BondAI Plus" and "BondAI Care+". Update them to "AIAH Plus" and "AIAH Care+" in the Stripe dashboard (or via API). This shows on receipts and invoices.

Also update any hardcoded "BondAI" references in:
- `lib/stripe.ts` — check `getPlanDisplayName()` or similar
- Subscribe page copy
- Email templates

### 6. Handle Expired/Canceled Users Gracefully

When a user's trial expires or subscription is canceled and they try to access the app:

**On `/subscribe` page**, show a message like:
- If `subscriptionStatus === "canceled"`: "Your subscription has ended. Reactivate to continue using AIAH."
- If `subscriptionStatus === "past_due"`: "Your payment failed. Please update your payment method." + link to billing portal
- If `subscriptionStatus === "free"` (never subscribed): "Start your 7-day free trial to begin."

### 7. Update the Subscribe Page to NOT Require Auth Layout Gate

The `/subscribe` page needs to be accessible even when the user's subscription is expired. Make sure the layout gate (step 1) exempts `/subscribe` from the redirect:

```tsx
// In app/(app)/layout.tsx
const pathname = headers().get("x-pathname") || "";
const exemptPaths = ["/subscribe", "/account"];
const activeStatuses = ["trialing", "active"];

if (!exemptPaths.some(p => pathname.startsWith(p)) && !activeStatuses.includes(user.subscriptionStatus)) {
  redirect("/subscribe");
}
```

### 8. Webhook — Ensure Trial End Triggers Charge

The existing webhook already handles `customer.subscription.updated` which Stripe fires when trial ends and first charge happens. Verify that:
- When trial ends successfully → status changes from "trialing" to "active"
- When trial ends and payment fails → status changes to "past_due"
- Both are already handled in the webhook code

### 9. IMPORTANT — Don't Break Existing Users

If you (Moustafa) or any test accounts already exist with `subscriptionStatus: "free"`, they'll get locked out after this change. Before deploying:
- Either manually set your own user's `subscriptionStatus` to "active" in the database
- Or go through the checkout flow yourself after deploying

Run this SQL on Supabase to keep your account active:
```sql
UPDATE "User" SET "subscriptionStatus" = 'active', "subscriptionPlan" = 'care_plus' WHERE email = 'moustafabahri@gmail.com';
```

## Files to modify:
- `app/(app)/layout.tsx` — add subscription gate redirect
- `app/(app)/subscribe/page.tsx` — remove free tier, update UI
- Landing page component — remove free tier from pricing
- `app/api/onboarding/route.ts` — optionally change redirect
- `lib/stripe.ts` — update any "BondAI" references to "AIAH"

## Flow after changes:
```
New user → Landing page → "Start free trial" → Signup → Onboarding → /subscribe → Pick Plus or Care+ → Stripe Checkout (card required) → 7-day trial starts → /home (full access)

Trial expires → Auto-charge → subscriptionStatus: "active" → Continue using app

Payment fails → subscriptionStatus: "past_due" → Redirected to /subscribe → "Update payment" → Billing portal

User cancels → subscriptionStatus: "canceled" → Redirected to /subscribe → "Reactivate" option
```

## Test:
1. New signup should land on /subscribe after onboarding
2. Can't access /home, /talk, /mood etc. without active subscription
3. Checkout creates 7-day trial with card on file
4. After checkout, user lands on /home with full access
5. Existing users (you) still have access (run the SQL above first)
