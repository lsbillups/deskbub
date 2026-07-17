import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.', redirect: '/sign-in?redirect_url=/pricing' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const apiKey = process.env.CREEM_API_KEY;
    const productId = body.productId || process.env.CREEM_PRODUCT_ID;

    if (!apiKey || !productId) {
      return NextResponse.json({ error: 'Payment is not configured yet.' }, { status: 500 });
    }
    const pid: string = productId;

    const BASE = apiKey.startsWith('creem_test') ? 'https://test-api.creem.io' : 'https://api.creem.io';

    const response = await fetch(`${BASE}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: pid,
        request_id: `${userId}_${Date.now()}`,
        success_url: `${appUrl}/dashboard?upgraded=true`,
        metadata: { userId },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.checkout_url) {
      console.error('Creem checkout error:', data);
      return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, checkoutUrl: data.checkout_url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
