import { NextRequest, NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const account = await resolveDeskBubAccount();
    const userId = account?.userId;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videos } = await request.json();
    const pairingCode = account!.pairingCode;
    if (!videos || !Array.isArray(videos)) return NextResponse.json({ error: 'Missing videos' }, { status: 400 });

    const supabase = createAdminClient();
    // Delete old entries, insert new ones
    await supabase.from('pet_data').delete().eq('user_id', userId);

    for (const v of videos) {
      if (v.url) {
        await supabase.from('pet_data').insert({
          user_id: userId,
          pairing_code: pairingCode || '',
          video_url: v.url,
          action_label: v.label || '',
          processed_url: '',
        });
      }
    }

    return NextResponse.json({ success: true, count: videos.filter((v: any) => v.url).length });
  } catch (err) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
