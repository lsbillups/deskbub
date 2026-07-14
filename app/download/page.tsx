'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

export default function DownloadPage() {
  const { user, isSignedIn } = useUser();
  const [os, setOs] = useState<'windows' | 'mac' | 'unknown'>('unknown');

  const pairingCode = useMemo(() => {
    if (!user) return null;
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) { hash = ((hash << 5) - hash) + user.id.charCodeAt(i); hash |= 0; }
    return String(Math.abs(hash) % 1000000).padStart(6, '0');
  }, [user]);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) setOs('windows');
    else if (ua.includes('mac')) setOs('mac');
  }, []);

  const primaryOs = os === 'mac' ? 'mac' : 'windows';

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-mint bg-mint/10 rounded-full">
            🎉 Your pet is ready!
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary">
            Download DeskBub
          </h1>
          <p className="mt-4 text-lg text-text-secondary">
            Install the desktop app and your furry friend will appear on your screen.
          </p>
        </motion.div>

        {/* OS Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex justify-center gap-4"
        >
          <button
            onClick={() => setOs('windows')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              os === 'windows'
                ? 'bg-coral text-white shadow-lg shadow-coral/25'
                : 'bg-white border border-gray-200 text-text-secondary hover:border-coral/30'
            }`}
          >
            🪟 Windows
          </button>
          <button
            onClick={() => setOs('mac')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              os === 'mac'
                ? 'bg-coral text-white shadow-lg shadow-coral/25'
                : 'bg-white border border-gray-200 text-text-secondary hover:border-coral/30'
            }`}
          >
            🍎 macOS
          </button>
        </motion.div>

        {/* Download Card */}
        <motion.div
          key={os}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm"
        >
          <div className="text-5xl mb-4">{os === 'mac' || primaryOs === 'mac' ? '🍎' : '🪟'}</div>
          <h2 className="text-xl font-display font-bold text-text-primary mb-2">
            DeskBub for {os === 'mac' ? 'macOS' : os === 'windows' ? 'Windows' : 'Windows & macOS'}
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Version 1.0.0 · Free download · 10-second install
          </p>

          {os === 'windows' || os === 'unknown' ? (
            <a
              href="https://github.com/lsbillups/deskbub/releases/latest/download/DeskBub-Windows.exe"
              className="inline-block px-8 py-3.5 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-all shadow-xl shadow-coral/30 text-lg cursor-pointer"
            >
              Download for Windows
            </a>
          ) : null}
          {os === 'mac' || os === 'unknown' ? (
            <a
              href="https://github.com/lsbillups/deskbub/releases/latest/download/DeskBub-macOS.dmg"
              className={`inline-block px-8 py-3.5 bg-mint text-white font-semibold rounded-full hover:bg-mint-dark transition-all shadow-xl shadow-mint/30 text-lg cursor-pointer ${os === 'unknown' ? 'ml-4' : ''}`}
            >
              Download for macOS
            </a>
          ) : null}

          <p className="mt-4 text-xs text-text-secondary/60">
            No account needed to download. Sign in to sync your pet.
          </p>
        </motion.div>

        {/* Pairing Code — shown only when logged in */}
        {isSignedIn && pairingCode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-6 bg-mint/5 rounded-2xl border border-mint/20 p-6 text-center max-w-lg mx-auto">
            <p className="text-sm font-semibold text-mint mb-2">🔗 Your Pairing Code</p>
            <code className="text-3xl font-mono font-bold tracking-[0.3em] text-coral select-all">{pairingCode}</code>
            <p className="text-xs text-text-secondary/60 mt-2">After installing, open the app and enter this code. Your pet will appear!</p>
          </motion.div>
        )}

        {/* Install Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid sm:grid-cols-3 gap-6 text-left"
        >
          {[
            { step: '1', emoji: '📥', title: 'Download', desc: `Get the installer for ${os === 'mac' ? 'macOS' : os === 'windows' ? 'Windows' : 'your OS'}.` },
            { step: '2', emoji: '⚡', title: 'Install', desc: 'Double-click to install. Takes about 10 seconds.' },
            { step: '3', emoji: '🐾', title: 'Enjoy!', desc: 'Your pet appears on your desktop. Sign in to use your own photo.' },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-xs font-bold text-coral mb-1">STEP {s.step}</div>
              <h3 className="font-display font-bold text-text-primary text-sm">{s.title}</h3>
              <p className="text-text-secondary text-xs mt-1">{s.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-left max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-display font-bold text-text-primary text-center mb-8">
            Frequently Asked Questions
          </h3>
          {[
            {
              q: 'Is DeskBub safe to install?',
              a: 'Absolutely. DeskBub is a lightweight desktop app. Your pet images are encrypted and never shared. The app does not access any of your files or data.',
            },
            {
              q: 'Does it work on Windows and Mac?',
              a: 'Yes! We support Windows 10/11 and macOS 12+. Download the version for your operating system above.',
            },
            {
              q: 'How do I use my own pet photo?',
              a: 'Sign in on the website and upload a photo of your pet. Our AI removes the background. Then use the pairing code in the desktop app to load your real pet.',
            },
            {
              q: 'Can I change my pet later?',
              a: 'Of course! Just upload a new photo from your dashboard and your desktop pet updates instantly.',
            },
          ].map((faq, i) => (
            <details key={i} className="group mb-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
              <summary className="px-6 py-4 font-semibold text-text-primary cursor-pointer hover:text-coral transition-colors list-none flex items-center justify-between">
                {faq.q}
                <span className="text-lg group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12"
        >
          <p className="text-text-secondary text-sm mb-4">
            Already have a pet?{' '}
            <Link href="/sign-up" className="text-coral font-semibold hover:underline">
              Sign up and upload your own photo
            </Link>
          </p>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
