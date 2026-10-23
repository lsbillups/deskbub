import { NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildPetDashboard } from '@/lib/dashboard';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in to see your pets.' }, { status: 401, headers });
    const db = createAdminClient();
    const [subscription, collection, jobs, legacy] = await Promise.all([
      db.from('subscriptions').select('tier,generations_used,max_generations').eq('user_id', account.userId).single(),
      db.from('deskbub_animation_collections').select('status,videos').eq('user_id', account.userId).maybeSingle(),
      db.from('deskbub_animation_jobs').select('kind,status,created_at,payload,result').eq('user_id', account.userId).order('created_at', { ascending: false }).limit(101),
      db.from('pet_data').select('video_url,action_label').eq('user_id', account.userId),
    ]);
    if ([subscription, collection, jobs, legacy].some(r => r.error) || !subscription.data) throw new Error('Saved pets unavailable');
    return NextResponse.json(buildPetDashboard({ subscription: subscription.data, collection: collection.data,
      jobs: (jobs.data || []).slice(0, 100), legacy: legacy.data || [], pairingCode: account.pairingCode,
      storageOrigin: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin, staging: process.env.DESKBUB_CUSTOM_STAGING === '1',
      truncated: (jobs.data?.length || 0) > 100 }), { headers });
  } catch { return NextResponse.json({ error: 'Your saved pets could not be loaded. Please retry; your existing work is preserved.' }, { status: 503, headers }); }
}
