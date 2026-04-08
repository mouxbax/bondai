'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type PricingTier = {
  id: 'free' | 'plus' | 'care_plus';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  priceId?: string;
  isCurrent?: boolean;
  trial?: boolean;
};

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showCanceledMessage = searchParams.get('checkout') === 'canceled';

  const tiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'Forever',
      description: 'Perfect for getting started',
      features: [
        '3 check-ins per week',
        'Basic daily check-ins',
        'Emotional tracking',
        'Basic goal setting',
        'Community support',
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 9,
      period: '/month',
      description: 'Everything you need to thrive',
      features: [
        'Unlimited check-ins',
        'Full coaching conversations',
        'Voice mode for check-ins',
        'Priority AI responses',
        'Advanced goal tracking',
        'Emotion analytics',
        'Ad-free experience',
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS,
      trial: true,
    },
    {
      id: 'care_plus',
      name: 'Care+',
      price: 19,
      period: '/month',
      description: 'Premium mental wellness platform',
      features: [
        'Everything in Plus',
        'Custom avatar & profile',
        'Family sharing (up to 3)',
        'Advanced analytics dashboard',
        'Personalized insights',
        'Priority support',
        'Early access to features',
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CARE_PLUS,
      trial: true,
    },
  ];

  const handleCheckout = async (priceId?: string) => {
    if (!priceId) return;

    setLoadingPlan(priceId);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Start free for 7 days, no credit card required
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Canceled Message */}
      {showCanceledMessage && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200">
            Checkout was canceled. Feel free to try again whenever you're ready.
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
              tier.id !== 'free' ? 'md:scale-105 ring-2 ring-[#1D9E75]' : ''
            }`}
          >
            {/* Trial Badge */}
            {tier.trial && (
              <div className="absolute top-4 right-4 bg-[#1D9E75] text-white px-3 py-1 rounded-full text-sm font-semibold">
                7-day free trial
              </div>
            )}

            {/* Card Content */}
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {tier.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">
                  ${tier.price}
                </span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">
                  {tier.period}
                </span>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => {
                  if (tier.priceId) {
                    handleCheckout(tier.priceId);
                  } else {
                    router.push('/home');
                  }
                }}
                disabled={loadingPlan !== null}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                  tier.id === 'free'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    : 'bg-[#1D9E75] text-white hover:bg-[#16805f] disabled:opacity-75'
                }`}
              >
                {loadingPlan === tier.priceId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Loading...
                  </>
                ) : tier.id === 'free' ? (
                  'Current Plan'
                ) : (
                  'Start Free Trial'
                )}
              </Button>

              {/* Features */}
              <div className="space-y-4">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#1D9E75] flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manage Subscription Button */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <Button
          onClick={handleManageSubscription}
          disabled={loadingPlan === 'portal'}
          variant="outline"
          className="inline-flex items-center gap-2"
        >
          {loadingPlan === 'portal' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Manage Subscription'
          )}
        </Button>
      </div>

      {/* FAQ / Info Section */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              How does the free trial work?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Start any paid plan with 7 days free. No credit card required to begin. You'll
              have full access to all features during the trial period.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Can I change plans?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect at
              your next billing cycle.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We accept all major credit and debit cards through Stripe. Your payment
              information is secure and encrypted.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Absolutely. Cancel your subscription at any time from your account settings. You
              won't be charged again after cancellation.
            </p>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <Link href="/home">
          <span className="text-[#1D9E75] hover:text-[#16805f] font-semibold underline cursor-pointer">
            Back to Home
          </span>
        </Link>
      </div>
    </div>
  );
}
