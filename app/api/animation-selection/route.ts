import { NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    const db = createAdminClient();
    const collection = await db.from('deskbub_animation_collections').select('status,videos').eq('user_id', account.userId).maybeSingle();
    if (collection.error) throw new Error('Selection unavailable');
    if (collection.data) return NextResponse.json(collection.data);
    const old = await db.from('pet_data').select('video_url,action_label').eq('user_id', account.userId).order('created_at', { ascending: false });
    if (old.error) throw new Error('Saved pets unavailable');
    const videos = (old.data || []).filter(v => v.video_url).map(v => ({ url: v.video_url, label: v.action_label || 'Pet animation' }));
    return NextResponse.json({ status: videos.length ? 'finalized' : 'draft', videos });
  } catch {
    return NextResponse.json({ error: 'Your saved selection could not be loaded. Please refresh before continuing.' }, { status: 503 });
  }
}
