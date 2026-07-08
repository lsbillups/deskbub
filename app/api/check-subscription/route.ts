import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ tier: 'free', canGenerate: false }, { status: 401 });
    }

    const supabase = createAdminClient();
    let { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();

    // Auto-create free trial for dev/testing (8 generations)
    if (!data) {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        tier: 'plus',
        generations_used: 0,
        max_generations: 8,
      });
      data = { tier: 'plus', generations_used: 0, max_generations: 8 };
    }

    if (!data || data.tier === 'free') {
      return NextResponse.json({ tier: 'free', canGenerate: false });
    }

    const canGenerate = data.generations_used < data.max_generations;
    return NextResponse.json({
      tier: data.tier,
      canGenerate,
      used: data.generations_used,
      max: data.max_generations,
    });
  } catch {
    return NextResponse.json({ tier: 'free', canGenerate: false });
  }
}
