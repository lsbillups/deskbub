import { createHmac } from 'node:crypto';

export function emailKey(email: string, secret: string) {
  if (secret.length < 32) throw new Error('Migration email key must be at least 32 characters.');
  return createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex');
}
