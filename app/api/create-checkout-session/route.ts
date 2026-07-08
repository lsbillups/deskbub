import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }

    const apiKey = process.env.CREEM_API_KEY;
    const productId = process.env.CREEM_PRODUCT_ID;

    if (!apiKey || !productId) {
      return NextResponse.json({ error: 'Payment is not configured yet.' }, { status: 500 });
    }

    const BASE = apiKey.startsWith('creem_test') ? 'https://test-api.creem.io' : 'https://api.creem.io';

    const response = await fetch(`${BASE}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        request_id: `${userId}_${Date.now()}`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?upgraded=true`,
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
