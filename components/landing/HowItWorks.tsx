import Link from 'next/link';

const steps = [
  { number: '01', emoji: '📷', title: 'Upload one photo', description: 'Start with a clear photo of your dog, cat, rabbit, bird, or another pet.' },
  { number: '02', emoji: '✨', title: 'Choose your option', description: 'Create one action with Basic or generate more choices and keep five with Plus.' },
  { number: '03', emoji: '🎬', title: 'Get your animations', description: 'DeskBub creates transparent movements designed to float above your apps.' },
  { number: '04', emoji: '🖥️', title: 'Put them on your desktop', description: 'Download the app, enter your pairing code, and choose how your pet behaves.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Your custom pet journey</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">One clear next step, all the way to your desktop</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">You&apos;ll always know where you are and what comes next.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.number} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between"><span className="text-4xl">{step.emoji}</span><span className="font-display text-sm font-extrabold text-coral/60">{step.number}</span></div>
              <h3 className="mt-6 font-display text-xl font-bold text-text-primary">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-text-secondary">{step.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <Link href="/upload" className="rounded-full bg-coral px-7 py-3.5 font-bold text-white shadow-lg shadow-coral/20 hover:bg-coral-dark">Start with My Pet Photo</Link>
          <Link href="/download" className="rounded-full border-2 border-text-primary/10 bg-white px-7 py-3 font-bold text-text-primary hover:border-mint/50">I&apos;d Rather Try Kaka First</Link>
        </div>
      </div>
    </section>
  );
}
