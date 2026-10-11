import { assertCheckoutAllowed } from '../runtime-safety';
import { parsePaidCheckout, verifyCreemSignature } from './payments';

type PurchaseRpc = (name: string, args: Record<string, string | number | null>) =>
  PromiseLike<{ data: unknown; error: unknown }>;

export async function handleCreemWebhook(raw: string, signature: string | null, rpc: PurchaseRpc, env: NodeJS.ProcessEnv = process.env) {
  if (!verifyCreemSignature(raw, signature, env.CREEM_WEBHOOK_SECRET || '')) {
    return { status: 401, body: { error: 'Invalid signature.' } };
  }
  try {
    assertCheckoutAllowed(env);
    const purchase = parsePaidCheckout(JSON.parse(raw), env);
    if (!purchase) return { status: 200, body: { received: true } };
    const review = purchase.handling === 'review';
    const { data, error } = await rpc(review ? 'deskbub_quarantine_purchase' : 'deskbub_grant_purchase', review ? {
      p_event_id: purchase.eventId, p_order_id: purchase.orderId, p_user_id: purchase.userId,
      p_product_id: purchase.productId,
    } : {
      p_event_id: purchase.eventId, p_order_id: purchase.orderId, p_user_id: purchase.userId,
      p_tier: purchase.plan, p_credits: purchase.credits,
    });
    const result = data as { quarantined?: boolean; duplicate?: boolean } | null;
    if (error || !result || typeof result.duplicate !== 'boolean' || (review && result.quarantined !== true)) {
      throw new Error('Payment recording failed');
    }
    return { status: 200, body: review ? { received: true, pendingReview: true } : { received: true } };
  } catch {
    // Retry when either a new grant or a historical review record failed to commit.
    return { status: 503, body: { error: 'Payment processing unavailable.' } };
  }
}
