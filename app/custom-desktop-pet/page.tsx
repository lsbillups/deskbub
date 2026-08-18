import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Turn Your Pet Photo Into a Custom Desktop Pet',
  description: 'Create an animated desktop companion from a real pet photo. Custom desktop pets for Windows and Mac start at $1 with no subscription.',
  alternates: { canonical: '/custom-desktop-pet' },
  openGraph: {
    title: 'Turn Your Pet Photo Into a Custom Desktop Pet',
    description: 'Create a Windows or Mac desktop companion from one real pet photo. One-time pricing starts at $1.',
    url: 'https://deskbub.com/custom-desktop-pet',
  },
};

const photoTips = [
  'Use a clear, well-lit photo.',
  'Keep the whole face and body visible when possible.',
  'Avoid hands, furniture, or other pets covering the subject.',
];

export default function CustomDesktopPetPage() {
  return (
    <main className="min-h-screen bg-cream pt-16">
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full bg-coral/10 px-4 py-2 text-sm font-bold text-coral">ONE PHOTO · YOUR ACTUAL PET</span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-extrabold leading-tight text-text-primary sm:text-6xl">Turn Your Pet Photo Into a Custom Desktop Pet</h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-text-secondary">Upload a clear photo of your dog, cat, or other pet. DeskBub turns it into a transparent animated companion for Windows and Mac. Custom generation is paid with a one-time purchase.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/pricing" className="rounded-full bg-coral px-7 py-3.5 font-bold text-white shadow-xl shadow-coral/25 hover:bg-coral-dark">See Custom Pricing</Link>
            <Link href="/free-desktop-pet" className="rounded-full border-2 border-gray-200 bg-white px-7 py-3 font-bold text-text-primary hover:border-coral/30">Try Kaka Free First</Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ['1', 'Choose a photo', 'Start with one clear photo of your pet.'],
              ['2', 'Generate an action', 'DeskBub creates a transparent animation.'],
              ['3', 'Pick your result', 'Plus gives you more generations and favorites.'],
              ['4', 'Pair the app', 'Enter your code and replace Kaka with your pet.'],
            ].map(([number, title, description]) => <article key={number} className="rounded-2xl border border-gray-100 bg-cream p-6"><span className="grid h-9 w-9 place-items-center rounded-full bg-coral font-bold text-white">{number}</span><h2 className="mt-5 font-display text-lg font-bold text-text-primary">{title}</h2><p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-white"><Image src="/media/kaka/kaka.jpg" alt="The original photo of Kaka used for a custom desktop pet" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover object-[50%_35%]" /><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-text-primary">ONE PHOTO</span></div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-b from-[#dbeafe] to-[#f8d5c2]"><video src="/media/kaka/kaka-happy.webm" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-contain p-3" aria-label="Kaka transformed into an animated desktop pet" /><span className="absolute bottom-3 left-3 rounded-full bg-text-primary px-3 py-1.5 text-xs font-bold text-white">DESKTOP PET</span></div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">A better starting photo helps</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Make your pet easy to recognize.</h2>
            <ul className="mt-6 space-y-4">{photoTips.map((tip) => <li key={tip} className="flex gap-3 text-text-secondary"><span className="font-bold text-mint-dark">✓</span><span>{tip}</span></li>)}</ul>
          </div>
        </div>
      </section>

      <section className="bg-text-primary px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Custom generation starts at $1.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">Choose one action with Basic, or generate more options and keep your five favorites with Plus. One-time payment, no subscription.</p>
          <Link href="/pricing" className="mt-8 inline-block rounded-full bg-coral px-7 py-3.5 font-bold text-white hover:bg-coral-dark">Compare Custom Plans</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
