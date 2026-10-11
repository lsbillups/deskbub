import { auth, currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertBusinessWritesAllowed } from '@/lib/runtime-safety';
import { emailKey } from './email-key';

export async function resolveDeskBubAccount() {
  const { userId } = await auth();
  if (!userId) return null;
  assertBusinessWritesAllowed();
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const legacy = key.startsWith('pk_test_');
  if (!legacy && !key.startsWith('pk_live_')) throw new Error('Invalid authentication configuration.');
  const instance = process.env.DESKBUB_AUTH_INSTANCE;
  if (!instance) throw new Error('Authentication instance is not configured.');
  const user = await currentUser();
  if (!user || user.id !== userId) throw new Error('Cannot verify account.');
  const emails = user.emailAddresses.filter(e => e.verification?.status === 'verified');
  if (!emails.length) throw new Error('Please verify your email address first.');
  const secret = process.env.MIGRATION_EMAIL_HMAC_SECRET || '';
  const keys = legacy ? [] : emails.map(e => emailKey(e.emailAddress, secret));
  const db = createAdminClient();
  const { data, error } = await db.rpc('deskbub_resolve_identity', {
    p_instance: instance, p_clerk_id: userId, p_email_keys: keys, p_legacy: legacy,
  });
  if (error || !data?.userId || !data?.pairingCode) throw new Error('Account recovery is temporarily unavailable. Your existing data is preserved.');
  return { userId: data.userId as string, pairingCode: data.pairingCode as string, clerkUserId: userId };
}
