'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

const customTiers = [
  { name: 'Custom Basic', eyebrow: 'ONE ACTION', price: '$1', productId: 'prod_6tpK7rYSe4qOn0Gkwu5orH', description: 'Create one animated action for your own pet.', features: ['Upload one pet photo', 'One AI-generated animation', 'Transparent desktop pet', 'Pair with Windows or Mac', 'Keep and use it forever'], cta: 'Create 1 Custom Action — $1' },
  { name: 'Custom Plus', eyebrow: 'BEST VALUE', price: '$4.99', productId: 'prod_3plVm23uj3TPfXW0XpdaMo', description: 'Generate more options and keep your five favorites.', features: ['Upload 1–5 pet photos', 'Generate up to 8 animated clips', 'Keep your favorite 5', 'Choose different actions', 'Windows and macOS'], cta: 'Create a Full Custom Pet — $4.99' },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (productId: string) => {
    setLoading(productId);
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
      const data = await response.json();
      const destination = data.checkoutUrl || data.redirect;
      if (destination) window.location.assign(destination);
      else window.alert(data.error || 'Something went wrong. Please try again.');
    } catch {
      window.alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-cream pt-16">
      <section className="px-6 py-20 text-center sm:py-24">
        <span className="inline-flex rounded-full bg-coral/10 px-4 py-2 text-sm font-bold text-coral">CLEAR, ONE-TIME PRICING</span>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-extrabold leading-tight text-text-primary sm:text-6xl">Meet Kaka. Pay only for your own pet.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl leading-relaxed text-text-secondary">Kaka comes with DeskBub at no cost. Creating a custom pet is a one-time purchase—no subscription.</p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          <article className="flex flex-col rounded-3xl border-2 border-mint/40 bg-white p-8 shadow-sm">
            <span className="text-xs font-extrabold tracking-[0.18em] text-mint-dark">$0 · NO ACCOUNT OR PAYMENT</span>
            <h2 className="mt-3 font-display text-2xl font-bold text-text-primary">Kaka</h2>
            <p className="mt-3 text-text-secondary">DeskBub&apos;s official desktop dog.</p>
            <div className="mt-6 font-display text-5xl font-extrabold text-text-primary">$0</div>
            <ul className="mt-7 flex-1 space-y-3 text-sm text-text-secondary">{['Five animated Kaka actions', 'Water and stretch reminders', 'Instant Show/Hide controls', 'Windows and macOS', 'No account or payment required'].map((feature) => <li key={feature} className="flex gap-2"><span className="font-bold text-mint-dark">✓</span>{feature}</li>)}</ul>
            <Link href="/download" className="mt-8 rounded-full border-2 border-mint bg-white px-5 py-3 text-center font-bold text-mint-dark transition hover:bg-mint hover:text-white">Use Kaka for Free</Link>
          </article>

          {customTiers.map((tier, index) => (
            <article key={tier.name} className={`relative flex flex-col rounded-3xl bg-white p-8 shadow-sm ${index === 1 ? 'border-2 border-coral shadow-xl shadow-coral/10' : 'border border-gray-100'}`}>
              {index === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-extrabold text-white">BEST VALUE</span>}
              <span className="text-xs font-extrabold tracking-[0.18em] text-coral">{tier.eyebrow}</span>
              <h2 className="mt-3 font-display text-2xl font-bold text-text-primary">{tier.name}</h2>
              <p className="mt-3 min-h-12 text-text-secondary">{tier.description}</p>
              <div className="mt-6"><span className="font-display text-5xl font-extrabold text-text-primary">{tier.price}</span><span className="ml-2 text-sm text-text-secondary">one-time</span></div>
              <ul className="mt-7 flex-1 space-y-3 text-sm text-text-secondary">{tier.features.map((feature) => <li key={feature} className="flex gap-2"><span className="font-bold text-mint-dark">✓</span>{feature}</li>)}</ul>
              <button type="button" disabled={loading === tier.productId} onClick={() => handleCheckout(tier.productId)} className={`mt-8 cursor-pointer rounded-full px-5 py-3 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60 ${index === 1 ? 'bg-coral hover:bg-coral-dark' : 'bg-text-primary hover:bg-black'}`}>{loading === tier.productId ? 'Redirecting…' : tier.cta}</button>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-sm font-medium text-text-secondary">One-time payment. No subscription.</p>
      </section>
      <Footer />
    </main>
  );
}
