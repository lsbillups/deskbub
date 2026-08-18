import Link from 'next/link';

const features = [
  { emoji: '📷', title: 'Your pet—not a generic character', description: 'Start with one photo of the dog, cat, rabbit, bird, or other pet that matters to you.' },
  { emoji: '🧲', title: 'Actually lives on your desktop', description: 'Your companion floats above your apps instead of becoming a wallpaper or staying inside a video.' },
  { emoji: '👋', title: 'Stays out of your way', description: 'Drag, resize, fade, or hide your pet instantly whenever you need a completely clear screen.' },
  { emoji: '💧', title: 'Helpful when you want it', description: 'Optional water and stretch reminders turn your companion into a gentle break buddy.' },
  { emoji: '💻', title: 'Made for Windows and Mac', description: 'Use the same simple DeskBub experience on Windows 10/11 or macOS 12 and later.' },
  { emoji: '📤', title: 'Easy to share', description: 'Prepare your pet animation and caption for TikTok, X, or Instagram from the desktop app.' },
];

export default function Features() {
  return (
    <section id="why-deskbub" className="scroll-mt-20 bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Why DeskBub</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Personal enough to feel like yours. Simple enough to live with.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">A desktop pet should feel personal, stay out of your way, and be useful only when you want it.</p>
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
