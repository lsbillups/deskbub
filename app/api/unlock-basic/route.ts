import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';

const DAILY_LIMIT = 10;

export async function POST() {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 2. Check if user already has a paid tier
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();

    if (sub && (sub.tier === 'basic' || sub.tier === 'plus')) {
      return NextResponse.json({ error: 'You have already unlocked Basic or have a paid plan.' }, { status: 400 });
    }

    // 3. Check if user already unlocked before (one per person)
    const { data: existing } = await supabase
      .from('daily_unlocks')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You have already unlocked Basic. One unlock per person.' }, { status: 400 });
    }

    // 4. Check today's unlock count
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from('daily_unlocks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    if (countErr) {
      console.error('Count error:', countErr);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    if (count !== null && count >= DAILY_LIMIT) {
      return NextResponse.json({
        error: `Today's ${DAILY_LIMIT} free spots are all taken. Please try again tomorrow!`,
      }, { status: 400 });
    }

    // 5. Record the unlock
    const { error: insertErr } = await supabase
      .from('daily_unlocks')
      .insert({ user_id: userId });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    // 6. Upgrade subscription to Basic (1 generation)
    const { error: upsertErr } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        tier: 'basic',
        generations_used: 0,
        max_generations: 1,
      });

    if (upsertErr) {
      console.error('Upsert error:', upsertErr);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tier: 'basic' });
  } catch (err) {
    console.error('Unlock basic error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
