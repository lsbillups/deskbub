import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleCreemWebhook } from '@/lib/creem/webhook';

export async function POST(request: NextRequest) {
  const result = await handleCreemWebhook(await request.text(), request.headers.get('creem-signature'),
    (name, args) => createAdminClient().rpc(name, args));
  return NextResponse.json(result.body, { status: result.status });
}
