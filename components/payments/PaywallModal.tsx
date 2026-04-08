'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  plan: 'free' | 'plus' | 'care_plus';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PaywallModal({ isOpen, onClose, feature, plan }: PaywallModalProps) {
  const [isLoading] = useState(false);

  const featureDetails: Record<
    string,
    { title: string; description: string; requiredPlan: string }
  > = {
    unlimited_checkins: {
      title: 'Unlimited Check-ins',
      description: 'You\'ve reached your weekly check-in limit. Upgrade to Plus for unlimited check-ins.',
      requiredPlan: 'Plus',
    },
    voice_mode: {
      title: 'Voice Mode',
      description: 'Voice check-ins are a Plus feature. Upgrade to unlock voice conversations.',
      requiredPlan: 'Plus',
    },
    family_sharing: {
      title: 'Family Sharing',
      description: 'Invite family members to share your wellness journey. Care+ only.',
      requiredPlan: 'Care+',
    },
    analytics: {
      title: 'Advanced Analytics',
      description: 'Get detailed insights into your emotional patterns. Care+ only.',
      requiredPlan: 'Care+',
    },
    avatar: {
      title: 'Custom Avatar',
      description: 'Personalize your BondAI with a custom avatar. Care+ only.',
      requiredPlan: 'Care+',
    },
  };

  const details = featureDetails[feature] || {
    title: 'Premium Feature',
    description: 'This feature requires a paid subscription.',
    requiredPlan: 'Plus',
  };

  const features = [
    { name: 'Unlimited check-ins', plus: true, careplus: true },
    { name: 'Full coaching conversations', plus: true, careplus: true },
    { name: 'Voice mode', plus: true, careplus: true },
    { name: 'Priority AI responses', plus: true, careplus: true },
    { name: 'Custom avatar', plus: false, careplus: true },
    { name: 'Family sharing', plus: false, careplus: true },
    { name: 'Advanced analytics', plus: false, careplus: true },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{details.title}</DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature Comparison */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
              What you&apos;ll unlock:
            </h4>
            <div className="space-y-3">
              {features.map((f) => {
                const isIncluded =
                  details.requiredPlan === 'Plus' ? f.plus : f.careplus;
                return (
                  <div
                    key={f.name}
                    className={`flex items-center gap-3 p-2 rounded ${
                      isIncluded
                        ? 'bg-[#1D9E75]/10'
                        : 'opacity-50'
                    }`}
                  >
                    {isIncluded ? (
                      <Check className="w-5 h-5 text-[#1D9E75] flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        isIncluded
                          ? 'text-slate-900 dark:text-white font-medium'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {f.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {details.requiredPlan === 'Care+' ? 'Care+' : 'Plus'} plan
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {details.requiredPlan === 'Care+' ? '$19' : '$9'}/month
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              7-day free trial, cancel anytime
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe later
            </Button>
            <Link href="/subscribe" className="flex-1">
              <Button
                className="w-full bg-[#1D9E75] text-white hover:bg-[#16805f]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Upgrade Now'
                )}
              </Button>
            </Link>
          </div>

          {/* Trust Signal */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Secure payment by Stripe • No credit card required for free trial
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
