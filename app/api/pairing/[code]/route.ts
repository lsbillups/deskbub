import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid pairing code.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pet_data')
      .select('video_url, processed_url, action_label, processed_url')
      .eq('pairing_code', code)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'No pet found for this code.' }, { status: 404 });
    }

    const videos = data
      .filter((d: any) => d.video_url)
      .map((d: any) => ({ url: d.video_url, label: d.action_label || 'Pet action', imageUrl: d.processed_url || '' }));

    return NextResponse.json({
      videos: videos.length > 0 ? videos : null,
      videoUrl: videos.length > 0 ? videos[0].url : null, // backward compat
      imageUrl: null,
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
