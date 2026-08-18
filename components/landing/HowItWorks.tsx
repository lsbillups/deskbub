import Link from 'next/link';

const steps = [
  { number: '01', emoji: '📥', title: 'Download DeskBub', description: 'Choose the Windows or macOS installer. Kaka is already included.' },
  { number: '02', emoji: '⚡', title: 'Open the app', description: 'No account or pairing code is required to start with Kaka.' },
  { number: '03', emoji: '🐾', title: 'Meet Kaka', description: 'Move him around your desktop and adjust how he looks and behaves.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">No setup maze</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">A desktop companion in three simple steps</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="rounded-3xl border border-gray-100 bg-cream p-7">
              <div className="flex items-center justify-between"><span className="text-4xl">{step.emoji}</span><span className="font-display text-sm font-extrabold text-coral/60">{step.number}</span></div>
              <h3 className="mt-6 font-display text-xl font-bold text-text-primary">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-text-secondary">{step.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-coral/15 bg-coral/5 p-6 text-center text-text-secondary">
          Ready to make it personal? <Link href="/custom-desktop-pet" className="font-bold text-coral underline underline-offset-4">Create a custom pet from your own photo.</Link>
        </div>
      </div>
    </section>
  );
}
