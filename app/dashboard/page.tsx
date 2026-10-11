'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useUser();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [tier, setTier] = useState('free');
  const [gensUsed, setGensUsed] = useState(0);
  const [gensMax, setGensMax] = useState(0);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'waiting' | 'confirmed' | 'delayed'>('none');

  useEffect(() => {
    const returnedFromCheckout = new URLSearchParams(window.location.search).get('upgraded') === 'true';
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    if (returnedFromCheckout) setPaymentStatus('waiting');
    const loadAccount = async () => {
      attempts++;
      try {
        const r = await fetch('/api/check-subscription', { cache: 'no-store' });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (cancelled) return;
        setTier(d.tier === 'plus' ? 'plus' : d.tier === 'basic' ? 'basic' : 'free');
        setGensUsed(d.used || 0);
        setGensMax(d.max || 0);
        setPairingCode(d.pairingCode);
        setAccountError(null);
        // The return URL is only a signal to recheck. Only the server balance confirms access.
        if (!returnedFromCheckout) return;
        if (d.tier !== 'free' && d.max > 0) { setPaymentStatus('confirmed'); return; }
      } catch (e) {
        if (cancelled) return;
        setAccountError(e instanceof Error ? e.message : 'Please retry loading your account.');
      }
      if (returnedFromCheckout && attempts < 20) timer = setTimeout(loadAccount, 1500);
      else if (returnedFromCheckout) setPaymentStatus('delayed');
    };
    void loadAccount();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const gensLeft = Math.max(0, gensMax - gensUsed);

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary text-center">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}! 🐾
          </h1>
        </motion.div>

        {/* Plan Status Card */}
        {accountError && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{accountError}</p>}
        {paymentStatus === 'waiting' && <p role="status" className="mt-6 rounded-xl bg-mint/10 p-4 text-sm text-text-primary">Confirming your purchase. Your generation balance will update here automatically.</p>}
        {paymentStatus === 'delayed' && <p role="status" className="mt-6 rounded-xl bg-mint/10 p-4 text-sm text-text-primary">Payment confirmation is taking longer than expected. Refresh this page in a moment. If you completed payment, please do not pay again. <Link href="/contact" className="font-semibold underline">Contact us</Link> if your balance still has not updated.</p>}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                tier === 'plus' ? 'bg-coral/10 text-coral' : tier === 'basic' ? 'bg-mint/10 text-mint' : 'bg-gray-100 text-text-secondary'
              }`}>
                {tier === 'plus' ? '🌟 Plus' : tier === 'basic' ? '⭐ Basic' : '🐾 Free'}
              </span>
              <p className="mt-2 text-2xl font-display font-bold text-text-primary">
                {gensMax > 0 ? `${gensLeft}/${gensMax}` : '0'} <span className="text-sm font-normal text-text-secondary">generations left</span>
              </p>
            </div>
            <div className="text-right">
              {gensMax === 0 && <p className="text-sm text-text-secondary">No generations yet</p>}
              {gensMax > 0 && gensLeft === 0 && <p className="text-sm text-coral font-medium">All used — share or upgrade!</p>}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-5 flex gap-3 flex-wrap">
            {gensLeft > 0 ? (
              <Link href="/upload"
                className="px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25">
                📸 Upload Pet Photo
              </Link>
            ) : paymentStatus !== 'waiting' && paymentStatus !== 'delayed' ? (
              <Link href="/pricing"
                className="px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25">
                ⬆ Upgrade Plan
              </Link>
            ) : null}
            <Link href="/download"
              className="px-5 py-2.5 bg-mint text-white text-sm font-semibold rounded-full hover:bg-mint-dark transition-all shadow-lg shadow-mint/25">
              ⬇ Download DeskBub
            </Link>
          </div>
        </motion.div>

        {/* Pairing Code */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-6 bg-mint/5 rounded-2xl border border-mint/20 p-6 text-center">
          <p className="text-sm font-semibold text-mint mb-2">🔗 Your Pairing Code</p>
          <code className="text-4xl font-mono font-bold tracking-[0.3em] text-coral select-all">
            {pairingCode || '------'}
          </code>
          <p className="text-xs text-text-secondary/60 mt-2">
            Enter this code in the DeskBub desktop app to sync your pet.
          </p>
        </motion.div>

        {/* No pet yet? */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-6 text-center">
          <p className="text-text-secondary text-sm">
            New to DeskBub?{' '}
            <Link href="/upload" className="text-coral font-semibold hover:underline">
              Upload a photo to get started
            </Link>
            {' '}or{' '}
            <Link href="/download" className="text-mint font-semibold hover:underline">
              download the app
            </Link>.
          </p>
        </motion.div>

      </div>
    </main>
  );
}
