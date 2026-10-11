export function assertBusinessWritesAllowed(env: NodeJS.ProcessEnv = process.env) {
  const mode = env.DESKBUB_DATA_ENVIRONMENT;
  const production = env.VERCEL_ENV === 'production';
  if (production && mode === 'production') return;
  if (!production && mode === 'sandbox' && env.DESKBUB_SANDBOX_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_URL === env.DESKBUB_SANDBOX_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_URL !== env.DESKBUB_PRODUCTION_SUPABASE_URL) return;
  throw new Error('This preview cannot change customer data. Configure an isolated sandbox first.');
}

export function assertCheckoutAllowed(env: NodeJS.ProcessEnv = process.env) {
  assertBusinessWritesAllowed(env);
  const testKey = env.CREEM_API_KEY?.startsWith('creem_test_');
  if (env.VERCEL_ENV !== 'production' && !testKey) throw new Error('Preview checkout requires Creem test mode.');
  if (env.VERCEL_ENV === 'production' && testKey) throw new Error('Production checkout requires live mode.');
  if (!env.CREEM_WEBHOOK_SECRET) throw new Error('Payment verification is not configured.');
}
