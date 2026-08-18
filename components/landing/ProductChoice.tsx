import Link from 'next/link';

const paths = [
  {
    eyebrow: 'MAKE IT YOURS · FROM $1',
    title: 'Create a pet from my photo',
    description: 'Choose this path when you want the companion on your desktop to look like your own pet.',
    steps: ['Upload one clear pet photo', 'Choose a one-time custom option', 'Generate, download, and pair your pet'],
    cta: 'Create My Desktop Pet',
    href: '/upload',
    card: 'border-coral/50 shadow-xl shadow-coral/10',
    button: 'bg-coral hover:bg-coral-dark',
  },
  {
    eyebrow: 'TRY DESKBUB · $0',
    title: 'Start with Kaka',
    description: 'Choose this path when you want to experience the desktop app before creating a custom pet.',
    steps: ['Download DeskBub for Windows or Mac', 'Open the app—no account or code', 'Kaka appears with five actions'],
    cta: 'Try Kaka First',
    href: '/download',
    card: 'border-mint/50',
    button: 'bg-text-primary hover:bg-black',
  },
];

export default function ProductChoice() {
  return (
    <section id="start" className="scroll-mt-20 bg-text-primary px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Choose one path</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">What do you want on your desktop?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/65">You only need to make one decision. We&apos;ll guide you through everything after that.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {paths.map((path) => (
            <article key={path.title} className={`flex flex-col rounded-3xl border-2 bg-white p-8 text-text-primary sm:p-10 ${path.card}`}>
              <span className="text-xs font-extrabold tracking-[0.18em] text-coral">{path.eyebrow}</span>
              <h3 className="mt-3 font-display text-3xl font-bold">{path.title}</h3>
              <p className="mt-4 min-h-12 leading-relaxed text-text-secondary">{path.description}</p>
              <div className="mt-7 flex-1 rounded-2xl bg-cream p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-text-secondary">Your path</p>
                <ol className="mt-4 space-y-4">
                  {path.steps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3 text-sm font-semibold">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-extrabold text-coral shadow-sm">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <Link href={path.href} className={`mt-7 block rounded-full px-6 py-3.5 text-center font-bold text-white transition ${path.button}`}>{path.cta}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
