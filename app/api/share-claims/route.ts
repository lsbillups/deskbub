import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { shareIdentity, shareWriteCheck } from '@/lib/share-auth';
import { sharePostFromLink, SHARE_CAMPAIGN, SHARE_SELECT, shareCampaignEnabled } from '@/lib/share-claims';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  try {
    const identity = await shareIdentity();
    if (!identity) return NextResponse.json({ error: 'Please sign in.' }, { status: 401, headers });
    const db = createAdminClient();
    const [claim, eligible] = await Promise.all([
      db.from('deskbub_share_claims').select(SHARE_SELECT).eq('user_id', identity.userId).eq('campaign', SHARE_CAMPAIGN).maybeSingle(),
      db.rpc('deskbub_share_eligible', { p_user_id: identity.userId }),
    ]);
    if (claim.error || eligible.error) throw new Error('Unavailable');
    return NextResponse.json({ claim: claim.data, eligible: eligible.data === true, admin: identity.admin,
      enabled: shareCampaignEnabled(), staging: process.env.DESKBUB_CUSTOM_STAGING === '1' }, { headers });
  } catch {
    return NextResponse.json({ error: 'Your sharing application could not be loaded. Please retry.' }, { status: 503, headers });
  }
}
export async function POST(request: Request) {
  try {
    const identity = await shareIdentity();
    if (!identity) return NextResponse.json({ error: 'Please sign in.' }, { status: 401, headers });
    const blocked = shareWriteCheck(request);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 403, headers });
    if (Number(request.headers.get('content-length') || 0) > 6000) return NextResponse.json({ error: 'Submission is too long.' }, { status: 413, headers });
    const body = await request.json().catch(() => null);
    if (!body || body.confirmed !== true) {
      return NextResponse.json({ error: 'Confirm that you are submitting your own public post.' }, { status: 400, headers });
    }
    let post;
    try { post = sharePostFromLink(body.url); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400, headers }); }
    const { error } = await createAdminClient().rpc('deskbub_submit_share', { p_user_id: identity.userId, p_email: identity.email,
      p_platform: post.platform, p_post_id: post.postId, p_post_url: post.url, p_handle: post.handle });
    if (error) {
      const message = error.code === '23505' ? 'This post is already linked to an application.' :
        error.code === 'P0001' ? error.message : 'Your application could not be saved. Please retry.';
      return NextResponse.json({ error: message }, { status: 409, headers });
    }
    return NextResponse.json({ success: true }, { headers });
  } catch { return NextResponse.json({ error: 'Your application could not be saved. Please retry.' }, { status: 503, headers }); }
}
