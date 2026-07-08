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
      .select('video_url, processed_url')
      .eq('pairing_code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'No pet found for this code.' }, { status: 404 });
    }

    return NextResponse.json({
      videoUrl: data.video_url || null,
      imageUrl: data.processed_url || null,
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
