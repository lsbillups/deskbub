import { NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { assertCheckoutAllowed } from '@/lib/runtime-safety';
import { productForPlan } from '@/lib/creem/payments';
import { createTrackedCheckout } from '@/lib/creem/checkout';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    assertCheckoutAllowed();
    const body = await req.json();
    if (body.plan !== 'basic' && body.plan !== 'plus') return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    productForPlan(body.plan);
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.', redirect: '/sign-in?redirect_url=/pricing' }, { status: 401 });
    return NextResponse.json(await createTrackedCheckout(account.userId, body.plan,
      (name, args) => createAdminClient().rpc(name, args)));
  } catch {
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}
