'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, ShieldCheck, CreditCard, Calendar } from 'lucide-react';
import Link from 'next/link';

type TierId = 'plus' | 'care_plus';

type PricingTier = {
  id: TierId;
  name: string;
  price: number;
  description: string;
  features: string[];
  priceId?: string;
  highlight?: boolean;
};

type AccountSummary = {
  subscriptionStatus: 'free' | 'trialing' | 'active' | 'canceled' | 'past_due';
  subscriptionPlan: 'free' | 'plus' | 'care_plus';
};

const TIERS: PricingTier[] = [
  {
    id: 'plus',
    name: 'AIAH Plus',
    price: 9,
    description: 'Everything you need to take control of your life.',
    features: [
      'AI life coaching (schedule, budget, goals, fitness)',
      'Unlimited conversations + voice mode',
      'Priority AI responses',
      'Goal, habit & mood tracking',
      'Custom training programs',
      'Personalized daily action plans',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS,
    highlight: true,
  },
  {
    id: 'care_plus',
    name: 'AIAH Care+',
    price: 19,
    description: 'For full life optimization + family sharing.',
    features: [
      'Everything in Plus',
      'Family sharing (up to 3)',
      'Advanced analytics & weekly reports',
      'Budget & spending insights',
      'Priority support',
      'Early access to new features',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CARE_PLUS,
  },
];

function trialEndDateLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);

  const showCanceledMessage = searchParams.get('checkout') === 'canceled';

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/account', { cache: 'no-store' });
        if (!res.ok) return;
        const j = (await res.json()) as { user: AccountSummary };
        setAccount({
          subscriptionStatus: j.user.subscriptionStatus,
          subscriptionPlan: j.user.subscriptionPlan,
        });
      } catch {
        // ignore — page still works for fresh users
      }
    })();
  }, []);

  const handleCheckout = async (priceId?: string) => {
    if (!priceId) {
      setError('Plans are not configured yet. Set NEXT_PUBLIC_STRIPE_PRICE_PLUS / _CARE_PLUS.');
      return;
    }

    setLoadingPlan(priceId);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan('portal');
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to access subscription portal');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  };

  // Status-aware banner copy.
  const statusBanner = (() => {
    if (!account) return null;
    if (account.subscriptionStatus === 'canceled') {
      return {
        tone: 'amber' as const,
        text: 'Your subscription has ended. Reactivate to continue using AIAH.',
      };
    }
    if (account.subscriptionStatus === 'past_due') {
      return {
        tone: 'rose' as const,
        text: "Your last payment didn't go through. Update your payment method to keep going.",
        action: { label: 'Update payment method', onClick: handleManageSubscription },
      };
    }
    if (account.subscriptionStatus === 'free') {
      return {
        tone: 'emerald' as const,
        text: 'Start your 7-day free trial to begin. Cancel anytime — no charge until your trial ends.',
      };
    }
    return null;
  })();

  const trialDate = trialEndDateLabel();

  return (
    <div className="bg-[#FAFAF8] text-stone-900 dark:bg-[#0f1412] dark:text-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
          Choose your AIAH
        </h1>
        <p className="text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
          7 days free. Cancel anytime during the trial — you won&apos;t be charged until {trialDate}.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1D9E75]" /> Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#1D9E75]" /> No charge for 7 days
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#1D9E75]" /> Card on file required
          </span>
        </div>
      </div>

      {/* Status / canceled banners */}
      {statusBanner && (
        <div
          className={`max-w-5xl mx-auto mb-6 p-4 rounded-xl border ${
            statusBanner.tone === 'amber'
              ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200'
              : statusBanner.tone === 'rose'
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-200'
          } flex items-start justify-between gap-3`}
        >
          <p className="text-sm">{statusBanner.text}</p>
          {'action' in statusBanner && statusBanner.action && (
            <button
              onClick={statusBanner.action.onClick}
              className="text-sm font-medium underline shrink-0"
            >
              {statusBanner.action.label}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {showCanceledMessage && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            Checkout was canceled. Try again whenever you&apos;re ready.
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
      >
        {TIERS.map((tier) => {
          const isCurrent = account?.subscriptionPlan === tier.id;
          const ctaLabel = isCurrent ? 'Current plan' : 'Start 7-day free trial';
          return (
            <motion.div
              key={tier.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              whileHover={{ y: -3 }}
              className={`relative bg-white dark:bg-stone-900 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border ${
                tier.highlight
                  ? 'border-[#1D9E75]/60 ring-2 ring-[#1D9E75]/30'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-4 right-4 bg-[#1D9E75] text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Most chosen
                </div>
              )}

              <div className="p-7">
                <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm mb-5">
                  {tier.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-stone-500 dark:text-stone-400 ml-1">/month</span>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    after your free 7 days
                  </div>
                </div>

                <Button
                  onClick={() => !isCurrent && handleCheckout(tier.priceId)}
                  disabled={loadingPlan !== null || isCurrent}
                  className={`w-full py-3 rounded-xl font-semibold mb-6 transition-all ${
                    isCurrent
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-default'
                      : 'bg-[#1D9E75] text-white hover:bg-[#16805f] disabled:opacity-75'
                  }`}
                >
                  {loadingPlan === tier.priceId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Loading…
                    </>
                  ) : (
                    ctaLabel
                  )}
                </Button>

                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#1D9E75] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-stone-700 dark:text-stone-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Manage Subscription */}
      {account && (account.subscriptionStatus === 'active' || account.subscriptionStatus === 'trialing' || account.subscriptionStatus === 'past_due' || account.subscriptionStatus === 'canceled') && (
        <div className="max-w-5xl mx-auto text-center mb-10">
          <Button
            onClick={handleManageSubscription}
            disabled={loadingPlan === 'portal'}
            variant="outline"
            className="inline-flex items-center gap-2 rounded-xl"
          >
            {loadingPlan === 'portal' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Manage subscription'
            )}
          </Button>
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-7">
        <h2 className="text-xl font-bold mb-5">Common questions</h2>
        <div className="space-y-5 text-sm">
          <div>
            <h3 className="font-semibold mb-1">How does the 7-day trial work?</h3>
            <p className="text-stone-600 dark:text-stone-400">
              Pick a plan and add your card. You&apos;ll have full access immediately. No charge for
              7 days — we&apos;ll email you the day before your card is charged.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Can I cancel before being charged?</h3>
            <p className="text-stone-600 dark:text-stone-400">
              Yes. Cancel any time during the trial from Manage subscription and you won&apos;t be
              charged a cent.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Can I switch between Plus and Care+?</h3>
            <p className="text-stone-600 dark:text-stone-400">
              Anytime. Upgrades start now; downgrades take effect at your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Is my data safe?</h3>
            <p className="text-stone-600 dark:text-stone-400">
              Yes. Everything is private. Payments run through Stripe — we never see your card number.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-10 text-center text-sm">
        <Link href="/account" className="text-[#1D9E75] hover:underline font-medium">
          Back to account
        </Link>
      </div>
    </div>
  );
}
