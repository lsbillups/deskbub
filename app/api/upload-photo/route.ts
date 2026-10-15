import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { createAdminClient } from '@/lib/supabase/admin';

// The photo goes directly to Storage, avoiding the function body size limit.
export async function POST(request: Request) {
  try {
    const account = await resolveDeskBubAccount();
    if (!account) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    const body = await request.json();
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = typeof body.contentType === 'string' && Object.hasOwn(extensions, body.contentType) ? extensions[body.contentType] : undefined;
    if (!ext || !Number.isInteger(body.size) || body.size <= 0 || body.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Please choose a JPG, PNG or WebP photo up to 10 MB.' }, { status: 400 });
    }
    const db = createAdminClient();
    const sub = await db.from('subscriptions').select('tier,generations_used,max_generations').eq('user_id', account.userId).single();
    if (sub.error || !sub.data) return NextResponse.json({ error: 'Your allowance could not be loaded.' }, { status: 503 });
    if (!['basic', 'plus'].includes(sub.data.tier) || sub.data.generations_used >= sub.data.max_generations) {
      return NextResponse.json({ error: 'No generations remaining.' }, { status: 403 });
    }
    const path = `original/${account.userId}/${randomUUID()}.${ext}`;
    const bucket = db.storage.from('pet-photos');
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: 'Photo upload is temporarily unavailable.' }, { status: 503 });
    return NextResponse.json({ path: data.path, token: data.token, publicUrl: bucket.getPublicUrl(path).data.publicUrl });
  } catch {
    return NextResponse.json({ error: 'Photo upload could not be prepared.' }, { status: 503 });
  }
}
