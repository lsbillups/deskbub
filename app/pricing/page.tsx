'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const tiers = [
  {
    name: 'Free',
    emoji: '🐾',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for trying out DeskBub with your furry friend.',
    features: [
      '1 pet on your desktop',
      '6 animation states',
      'Health reminders (water, stretch, eyes)',
      'Default reminder intervals',
      'Windows & macOS',
    ],
    cta: 'Get Started Free',
    href: '/sign-up',
    primary: false,
  },
  {
    name: 'DeskBub Plus',
    emoji: '⭐',
    price: '$4.99',
    period: 'per month',
    desc: 'For pet lovers who want the full experience.',
    features: [
      'Everything in Free, plus:',
      'Custom reminder messages',
      'More animations & expressions',
      'Adjustable pet size & opacity',
      'Multi-device sync',
      'Priority support',
    ],
    cta: 'Upgrade to Plus',
    href: '/api/create-checkout-session',
    primary: true,
    yearlyPrice: '$39.99/year',
  },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-coral bg-coral/10 rounded-full">
            💰 Simple pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary">
            Free, then upgrade when you love it
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            Start with a free pet. Upgrade to Plus for custom reminders, more animations, and multi-device sync.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl p-8 ${
                tier.primary
                  ? 'bg-white border-2 border-coral shadow-xl shadow-coral/10'
                  : 'bg-white border border-gray-100'
              }`}
            >
              {tier.primary && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-coral text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </span>
              )}

              <div className="text-4xl mb-4">{tier.emoji}</div>
              <h2 className="text-xl font-display font-bold text-text-primary">{tier.name}</h2>
              <p className="text-sm text-text-secondary mt-1 mb-6">{tier.desc}</p>

              <div className="mb-6">
                <span className="text-4xl font-display font-extrabold text-text-primary">{tier.price}</span>
                <span className="text-text-secondary text-sm ml-1">/{tier.period}</span>
                {tier.yearlyPrice && (
                  <p className="text-sm text-mint font-semibold mt-1">{tier.yearlyPrice}</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-mint mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {tier.primary ? (
                isSignedIn ? (
                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Redirecting...' : tier.cta}
                  </button>
                ) : (
                  <Link
                    href="/sign-up"
                    className="block w-full py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-all shadow-lg shadow-coral/25 text-center"
                  >
                    {tier.cta}
                  </Link>
                )
              ) : (
                <Link
                  href={tier.href}
                  className="block w-full py-3 border-2 border-gray-200 text-text-primary font-semibold rounded-full hover:border-coral/30 hover:text-coral transition-all text-center"
                >
                  {tier.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-text-secondary/60 text-sm mt-10"
        >
          Cancel anytime. No questions asked.
        </motion.p>
      </div>
    </main>
  );
}
