import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { shareIdentity, shareWriteCheck } from '@/lib/share-auth';
import { SHARE_CAMPAIGN, SHARE_SELECT, shareCampaignEnabled } from '@/lib/share-claims';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  try {
    const admin = await shareIdentity();
    if (!admin?.admin) return NextResponse.json({ error: 'Administrator access required.' }, { status: admin ? 403 : 401, headers });
    const status = new URL(request.url).searchParams.get('status') || 'pending';
    if (!['pending','changes_requested','approved'].includes(status)) return NextResponse.json({ error: 'Invalid filter.' }, { status: 400, headers });
    const db = createAdminClient();
    const [claims, rewards] = await Promise.all([
      db.from('deskbub_share_claims').select(SHARE_SELECT + ',email,user_id,revision', { count: 'exact' })
        .eq('campaign', SHARE_CAMPAIGN).eq('status', status).order('updated_at', { ascending: false }).limit(100),
      db.from('deskbub_share_rewards').select('claim_id', { count: 'exact', head: true }).eq('campaign', SHARE_CAMPAIGN),
    ]);
    if (claims.error || rewards.error) throw new Error('Unavailable');
    return NextResponse.json({ claims: claims.data, total: claims.count, granted: rewards.count,
      enabled: shareCampaignEnabled(), staging: process.env.DESKBUB_CUSTOM_STAGING === '1' }, { headers });
  } catch { return NextResponse.json({ error: 'The review queue could not be loaded. Please retry.' }, { status: 503, headers }); }
}
export async function POST(request: Request) {
  try {
    const admin = await shareIdentity();
    if (!admin?.admin) return NextResponse.json({ error: 'Administrator access required.' }, { status: admin ? 403 : 401, headers });
    const blocked = shareWriteCheck(request);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 403, headers });
    const body = await request.json().catch(() => null);
    if (!body || !/^[0-9a-f-]{36}$/i.test(body.id) || !['approved','changes_requested'].includes(body.decision) ||
      !Number.isSafeInteger(body.revision) || typeof body.note !== 'string' || body.note.length > 500 ||
      (body.decision === 'changes_requested' && !body.note.trim())) {
      return NextResponse.json({ error: 'Choose an application and add a reason when requesting changes.' }, { status: 400, headers });
    }
    const { error } = await createAdminClient().rpc('deskbub_review_share', { p_id: body.id, p_actor: admin.clerkUserId,
      p_decision: body.decision, p_note: body.note.trim(), p_revision: body.revision });
    if (error) return NextResponse.json({ error: error.code === 'P0001' ? error.message : 'No reward was issued. Please refresh and retry.' }, { status: 409, headers });
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: 'The review could not be saved. Refresh before trying again.' }, { status: 503, headers }); }
}
