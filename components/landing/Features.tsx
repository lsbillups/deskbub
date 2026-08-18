import Link from 'next/link';

const features = [
  { emoji: '🖱️', title: 'Easy to control', description: 'Click your pet to switch actions, change its size, and tune its opacity.' },
  { emoji: '🧲', title: 'Lives above your desktop', description: 'Drag your companion wherever it feels comfortable without replacing your wallpaper.' },
  { emoji: '💧', title: 'Gentle break reminders', description: 'Let Kaka remind you to drink water or stand and stretch at an interval you choose.' },
  { emoji: '👋', title: 'Show or hide instantly', description: 'Hide your pet in one click when you need a clear screen, then bring it back just as quickly.' },
  { emoji: '📤', title: 'Ready to share', description: 'Prepare your pet animation and caption for TikTok, X, or Instagram from the desktop app.' },
  { emoji: '🐾', title: 'Any pet can be the star', description: 'Start with Kaka, or upload a dog, cat, rabbit, bird, or another pet you love.' },
];

export default function Features() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">A tiny companion, not another complicated app</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">DeskBub stays simple while giving you control when you want it.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
              <div className="text-4xl">{feature.emoji}</div>
              <h3 className="mt-4 font-display text-xl font-bold text-text-primary">{feature.title}</h3>
              <p className="mt-2 leading-relaxed text-text-secondary">{feature.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 text-center"><Link href="/upload" className="inline-block rounded-full bg-coral px-7 py-3.5 font-bold text-white shadow-lg shadow-coral/20 hover:bg-coral-dark">Create My Desktop Pet</Link></div>
      </div>
    </section>
  );
}
