import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Disable body parsing — Stripe needs raw body
export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      console.log(`✅ Payment completed for user: ${userId}`);
      // Here you'd update Supabase: set user subscription to 'plus'
      // await supabase.from('subscriptions').upsert({ user_id: userId, tier: 'plus', ... })
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log(`❌ Subscription cancelled: ${subscription.id}`);
      // Here you'd update Supabase: set user subscription to 'free'
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log(`🔄 Subscription updated: ${subscription.id}, status: ${subscription.status}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
