import Link from 'next/link';

const products = [
  { eyebrow: 'INCLUDED', title: 'Meet Kaka', description: 'Use the official DeskBub pet for free. No upload, payment, or account required.', points: ['Five Kaka actions', 'Water and stretch reminders', 'Windows and macOS'], cta: 'Use Kaka for Free', href: '/download', accent: 'border-mint/40 bg-mint/5' },
  { eyebrow: 'FROM $1', title: 'Bring Your Own Pet', description: 'Upload one clear photo of your dog, cat, rabbit, bird, or other pet and create a companion that looks like them.', points: ['Your actual pet', 'Transparent animation', 'One-time purchase'], cta: 'Upload a Pet Photo', href: '/upload', accent: 'border-coral/40 bg-coral/5' },
];

export default function ProductChoice() {
  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Start with Kaka—or make it personal.</h2>
          <p className="mt-3 text-lg text-text-secondary">Two clear choices. No subscription hiding behind either one.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {products.map((product) => (
            <article key={product.title} className={`rounded-3xl border-2 p-8 sm:p-10 ${product.accent}`}>
              <span className="text-xs font-extrabold tracking-[0.2em] text-coral">{product.eyebrow}</span>
              <h3 className="mt-3 font-display text-3xl font-bold text-text-primary">{product.title}</h3>
              <p className="mt-4 leading-relaxed text-text-secondary">{product.description}</p>
              <ul className="mt-6 space-y-3 text-sm font-medium text-text-primary">{product.points.map((point) => <li key={point}>✓ {point}</li>)}</ul>
              <Link href={product.href} className="mt-8 inline-block rounded-full bg-text-primary px-6 py-3 font-bold text-white transition hover:bg-coral">{product.cta}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
