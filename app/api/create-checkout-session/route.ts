import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_xxxx')) {
      return NextResponse.json(
        { error: 'Stripe is not configured yet. Add your STRIPE_SECRET_KEY to .env.local' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Monthly: $4.99
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?checkout=cancelled`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    return NextResponse.redirect(session.url!);
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session. Is STRIPE_PRICE_ID set?' },
      { status: 500 }
    );
  }
}
