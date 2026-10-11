import { randomUUID } from 'node:crypto';
import { assertCheckoutAllowed } from '../runtime-safety';
import type { Plan } from '../pricing';
import { productForPlan } from './payments';

type CheckoutRpc = (name: string, args: Record<string, string | number>) =>
  PromiseLike<{ data: unknown; error: unknown }>;

export async function createTrackedCheckout(userId: string, plan: Plan, rpc: CheckoutRpc,
  env: NodeJS.ProcessEnv = process.env, request: typeof fetch = fetch, requestId = randomUUID()) {
  assertCheckoutAllowed(env);
  const productId = productForPlan(plan, env);
  const key = env.CREEM_API_KEY;
  if (!key || !userId || !env.NEXT_PUBLIC_APP_URL) throw new Error('Checkout configuration missing');
  const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
  if (appUrl.protocol !== 'https:' || appUrl.username || appUrl.password) throw new Error('Invalid app URL');
  const mode = key.startsWith('creem_test_') ? 'test' : 'prod';
  const base = mode === 'test' ? 'https://test-api.creem.io' : 'https://api.creem.io';
  const price = plan === 'basic' ? 299 : 999;
  const productResponse = await request(base + '/v1/products?product_id=' + encodeURIComponent(productId), {
    headers: { 'x-api-key': key }, signal: AbortSignal.timeout(15000),
  });
  const product = await productResponse.json();
  if (!productResponse.ok || product.id !== productId || product.price !== price || product.currency !== 'USD' ||
    product.billing_type !== 'onetime' || product.status !== 'active' || product.mode !== mode) {
    throw new Error('Product does not match advertised price');
  }
  // request_id is a correlation ID. Do not assume Creem deduplicates POST requests.
  const intent = await rpc('deskbub_begin_checkout', { p_request_id: requestId, p_user_id: userId,
    p_product_id: productId, p_plan: plan, p_mode: mode, p_amount: price });
  if (intent.error || (intent.data as { created?: boolean } | null)?.created !== true) {
    throw new Error('Checkout intent was not newly recorded');
  }
  const response = await request(base + '/v1/checkouts', {
    method: 'POST', headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, request_id: requestId,
      success_url: new URL('/dashboard?upgraded=true', appUrl).href, metadata: { userId } }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  const returnedProduct = typeof data.product === 'string' ? data.product : data.product?.id;
  // Creem can omit request_id from its create response. In that case, require the echoed account metadata.
  const requestMatches = data.request_id === requestId ||
    (data.request_id == null && data.metadata?.userId === userId);
  if (!response.ok || typeof data.id !== 'string' || !data.id || data.mode !== mode || returnedProduct !== productId ||
    !requestMatches || (data.metadata?.userId != null && data.metadata.userId !== userId) ||
    typeof data.checkout_url !== 'string') throw new Error('Invalid checkout response');
  const checkoutUrl = new URL(data.checkout_url);
  if (checkoutUrl.protocol !== 'https:' || checkoutUrl.username || checkoutUrl.password) throw new Error('Invalid checkout URL');
  const saved = await rpc('deskbub_complete_checkout', { p_request_id: requestId, p_user_id: userId,
    p_checkout_id: data.id, p_checkout_url: checkoutUrl.href });
  if (saved.error || (saved.data as { recorded?: boolean } | null)?.recorded !== true) throw new Error('Checkout recording failed');
  return { checkoutUrl: checkoutUrl.href };
}
