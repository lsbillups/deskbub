import { createHmac, timingSafeEqual } from 'node:crypto';
import { PLANS, type Plan } from '../pricing';

const LEGACY_PRODUCTS: Record<string, Plan> = {
  prod_6tpK7rYSe4qOn0Gkwu5orH: 'basic', prod_3plVm23uj3TPfXW0XpdaMo: 'plus',
};
export function productForPlan(plan: Plan, env: NodeJS.ProcessEnv = process.env) {
  const id = env[plan === 'basic' ? 'CREEM_BASIC_PRODUCT_ID' : 'CREEM_PLUS_PRODUCT_ID'];
  if (!id || LEGACY_PRODUCTS[id]) throw new Error('New pricing products are not configured.');
  if (env.CREEM_BASIC_PRODUCT_ID === env.CREEM_PLUS_PRODUCT_ID) throw new Error('Pricing products must be distinct.');
  return id;
}
export function planForProduct(id: string, env: NodeJS.ProcessEnv = process.env): Plan | null {
  if (LEGACY_PRODUCTS[id]) return LEGACY_PRODUCTS[id];
  if (id && id === env.CREEM_BASIC_PRODUCT_ID) return 'basic';
  if (id && id === env.CREEM_PLUS_PRODUCT_ID) return 'plus';
  return null;
}
export function isLegacyProduct(id: string) {
  return Object.hasOwn(LEGACY_PRODUCTS, id);
}
export function verifyCreemSignature(raw: string, signature: string | null, secret: string) {
  if (!secret || !signature || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const computed = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(computed, Buffer.from(signature, 'hex'));
}
export function parsePaidCheckout(body: unknown, env: NodeJS.ProcessEnv = process.env) {
  const e = body as { id?: string; eventType?: string; object?: {
    status?: string; mode?: string; product?: { id?: string }; order?: { id?: string; status?: string; product?: string; mode?: string };
    metadata?: { userId?: string }; } };
  if (e?.eventType !== 'checkout.completed') return null;
  const o = e.object;
  if (typeof e.id !== 'string' || !e.id || typeof o?.order?.id !== 'string' || !o.order.id || o.status !== 'completed' || o.order.status !== 'paid') throw new Error('Invalid paid checkout.');
  const expectedMode = env.VERCEL_ENV === 'production' ? 'prod' : 'test';
  if (o.mode !== expectedMode || (o.order.mode && o.order.mode !== expectedMode)) throw new Error('Checkout environment mismatch.');
  const productId = o.product?.id || '';
  const plan = planForProduct(productId, env);
  if (!plan) throw new Error('Unknown checkout product.');
  if (o.order.product && o.order.product !== productId) throw new Error('Checkout product mismatch.');
  const userId = typeof o.metadata?.userId === 'string' && o.metadata.userId ? o.metadata.userId : null;
  const purchase = { eventId: e.id, orderId: o.order.id, productId, plan, credits: PLANS[plan].credits };
  if (isLegacyProduct(productId)) return { ...purchase, userId, handling: 'review' as const };
  if (!userId) throw new Error('Invalid paid checkout account.');
  return { ...purchase, userId, handling: 'grant' as const };
}
