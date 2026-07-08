'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useUser();
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  // Generate a stable 6-digit pairing code from user ID
  useEffect(() => {
    if (user) {
      // Simple hash to 6 digits
      let hash = 0;
      for (let i = 0; i < user.id.length; i++) {
        hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
        hash |= 0;
      }
      const code = String(Math.abs(hash) % 1000000).padStart(6, '0');
      setPairingCode(code);
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}! 🐾
          </h1>
          <p className="mt-2 text-text-secondary">Manage your DeskBub pet here.</p>
        </motion.div>

        {/* Status Cards */}
        <div className="mt-8 grid sm:grid-cols-2 gap-6">
          {/* Pet Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-display font-bold text-text-primary">Your Pet</h3>
            <p className="text-sm text-text-secondary mt-1">
              No pet yet. Upload a photo to bring your pet to life!
            </p>
            <Link
              href="/upload"
              className="inline-block mt-4 px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25"
            >
              Upload Pet Photo
            </Link>
          </motion.div>

          {/* Pairing Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-display font-bold text-text-primary">Pairing Code</h3>
            <p className="text-sm text-text-secondary mt-1">
              Enter this code in the DeskBub desktop app to sync your pet.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <code className="text-3xl font-mono font-bold tracking-[0.3em] text-coral bg-coral/5 px-4 py-2 rounded-xl select-all">
                {pairingCode || '------'}
              </code>
            </div>
            <p className="text-xs text-text-secondary/60 mt-2">
              This code is unique to your account.
            </p>
          </motion.div>
        </div>

        {/* Download Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-mint/5 rounded-2xl border border-mint/20 p-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display font-bold text-text-primary">Desktop App</h3>
              <p className="text-sm text-text-secondary">Download the DeskBub desktop app to see your pet.</p>
            </div>
            <Link
              href="/download"
              className="px-6 py-3 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all shadow-lg shadow-mint/25 text-sm"
            >
              Download DeskBub
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
