import { NextRequest, NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLocalSandboxStorage } from '@/lib/generation/media';

export async function POST(request: NextRequest) {
  try {
    const account = await resolveDeskBubAccount();
    const userId = account?.userId;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const videos = body?.videos;
    if (typeof body?.finalize !== 'boolean') return NextResponse.json({ error: 'Please refresh before saving your selection.' }, { status: 409 });
    const pairingCode = account!.pairingCode;
    if (!Array.isArray(videos) || videos.length > 8 || videos.some(v => {
      if (!v || typeof v.url !== 'string' || v.url.length > 8192 ||
          (v.label !== undefined && (typeof v.label !== 'string' || v.label.length > 160))) return true;
      try { const url = new URL(v.url); return (url.protocol !== 'https:' && !isLocalSandboxStorage(url)) || !!url.username || !!url.password; }
      catch { return true; }
    })) return NextResponse.json({ error: 'Invalid videos' }, { status: 400 });

    const supabase = createAdminClient();
    // The old list remains intact if any insert fails in this transaction.
    const { error } = await supabase.rpc('deskbub_confirm_animation_selection', {
      p_user_id: userId, p_pairing_code: pairingCode || '', p_videos: videos, p_finalize: body.finalize,
    });
    if (error) return NextResponse.json({ error: 'Sync could not finish. Your generated files are still saved.' }, { status: 503 });
    return NextResponse.json({ success: true, count: videos.length });
  } catch {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
