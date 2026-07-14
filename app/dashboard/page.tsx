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

  useEffect(() => {
    if (user) {
      let hash = 0;
      for (let i = 0; i < user.id.length; i++) {
        hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
        hash |= 0;
      }
      setPairingCode(String(Math.abs(hash) % 1000000).padStart(6, '0'));
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/check-subscription')
      .then(r => r.json())
      .then(d => {
        setTier(d.tier === 'plus' ? 'plus' : d.tier === 'basic' ? 'basic' : 'free');
        setGensUsed(d.used || 0);
        setGensMax(d.max || 0);
      });
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
            ) : (
              <Link href="/pricing"
                className="px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25">
                ⬆ Upgrade Plan
              </Link>
            )}
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
