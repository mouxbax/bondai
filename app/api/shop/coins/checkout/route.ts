import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { getCoinPackById, getTotalCoins } from '@/lib/coin-packs';

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
    const { packId } = body;

    // Validate pack exists
    const pack = getCoinPackById(packId);
    if (!pack) {
      return NextResponse.json(
        { error: 'Invalid coin pack' },
        { status: 400 }
      );
    }

    // Verify Stripe price ID is configured
    if (!pack.stripePriceId) {
      return NextResponse.json(
        { error: 'Coin pack not available' },
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

    // Create checkout session for coin purchase (payment mode, not subscription)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiah.app';
    const totalCoins = getTotalCoins(pack);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: pack.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user?.id || session.user.email,
        packId: pack.id,
        coins: totalCoins.toString(),
      },
      success_url: `${appUrl}/shop?purchase=success`,
      cancel_url: `${appUrl}/shop?purchase=canceled`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[COINS_CHECKOUT_ERROR] message:', msg);
    console.error('[COINS_CHECKOUT_ERROR] full:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return NextResponse.json(
      { error: `Failed to create checkout session: ${msg}` },
      { status: 500 }
    );
  }
}
