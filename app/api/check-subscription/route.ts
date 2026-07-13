import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ tier: 'free', canGenerate: false, used: 0, max: 0 }, { status: 401 });
    }

    const supabase = createAdminClient();
    let { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();

    // New users start as Free (0 generations)
    if (!data) {
      await supabase.from('subscriptions').upsert({
        user_id: userId, tier: 'free', generations_used: 0, max_generations: 0,
      });
      data = { tier: 'free', generations_used: 0, max_generations: 0 };
    }

    const canGenerate = (data.generations_used || 0) < (data.max_generations || 0);
    return NextResponse.json({
      tier: data.tier || 'free',
      canGenerate,
      used: data.generations_used || 0,
      max: data.max_generations || 0,
    });
  } catch {
    return NextResponse.json({ tier: 'free', canGenerate: false, used: 0, max: 0 });
  }
}
