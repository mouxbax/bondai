import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import stripe, { PRICE_PLUS, PRICE_CARE_PLUS } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
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
      customer_email: session.user.email,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
