import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { shareIdentity } from '@/lib/share-auth';
import ShareReview from '@/components/share/ShareReview';
export const metadata: Metadata = { title: '分享申请审核 | DeskBub', robots: { index: false, follow: false } };
export default async function ShareReviewPage() {
  const identity = await shareIdentity();
  if (!identity?.admin) notFound();
  return <main className="min-h-screen bg-cream px-5 pb-16 pt-28"><div className="mx-auto max-w-4xl">
    <Link className="text-sm text-text-secondary underline underline-offset-4" href="/dashboard">返回 Dashboard</Link>
    <h1 className="mt-5 font-display text-3xl font-bold text-text-primary">分享申请审核</h1>
    <p className="mt-3 text-text-secondary">查看帖子后，通过并发放一次 Basic，或填写原因退回。</p>
    <ShareReview />
  </div></main>;
}
