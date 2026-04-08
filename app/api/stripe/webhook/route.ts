import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any;

      if (session.customer) {
        // Get customer to find user
        const customer = await stripe.customers.retrieve(session.customer as string);
        const userId = (customer.metadata?.userId) as string;

        if (userId) {
          // Get subscription details
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            const priceId = subscription.items.data[0]?.price.id;
            const plan = getPlanFromPriceId(priceId || '');

            // Update user subscription
            await prisma.user.update({
              where: { id: userId },
              data: {
                stripeCustomerId: session.customer as string,
                subscriptionStatus: subscription.trial_end ? 'trialing' : 'active',
                subscriptionPlan: plan,
                trialEnd: subscription.trial_end
                  ? new Date(subscription.trial_end * 1000)
                  : null,
                currentPeriodEnd: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000)
                  : null,
              },
            });
          }
        }
      }
    }

    // Handle customer.subscription.updated
    if (event.type === 'customer.subscription.updated') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = event.data.object as any;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const userId = (customer.metadata?.userId) as string;

      if (userId) {
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId || '');

        // Determine status
        let status = 'active';
        if (subscription.status === 'trialing') {
          status = 'trialing';
        } else if (subscription.status === 'past_due') {
          status = 'past_due';
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subscriptionStatus: status as any,
            subscriptionPlan: plan,
            trialEnd: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        });
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = event.data.object as any;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const userId = (customer.metadata?.userId) as string;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionPlan: 'free',
            trialEnd: null,
            currentPeriodEnd: null,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}

/**
 * Get plan type from Stripe price ID
 */
function getPlanFromPriceId(priceId: string): string {
  const PRICE_PLUS = process.env.STRIPE_PRICE_PLUS || 'price_plus_default';
  const PRICE_CARE_PLUS = process.env.STRIPE_PRICE_CARE_PLUS || 'price_care_plus_default';

  if (priceId === PRICE_PLUS) return 'plus';
  if (priceId === PRICE_CARE_PLUS) return 'care_plus';
  return 'free';
}
