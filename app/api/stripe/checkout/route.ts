import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import stripe, { PRICE_PLUS, PRICE_CARE_PLUS } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { priceId } = body;

    // Validate price ID
    if (!priceId || (priceId !== PRICE_PLUS && priceId !== PRICE_CARE_PLUS)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = '';
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          userId: user?.id || session.user.email,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      if (user) {
        await prisma.user.update({
          where: { email: session.user.email },
          data: { stripeCustomerId },
        });
      }
    }

    // Create checkout session with 7-day free trial
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiah.app';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      // Force the user to enter a card even though they're starting a free
      // trial — that's the whole point of the paywall: real intent + auto-charge.
      payment_method_collection: 'always',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user?.id || session.user.email,
        },
      },
      success_url: `${appUrl}/home?checkout=success`,
      cancel_url: `${appUrl}/subscribe?checkout=canceled`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[STRIPE_CHECKOUT_ERROR] message:', msg);
    console.error('[STRIPE_CHECKOUT_ERROR] full:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return NextResponse.json(
      { error: `Failed to create checkout session: ${msg}` },
      { status: 500 }
    );
  }
}
