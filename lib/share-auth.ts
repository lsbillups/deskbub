import { currentUser } from '@clerk/nextjs/server';
import { resolveDeskBubAccount } from '@/lib/accounts/identity';
import { shareCampaignEnabled } from './share-claims';

export async function shareIdentity() {
  const account = await resolveDeskBubAccount();
  if (!account) return null;
  const user = await currentUser();
  if (!user || user.id !== account.clerkUserId) throw new Error('Please sign in again.');
  const verified = user.emailAddresses.filter(e => e.verification?.status === 'verified');
  const primary = verified.find(e => e.id === user.primaryEmailAddressId) || verified[0];
  if (!primary) throw new Error('Verify your email before submitting.');
  const allowed = (process.env.DESKBUB_SHARE_ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return { ...account, email: primary.emailAddress, admin: verified.some(e => allowed.includes(e.emailAddress.toLowerCase())) };
}
export function shareWriteCheck(request: Request) {
  if (!shareCampaignEnabled()) return 'The sharing pilot is not open yet.';
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin) return 'Please submit from DeskBub.';
  return null;
}
