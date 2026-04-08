'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';

interface TrialBannerProps {
  trialEnd: Date | null;
  subscriptionStatus: string;
}

export function TrialBanner({ trialEnd, subscriptionStatus }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!trialEnd || subscriptionStatus !== 'trialing') {
      return;
    }

    const calculateDays = () => {
      const days = differenceInDays(new Date(trialEnd), new Date());
      setDaysLeft(Math.max(0, days));
    };

    calculateDays();
    const interval = setInterval(calculateDays, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialEnd, subscriptionStatus]);

  if (
    !trialEnd ||
    subscriptionStatus !== 'trialing' ||
    daysLeft === null ||
    dismissed ||
    daysLeft < 0
  ) {
    return null;
  }

  const isExpiringSoon = daysLeft < 2;

  return (
    <div
      className={`mx-auto px-4 py-3 rounded-lg flex items-center justify-between gap-4 ${
        isExpiringSoon
          ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
          : 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <AlertCircle
          className={`w-5 h-5 flex-shrink-0 ${
            isExpiringSoon
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        />
        <p
          className={`text-sm font-medium ${
            isExpiringSoon
              ? 'text-red-800 dark:text-red-200'
              : 'text-amber-800 dark:text-amber-200'
          }`}
        >
          {daysLeft === 0
            ? 'Your free trial ends today!'
            : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isExpiringSoon && (
          <Link href="/subscribe">
            <button className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg font-semibold text-sm hover:bg-[#16805f] transition-colors">
              Upgrade Now
            </button>
          </Link>
        )}
        <button
          onClick={() => setDismissed(true)}
          className={`p-1.5 rounded-md transition-colors ${
            isExpiringSoon
              ? 'hover:bg-red-100 dark:hover:bg-red-900'
              : 'hover:bg-amber-100 dark:hover:bg-amber-900'
          }`}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
