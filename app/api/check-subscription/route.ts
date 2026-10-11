import { NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    const { data, error } = await createAdminClient().from('subscriptions').select('*').eq('user_id', account.userId).single();
    if (error || !data) throw new Error('Account unavailable');
    return NextResponse.json({ tier: data.tier, used: data.generations_used || 0, max: data.max_generations || 0,
      canGenerate: (data.generations_used || 0) < (data.max_generations || 0), pairingCode: account.pairingCode });
  } catch {
    return NextResponse.json({ error: 'Your account could not be loaded. Please retry; your existing purchases are preserved.' }, { status: 503 });
  }
}
