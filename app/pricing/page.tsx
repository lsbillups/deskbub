'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

const tiers = [
  {
    name: 'Free',
    emoji: '🐾',
    price: '$0',
    period: '',
    desc: 'Share to unlock one free pet action per day.',
    features: [
      'Share on social media to unlock',
      '1 pet action per day',
      'Basic animations',
      '10 daily free spots',
    ],
    cta: 'Share to Unlock',
    href: '/upload',
    primary: false,
  },
  {
    name: 'Basic',
    emoji: '⭐',
    price: '$1.00',
    period: 'one-time',
    desc: 'One pet action. Simple and affordable.',
    promo: true,
    features: [
      '1 pet action',
      'Full AI video generation',
      'Transparent desktop pet',
      'Download & keep forever',
    ],
    cta: 'Get Basic — $1.00',
    href: null, // Will use Creem checkout
    primary: false,
    productId: 'prod_60Egf7GJt88AU9bWJ8cKGz',
  },
  {
    name: 'Plus',
    emoji: '🌟',
    price: '$4.99',
    period: 'one-time',
    desc: 'Five actions, three redo slots. Best value.',
    promo: true,
    features: [
      '5 pet actions',
      '3 redo slots included',
      'Cat, dog, or other pets',
      'Transparent desktop pet',
      'All Basic features',
    ],
    cta: 'Get Plus — $4.99',
    href: null, // Will use Creem checkout
    primary: true,
    productId: 'prod_3iVWs9zbilzhQKD73DMYab',
  },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (productId: string) => {
    setLoading(productId);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch {
      alert('Failed to start checkout.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-coral bg-coral/10 rounded-full">💡 Simple pricing</span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary">Bring your pet to life</h1>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            Share to try for free, or unlock more actions for your desktop companion.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-7 flex flex-col ${tier.primary ? 'bg-white border-2 border-coral shadow-xl shadow-coral/10' : 'bg-white border border-gray-100'}`}>
              {tier.primary && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-coral text-white text-xs font-bold rounded-full">BEST VALUE</span>}

              <div className="text-4xl mb-3">{tier.emoji}</div>
              <h2 className="text-xl font-display font-bold text-text-primary">{tier.name}</h2>
              <p className="text-sm text-text-secondary mt-1 mb-4">{tier.desc}</p>

              <div className="mb-5">
                <span className="text-4xl font-display font-extrabold text-text-primary">{tier.price}</span>
                {tier.period && <span className="text-text-secondary text-sm ml-1">/{tier.period}</span>}
                {tier.promo && <p className="text-xs text-coral font-medium mt-1">🎉 Launch price — will increase soon</p>}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-mint mt-0.5 shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>

              {tier.name === 'Free' ? (
                isSignedIn ? (
                  <Link href="/upload" className="block w-full py-3 border-2 border-gray-200 text-text-primary font-semibold rounded-full hover:border-coral/30 hover:text-coral transition-all text-center text-sm">
                    {tier.cta}
                  </Link>
                ) : (
                  <Link href="/sign-up" className="block w-full py-3 border-2 border-gray-200 text-text-primary font-semibold rounded-full hover:border-coral/30 hover:text-coral transition-all text-center text-sm">
                    Sign Up & Share
                  </Link>
                )
              ) : (
                <button onClick={() => handleCheckout(tier.productId!)} disabled={loading === tier.productId}
                  className={`w-full py-3 text-white font-semibold rounded-full transition-all text-sm shadow-lg cursor-pointer
                    ${tier.primary ? 'bg-coral hover:bg-coral-dark shadow-coral/25' : 'bg-text-primary hover:bg-black shadow-gray-200/50'}
                    disabled:opacity-60 disabled:cursor-wait`}>
                  {loading === tier.productId ? 'Redirecting...' : tier.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-center text-text-secondary/60 text-sm mt-10">
          One-time payment. No subscription. Pet forever.
        </motion.p>
      </div>
    </main>
  );
}
