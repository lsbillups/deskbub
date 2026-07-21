import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Basic → 1 gen, Plus → 8 gens
const PRODUCT_TIERS: Record<string, { tier: string; max: number }> = {
  prod_6tpK7rYSe4qOn0Gkwu5orH: { tier: 'basic', max: 1 },
  prod_3plVm23uj3TPfXW0XpdaMo: { tier: 'plus', max: 8 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body?.eventType;

    // Only handle checkout.completed
    if (eventType !== 'checkout.completed') {
      return NextResponse.json({ received: true });
    }

    const productId = body?.object?.product?.id;
    const metadata = body?.object?.metadata || {};
    const userId = metadata?.userId;

    if (!userId || !productId) {
      console.warn('Webhook missing userId or productId');
      return NextResponse.json({ received: true });
    }

    const config = PRODUCT_TIERS[productId];
    if (!config) {
      console.warn('Unknown product:', productId);
      return NextResponse.json({ received: true });
    }

    console.log(`✅ Creem: Upgrading ${userId} to ${config.tier} (${config.max} gens)`);

    const supabase = createAdminClient();
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      tier: config.tier,
      generations_used: 0,
      max_generations: config.max,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Creem webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
